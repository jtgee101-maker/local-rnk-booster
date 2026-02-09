import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 });
    }

    const { action, lead_id, trigger_type } = await req.json();

    if (!action) {
      return new Response(JSON.stringify({ error: 'Missing action parameter' }), { status: 400 });
    }

    if (action === 'send_email' && (!lead_id || !trigger_type)) {
      return new Response(
        JSON.stringify({ error: 'Missing lead_id or trigger_type' }),
        { status: 400 }
      );
    }

    // Manual trigger: Send email immediately
    if (action === 'send_email') {
      const response = await base44.functions.invoke('nurture/geeniusNonConvertedFlow', {
        lead_id,
        trigger_type
      });
      return new Response(JSON.stringify(response.data), { status: 200 });
    }

    // Batch action: Find and process all non-converted leads
    if (action === 'process_abandoned_audits') {
      const leads = await base44.entities.Lead.filter({
        status: 'new',
        last_quiz_date: { $exists: true }
      });

      const results = [];
      for (const lead of leads) {
        try {
          const response = await base44.functions.invoke('nurture/geeniusNonConvertedFlow', {
            lead_id: lead.id,
            trigger_type: 'pathway1_abandoned'
          });
          results.push({ lead_id: lead.id, success: true });
        } catch (error) {
          results.push({ lead_id: lead.id, success: false, error: error.message });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          processed: results.length,
          results
        }),
        { status: 200 }
      );
    }

    // Send 24h expiry reminder
    if (action === 'send_expiry_reminders') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const leads = await base44.entities.Lead.filter({
        status: 'new',
        last_quiz_date: { $lte: oneDayAgo }
      });

      const results = [];
      for (const lead of leads) {
        try {
          const response = await base44.functions.invoke('nurture/geeniusNonConvertedFlow', {
            lead_id: lead.id,
            trigger_type: 'no_selection_24h'
          });
          results.push({ lead_id: lead.id, success: true });
        } catch (error) {
          results.push({ lead_id: lead.id, success: false, error: error.message });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          reminders_sent: results.length,
          results
        }),
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in triggerGeeniusAutomations:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500 }
    );
  }
});