import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

/**
 * Personalized Email Content Generator
 * Renders different email blocks based on segment/lead data
 */
Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { lead_id, template_type } = await req.json();

    if (!lead_id || !template_type) {
      return Response.json({ error: 'lead_id and template_type required' }, { status: 400 });
    }

    // Get lead data
    const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Get lead's segment
    const segments = await base44.asServiceRole.entities.Segment.filter({
      lead_ids: { $in: [lead_id] },
      is_active: true
    }, '-member_count', 5);

    // Get lead quality score
    const leadScore = await base44.asServiceRole.functions.invoke('analytics/predictLeadQuality', {
      lead_id: lead_id
    });

    const scoreData = leadScore.data.lead;

    // Generate personalized content
    const personalizedEmail = await generatePersonalizedContent(
      lead,
      segments,
      scoreData,
      template_type
    );

    return Response.json({
      success: true,
      personalized_email: personalizedEmail
    });

  } catch (error) {
    console.error('Email personalization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}));

async function generatePersonalizedContent(lead, segments, scoreData, templateType) {
  const segment = segments[0]; // Primary segment
  const personalization = segment?.email_personalization || {};

  // Base data
  const firstName = lead.business_name?.split(' ')[0] || 'there';
  const healthScore = lead.health_score || 50;
  const priority = scoreData.priority || 'Medium';

  // Calculate potential revenue loss (based on health score)
  const avgRevenuePerPoint = 150; // $150/month per health point below 100
  const pointsBelow100 = 100 - healthScore;
  const monthlyLoss = Math.max(0, pointsBelow100 * avgRevenuePerPoint);

  let subject = '';
  let body = '';
  let cta = '';

  // Personalize based on template type and segment
  if (templateType === 'nurture_welcome') {
    subject = `${personalization.subject_prefix || ''}${firstName}, your GMB audit is ready`;
    
    if (healthScore < 40) {
      body = `Hi ${firstName},\n\nWe've analyzed ${lead.business_name}'s Google Business Profile and found some critical issues that are costing you an estimated $${monthlyLoss.toLocaleString()}/month in lost revenue.\n\n`;
      body += `Here are the 3 most urgent problems:\n`;
      (lead.critical_issues || []).forEach((issue, idx) => {
        body += `${idx + 1}. ${issue}\n`;
      });
      body += `\nThe good news? These are fixable in under 48 hours.`;
    } else if (healthScore >= 70) {
      body = `Hi ${firstName},\n\nGreat news! ${lead.business_name}'s GMB profile is in pretty good shape (${healthScore}/100).\n\n`;
      body += `However, we identified several untapped opportunities that could help you dominate your local market even further. Your competitors with similar scores are seeing 40% more calls by implementing these strategies.`;
    } else {
      body = `Hi ${firstName},\n\nYour ${lead.business_name} GMB profile scored ${healthScore}/100 - not bad, but there's significant room for improvement.\n\n`;
      body += `Here's what's holding you back:\n`;
      (lead.critical_issues || []).slice(0, 2).forEach((issue, idx) => {
        body += `${idx + 1}. ${issue}\n`;
      });
    }

    // CTA based on urgency
    if (personalization.cta_urgency === 'high') {
      cta = `🚀 URGENT: Book your free 15-min strategy call (only 3 spots left today)`;
    } else if (personalization.cta_urgency === 'critical') {
      cta = `⚡ CRITICAL: Fix these issues before you lose more customers →`;
    } else {
      cta = `See your full audit + optimization roadmap →`;
    }

  } else if (templateType === 'churn_prevention') {
    subject = `${firstName}, we noticed something...`;
    body = `Hi ${firstName},\n\nI noticed you haven't been as active with your GMB optimization recently, and I wanted to reach out personally.\n\n`;
    body += `Are you seeing the results you expected? If not, let's jump on a quick call to make sure you're getting maximum value.\n\n`;
    
    if (personalization.include_special_offer) {
      body += `As a valued customer, I'd like to offer you a complimentary advanced audit worth $497 - completely free.\n\n`;
    }
    
    body += `No pressure - I genuinely want to make sure ${lead.business_name} is crushing it online.`;
    cta = `Schedule your free check-in call →`;

  } else if (templateType === 'upsell') {
    subject = `${firstName}, ready to 10x your GMB results?`;
    body = `Hi ${firstName},\n\nYour GMB optimization is working - you've already improved your visibility.\n\n`;
    body += `But what if I told you there's a way to get 10x better results in half the time?\n\n`;
    body += `Our Premium GMB Management service includes:\n`;
    body += `✓ Weekly optimization (not monthly)\n`;
    body += `✓ Review generation automation\n`;
    body += `✓ Competitor monitoring & alerts\n`;
    body += `✓ Priority support\n\n`;
    body += `Current customers see an average of 47% more calls within 30 days.`;
    cta = `Upgrade to Premium (50% off first month) →`;
  }

  // Add social proof if specified
  if (personalization.include_testimonials) {
    body += `\n\n---\n"After implementing these changes, we went from 12 calls/month to 47. Worth every penny." - Mike R., HVAC Contractor`;
  }

  if (personalization.show_roi_calculator) {
    body += `\n\n💰 Your ROI Calculator: If you get just 2 more customers/month at $${Math.round(monthlyLoss / 4)}/customer, you've paid for the service 5x over.`;
  }

  return {
    subject,
    body,
    cta,
    optimal_send_time: segment?.optimal_send_times?.[0] || '10:00',
    segment_name: segment?.name || 'General',
    personalization_factors: {
      health_score: healthScore,
      priority: priority,
      estimated_monthly_loss: monthlyLoss,
      segment_strategy: personalization.focus || 'general'
    }
  };
}