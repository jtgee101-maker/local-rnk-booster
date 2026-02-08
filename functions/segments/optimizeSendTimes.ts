import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

/**
 * Send-Time Optimization
 * ML-predicted best times to email each segment
 */
Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { segment_id, email } = await req.json();

    if (segment_id) {
      // Optimize send times for a specific segment
      const segment = await base44.asServiceRole.entities.Segment.get(segment_id);
      if (!segment) {
        return Response.json({ error: 'Segment not found' }, { status: 404 });
      }

      const optimalTimes = await analyzeSegmentSendTimes(base44, segment);
      
      await base44.asServiceRole.entities.Segment.update(segment_id, {
        optimal_send_times: optimalTimes.best_times
      });

      return Response.json({
        success: true,
        segment_name: segment.name,
        optimal_times: optimalTimes
      });
    }

    if (email) {
      // Get optimal send time for individual lead
      const lead = await base44.asServiceRole.entities.Lead.filter({
        email: email
      }, 'created_date', 1);

      if (lead.length === 0) {
        return Response.json({ error: 'Lead not found' }, { status: 404 });
      }

      const optimalTime = await analyzeLeadSendTime(base44, lead[0]);
      return Response.json({
        success: true,
        email: email,
        optimal_send_time: optimalTime
      });
    }

    return Response.json({ error: 'segment_id or email required' }, { status: 400 });

  } catch (error) {
    console.error('Send-time optimization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}));

async function analyzeSegmentSendTimes(base44, segment) {
  const leadIds = segment.lead_ids || [];
  
  // Analyze email engagement by time of day
  const emails = await base44.asServiceRole.entities.EmailLog.filter({
    metadata: { lead_id: { $in: leadIds } }
  }, 'created_date', 1000);

  const timeSlotPerformance = {};
  
  for (const email of emails) {
    if (!email.first_opened_at) continue;

    const sentTime = new Date(email.created_date);
    const openedTime = new Date(email.first_opened_at);
    const hour = sentTime.getHours();
    
    const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
    
    if (!timeSlotPerformance[timeSlot]) {
      timeSlotPerformance[timeSlot] = {
        sent: 0,
        opened: 0,
        time_to_open_avg: []
      };
    }

    timeSlotPerformance[timeSlot].sent++;
    timeSlotPerformance[timeSlot].opened++;
    
    const timeToOpen = (openedTime - sentTime) / (1000 * 60); // minutes
    timeSlotPerformance[timeSlot].time_to_open_avg.push(timeToOpen);
  }

  // Calculate open rates and average time to open
  const analysis = [];
  for (const [timeSlot, stats] of Object.entries(timeSlotPerformance)) {
    const openRate = stats.sent > 0 ? (stats.opened / stats.sent) * 100 : 0;
    const avgTimeToOpen = stats.time_to_open_avg.length > 0
      ? stats.time_to_open_avg.reduce((a, b) => a + b, 0) / stats.time_to_open_avg.length
      : 0;

    analysis.push({
      time: timeSlot,
      open_rate: Math.round(openRate),
      avg_time_to_open_minutes: Math.round(avgTimeToOpen),
      sample_size: stats.sent
    });
  }

  // Sort by open rate
  analysis.sort((a, b) => b.open_rate - a.open_rate);

  // Get top 3 times
  const bestTimes = analysis.slice(0, 3).map(a => a.time);

  // If no data, use industry defaults
  if (bestTimes.length === 0) {
    return {
      best_times: ['09:00', '14:00', '16:00'],
      confidence: 'low',
      reason: 'Using industry defaults - insufficient data'
    };
  }

  return {
    best_times: bestTimes,
    confidence: analysis[0].sample_size > 20 ? 'high' : 'medium',
    detailed_analysis: analysis.slice(0, 5)
  };
}

async function analyzeLeadSendTime(base44, lead) {
  // Get lead's email engagement history
  const emails = await base44.asServiceRole.entities.EmailLog.filter({
    to: lead.email
  }, 'created_date', 50);

  const openedEmails = emails.filter(e => e.first_opened_at);

  if (openedEmails.length === 0) {
    // No history, check segment
    const segments = await base44.asServiceRole.entities.Segment.filter({
      lead_ids: { $in: [lead.id] }
    }, 'created_date', 10);

    if (segments.length > 0 && segments[0].optimal_send_times?.length > 0) {
      return {
        time: segments[0].optimal_send_times[0],
        confidence: 'medium',
        reason: 'Based on segment behavior'
      };
    }

    return {
      time: '10:00',
      confidence: 'low',
      reason: 'Default time - no historical data'
    };
  }

  // Analyze when they typically open emails
  const openHours = openedEmails.map(e => new Date(e.first_opened_at).getHours());
  const hourFrequency = {};
  
  openHours.forEach(hour => {
    hourFrequency[hour] = (hourFrequency[hour] || 0) + 1;
  });

  const mostFrequentHour = Object.keys(hourFrequency).reduce((a, b) => 
    hourFrequency[a] > hourFrequency[b] ? a : b
  );

  return {
    time: `${mostFrequentHour.padStart(2, '0')}:00`,
    confidence: openedEmails.length > 5 ? 'high' : 'medium',
    reason: `Opens emails most at ${mostFrequentHour}:00 (${hourFrequency[mostFrequentHour]}/${openedEmails.length} times)`
  };
}