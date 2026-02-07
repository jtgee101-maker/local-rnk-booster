import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    let leadId;
    try {
      const payload = await req.json();
      leadId = payload.leadId || payload.event?.entity_id;
    } catch {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (!leadId) {
      return Response.json({ error: 'Lead ID required' }, { status: 400 });
    }

    // Get lead
    const leads = await base44.asServiceRole.entities.Lead.filter({ id: leadId });
    if (!leads || leads.length === 0) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const lead = leads[0];

    // Check if already in nurture
    const existing = await base44.asServiceRole.entities.LeadNurture.filter({ 
      lead_id: leadId,
      status: 'active'
    });

    if (existing && existing.length > 0) {
      return Response.json({ message: 'Lead already in nurture sequence' });
    }

    // Create nurture record
    const nextEmailDate = new Date();
    nextEmailDate.setHours(nextEmailDate.getHours() + 24); // First email in 24 hours

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