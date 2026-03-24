import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Manual / scheduled automation trigger for GeeNius email flows.
 * Called by scheduled automation (send_expiry_reminders) and admin UI.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action, lead_id, trigger_type } = await req.json();

    if (!action) {
      return Response.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    // Manual: send single email immediately
    if (action === 'send_email') {
      if (!lead_id || !trigger_type) {
        return Response.json({ error: 'Missing lead_id or trigger_type' }, { status: 400 });
      }
      const response = await base44.asServiceRole.functions.invoke('nurture/geeniusNonConvertedFlow', { lead_id, trigger_type });
      return Response.json(response.data, { status: 200 });
    }

    // Batch: send 24h expiry reminders to all unconverted new leads
    if (action === 'send_expiry_reminders') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const leads = await base44.asServiceRole.entities.Lead.filter({
        status: 'new',
        last_quiz_date: { $lte: oneDayAgo }
      }, '-created_date', 100);

      const results = [];
      for (const lead of leads) {
        try {
          // Check if already sent this reminder
          const logs = await base44.asServiceRole.entities.EmailLog.filter({ to: lead.email, type: 'nurture' });
          const alreadySent = logs.some(l => l.metadata?.trigger_type === 'no_selection_24h');
          if (alreadySent) continue;

          await base44.asServiceRole.functions.invoke('nurture/geeniusNonConvertedFlow', {
            lead_id: lead.id,
            trigger_type: 'no_selection_24h'
          });
          results.push({ lead_id: lead.id, success: true });
        } catch (error) {
          results.push({ lead_id: lead.id, success: false, error: error.message });
        }
      }

      return Response.json({ success: true, reminders_sent: results.filter(r => r.success).length, results });
    }

    // Batch: process all new leads with abandoned audit
    if (action === 'process_abandoned_audits') {
      const leads = await base44.asServiceRole.entities.Lead.filter({ status: 'new' }, '-created_date', 100);
      const results = [];
      for (const lead of leads) {
        try {
          await base44.asServiceRole.functions.invoke('nurture/geeniusNonConvertedFlow', {
            lead_id: lead.id,
            trigger_type: 'pathway1_abandoned'
          });
          results.push({ lead_id: lead.id, success: true });
        } catch (error) {
          results.push({ lead_id: lead.id, success: false, error: error.message });
        }
      }
      return Response.json({ success: true, processed: results.length, results });
    }

    return Response.json({ error: `Invalid action: ${action}` }, { status: 400 });

  } catch (error) {
    console.error('triggerGeeniusAutomations error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});