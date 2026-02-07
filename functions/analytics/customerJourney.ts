import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

/**
 * Customer Journey Tracking
 * Maps complete path: quiz start → lead → order → LTV
 */
Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { lead_id, session_id, date_range } = await req.json();

    // Get journey for specific lead or session
    if (lead_id) {
      return Response.json(await getLeadJourney(base44, lead_id));
    }

    if (session_id) {
      return Response.json(await getSessionJourney(base44, session_id));
    }

    // Get all journeys in date range
    const startDate = date_range?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = date_range?.end || new Date().toISOString();

    const journeys = await getJourneysInRange(base44, startDate, endDate);
    return Response.json({ success: true, journeys });

  } catch (error) {
    console.error('Customer journey error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function getLeadJourney(base44, leadId) {
  const lead = await base44.asServiceRole.entities.Lead.get(leadId);
  if (!lead) throw new Error('Lead not found');

  // Get all events for this lead
  const events = await base44.asServiceRole.entities.ConversionEvent.filter({
    lead_id: leadId
  }, 'created_date', 1000);

  // Get orders
  const orders = await base44.asServiceRole.entities.Order.filter({
    lead_id: leadId
  }, 'created_date', 100);

  // Get emails sent
  const emails = await base44.asServiceRole.entities.EmailLog.filter({
    to: lead.email
  }, 'created_date', 100);

  // Calculate LTV
  const ltv = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  // Build journey timeline
  const timeline = [
    ...events.map(e => ({
      type: 'event',
      timestamp: e.created_date,
      event: e.event_name,
      data: e.properties
    })),
    ...orders.map(o => ({
      type: 'order',
      timestamp: o.created_date,
      status: o.status,
      amount: o.total_amount
    })),
    ...emails.map(e => ({
      type: 'email',
      timestamp: e.created_date,
      subject: e.subject,
      status: e.status,
      opened: e.open_count > 0
    }))
  ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return {
    success: true,
    lead: {
      id: lead.id,
      email: lead.email,
      business_name: lead.business_name,
      status: lead.status,
      health_score: lead.health_score,
      created_date: lead.created_date
    },
    ltv,
    orders_count: orders.length,
    conversion_rate: orders.length > 0 ? 1 : 0,
    timeline
  };
}

async function getSessionJourney(base44, sessionId) {
  const events = await base44.asServiceRole.entities.ConversionEvent.filter({
    session_id: sessionId
  }, 'created_date', 1000);

  if (events.length === 0) {
    throw new Error('Session not found');
  }

  const leadId = events.find(e => e.lead_id)?.lead_id;
  
  if (leadId) {
    return getLeadJourney(base44, leadId);
  }

  return {
    success: true,
    session_id: sessionId,
    events: events.map(e => ({
      timestamp: e.created_date,
      event: e.event_name,
      data: e.properties
    })),
    converted: false
  };
}

async function getJourneysInRange(base44, startDate, endDate) {
  // Get all leads in range
  const leads = await base44.asServiceRole.entities.Lead.filter({
    created_date: { $gte: startDate, $lte: endDate }
  }, '-created_date', 500);

  const journeys = [];

  for (const lead of leads) {
    // Get orders for this lead
    const orders = await base44.asServiceRole.entities.Order.filter({
      lead_id: lead.id
    }, 'created_date', 10);

    const completedOrders = orders.filter(o => o.status === 'completed');
    const ltv = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // Get first touchpoint (quiz start)
    const firstEvent = await base44.asServiceRole.entities.ConversionEvent.filter({
      lead_id: lead.id,
      event_name: { $in: ['quizv3_started', 'quizv2_started', 'quiz_started'] }
    }, 'created_date', 1);

    // Calculate time to conversion
    let timeToConversion = null;
    if (completedOrders.length > 0) {
      const firstOrder = completedOrders[0];
      const leadCreated = new Date(lead.created_date);
      const orderCreated = new Date(firstOrder.created_date);
      timeToConversion = Math.round((orderCreated - leadCreated) / (1000 * 60 * 60)); // hours
    }

    journeys.push({
      lead_id: lead.id,
      email: lead.email,
      business_name: lead.business_name,
      business_category: lead.business_category,
      health_score: lead.health_score,
      status: lead.status,
      created_date: lead.created_date,
      first_touchpoint: firstEvent[0]?.created_date || lead.created_date,
      orders_count: completedOrders.length,
      ltv,
      time_to_conversion_hours: timeToConversion,
      converted: completedOrders.length > 0
    });
  }

  return journeys;
}