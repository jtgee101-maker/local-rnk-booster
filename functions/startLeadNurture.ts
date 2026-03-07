import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const payload = await req.json();
    const leadId = payload.leadId || payload.event?.entity_id;

    if (!leadId) return Response.json({ error: 'Lead ID required' }, { status: 400 });

    const leads = await base44.asServiceRole.entities.Lead.filter({ id: leadId });
    if (!leads || leads.length === 0) return Response.json({ error: 'Lead not found' }, { status: 404 });

    const lead = leads[0];

    const existing = await base44.asServiceRole.entities.LeadNurture.filter({ lead_id: leadId, status: 'active' });
    if (existing && existing.length > 0) return Response.json({ message: 'Lead already in nurture sequence' });

    const nextEmailDate = new Date();
    nextEmailDate.setHours(nextEmailDate.getHours() + 24);

    await base44.asServiceRole.entities.LeadNurture.create({
      lead_id: leadId,
      email: lead.email,
      sequence_name: 'unconverted_followup',
      current_step: 0,
      total_steps: 5,
      status: 'active',
      next_email_date: nextEmailDate.toISOString(),
      emails_sent: 0,
      emails_opened: 0
    });

    return Response.json({ success: true, message: 'Lead added to nurture sequence' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});