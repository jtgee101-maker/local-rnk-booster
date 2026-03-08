import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    let lead_id;

    // Handle automation payload (EmailLog updated with open/click)
    if (body.event) {
      lead_id = body.data?.metadata?.lead_id;
    } else {
      lead_id = body.lead_id;
    }

    if (!lead_id) {
      return Response.json({ error: 'lead_id required' }, { status: 400 });
    }

    const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
    if (!leads.length) return Response.json({ error: 'Lead not found' }, { status: 404 });
    const lead = leads[0];

    // Fetch email logs for this lead (filter by metadata.lead_id in memory)
    const allEmailLogs = await base44.asServiceRole.entities.EmailLog.list('-created_date', 500);
    const emailLogs = allEmailLogs.filter(log => log.metadata?.lead_id === lead_id);

    const baseScore = lead.health_score || 50;
    let engagementBoost = 0;

    if (emailLogs.length > 0) {
      const totalOpens = emailLogs.reduce((sum, l) => sum + (l.open_count || 0), 0);
      const totalClicks = emailLogs.reduce((sum, l) => sum + (l.click_count || 0), 0);
      const openedCount = emailLogs.filter(l => l.open_count > 0).length;
      const clickedCount = emailLogs.filter(l => l.click_count > 0).length;
      const unsubscribed = emailLogs.some(l => l.is_unsubscribed);

      engagementBoost += Math.min(10, openedCount * 2);   // +2 per email opened, max +10
      engagementBoost += Math.min(15, clickedCount * 5);  // +5 per link clicked, max +15
      engagementBoost += Math.min(5, totalOpens);          // +1 per re-open, max +5
      engagementBoost += Math.min(5, totalClicks * 2);     // +2 per re-click, max +5

      if (unsubscribed) engagementBoost -= 20; // Penalty for unsubscribe
    }

    // Urgency boost
    if (lead.timeline === 'urgent') engagementBoost += 8;
    else if (lead.timeline === '30_days') engagementBoost += 4;

    // Enrichment boost
    if (lead.enrichment_status === 'enriched') engagementBoost += 5;
    if (lead.is_disposable_email) engagementBoost -= 10;

    // Pathway selection boost
    if (lead.selected_pathway) engagementBoost += 10;
    if (lead.selected_pathway === 'dfy' || lead.selected_pathway === 'grant') engagementBoost += 5;

    const finalScore = Math.min(100, Math.max(0, Math.round(baseScore + engagementBoost)));
    const grade = calcGrade(finalScore);

    await base44.asServiceRole.entities.Lead.update(lead_id, {
      lead_score: finalScore,
      lead_grade: grade
    });

    return Response.json({
      success: true,
      lead_id,
      score: finalScore,
      grade,
      boost_applied: engagementBoost,
      emails_analyzed: emailLogs.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});