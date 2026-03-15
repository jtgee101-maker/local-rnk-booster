import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const ALGORITHM_VERSION = 'v2';

function calcGrade(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 75) return 'B+';
  if (score >= 65) return 'B';
  if (score >= 55) return 'C+';
  if (score >= 45) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

/**
 * Dual-score engagement calculator.
 * 
 * Score 1: business_health_score  — GMB audit quality (immutable from audit, read-only here)
 * Score 2: engagement_intent_score — behavioral signals (email, events, pathway, decay)
 * Score 3: lead_priority_score    — 40% health + 60% engagement (composite for routing)
 * 
 * Saves to LeadEngagementScore entity.
 * Also updates Lead.engagement_score only — Lead.lead_score/lead_grade are owned by scoring/calculateLeadScore.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    let lead_id;
    if (body.event) {
      lead_id = body.event.entity_id;
    } else {
      lead_id = body.lead_id;
    }

    if (!lead_id) {
      return Response.json({ error: 'lead_id required' }, { status: 400 });
    }

    const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
    if (!leads.length) return Response.json({ error: 'Lead not found' }, { status: 404 });
    const lead = leads[0];

    // SCORE 1: Business Health Score — read from GMB audit, do NOT recalculate
    const business_health_score = Math.round(lead.health_score || 0);

    // Fetch engagement signals in parallel — indexed filter, no memory scan
    const [leadEmailLogs, conversionEvents] = await Promise.all([
      base44.asServiceRole.entities.EmailLog.filter({ 'metadata.lead_id': lead_id }, '-created_date', 50).catch(() => []),
      base44.asServiceRole.entities.ConversionEvent.filter({ lead_id }).catch(() => [])
    ]);

    // SCORE 2: Engagement Intent Score
    let rawEngagement = 0;
    const components = {};

    const addPoints = (key, pts) => {
      if (!pts) return;
      rawEngagement += pts;
      components[key] = (components[key] || 0) + pts;
    };

    // Email engagement signals
    const totalOpens  = leadEmailLogs.reduce((s, l) => s + (l.open_count || 0), 0);
    const totalClicks = leadEmailLogs.reduce((s, l) => s + (l.click_count || 0), 0);
    const unsubscribed = leadEmailLogs.some(l => l.is_unsubscribed);

    addPoints('email_opens',  Math.min(15, totalOpens * 3));   // +3 per open, max 15
    addPoints('email_clicks', Math.min(24, totalClicks * 8));  // +8 per click, max 24
    if (unsubscribed) addPoints('unsubscribed_penalty', -25);

    // Conversion event signals
    const eventCounts = {};
    conversionEvents.forEach(e => { eventCounts[e.event_name] = (eventCounts[e.event_name] || 0) + 1; });

    const scoreEvent = (name, perUnit, max) => {
      const n = eventCounts[name] || 0;
      if (n) addPoints(name, Math.min(max, n * perUnit));
    };
    scoreEvent('results_viewed',          6,  18);
    scoreEvent('bridge_viewed',           10, 20);
    scoreEvent('pathway_clicked',         20, 20);
    scoreEvent('advisor_booking_started', 30, 30);

    // Pathway selection bonus
    if (lead.selected_pathway) {
      const pts = (lead.selected_pathway === 'grant' || lead.selected_pathway === 'dfy') ? 15 : 8;
      addPoints('pathway_selected', pts);
    }

    // Timeline urgency bonus
    if (lead.timeline === 'urgent')   addPoints('timeline_urgency', 10);
    else if (lead.timeline === '30_days') addPoints('timeline_urgency', 5);

    // Enrichment quality
    if (lead.enrichment_status === 'enriched') addPoints('enrichment_bonus', 5);
    if (lead.is_disposable_email) addPoints('disposable_penalty', -15);

    // Inactivity decay
    const lastActivity = lead.updated_date || lead.created_date;
    if (lastActivity) {
      const daysSince = (Date.now() - new Date(lastActivity).getTime()) / 86400000;
      if      (daysSince > 30) addPoints('inactivity_decay', -20);
      else if (daysSince > 14) addPoints('inactivity_decay', -10);
      else if (daysSince > 7)  addPoints('inactivity_decay', -5);
    }

    const engagement_intent_score = Math.min(100, Math.max(0, Math.round(rawEngagement)));

    // SCORE 3: Lead Priority Score = 40% GMB health + 60% engagement intent
    const lead_priority_score = Math.min(100, Math.max(0, Math.round(
      (business_health_score * 0.4) + (engagement_intent_score * 0.6)
    )));

    const is_hot_lead = lead_priority_score >= 75;
    const grade = calcGrade(lead_priority_score);
    const now = new Date().toISOString();

    const scoreData = {
      lead_id,
      business_health_score,
      engagement_intent_score,
      lead_priority_score,
      engagement_components: components,
      is_hot_lead,
      last_calculated_at: now,
      algorithm_version: ALGORITHM_VERSION
    };

    // Upsert LeadEngagementScore record
    const existing = await base44.asServiceRole.entities.LeadEngagementScore.filter({ lead_id }).catch(() => []);
    if (existing.length) {
      await base44.asServiceRole.entities.LeadEngagementScore.update(existing[0].id, scoreData);
    } else {
      await base44.asServiceRole.entities.LeadEngagementScore.create(scoreData);
    }

    // ONLY write engagement_score to Lead — lead_score/lead_grade are owned by scoring/calculateLeadScore
    await base44.asServiceRole.entities.Lead.update(lead_id, {
      engagement_score: engagement_intent_score
    });

    // Trigger hot lead notification check only when score warrants it (fire-and-forget)
    if (is_hot_lead) {
      base44.asServiceRole.functions.invoke('notifyAdminHotLead', { lead_id }).catch(e => console.warn('hot lead check skipped:', e.message));
    }

    return Response.json({
      success: true,
      lead_id,
      business_health_score,
      engagement_intent_score,
      lead_priority_score,
      grade,
      is_hot_lead,
      components
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});