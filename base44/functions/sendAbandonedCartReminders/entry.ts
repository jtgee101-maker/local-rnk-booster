import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const unconvertedLeads = await base44.asServiceRole.entities.Lead.filter({
      status: 'new',
      created_date: { $gte: twentyFourHoursAgo }
    }, '-created_date', 200);

    let emailsSent = 0;
    let errors = 0;

    for (const lead of unconvertedLeads) {
      try {
        const recentEmails = await base44.asServiceRole.entities.EmailLog.filter({
          to: lead.email,
          type: 'abandoned_cart'
        });

        const sentToday = recentEmails.some(e => {
          const emailDate = new Date(e.created_date);
          return emailDate.toDateString() === new Date().toDateString();
        });

        if (sentToday) continue;

        await base44.asServiceRole.functions.invoke('sendAbandonedCartEmail', {
          email: lead.email,
          businessName: lead.business_name,
          healthScore: lead.health_score,
          discountPercent: 25
        });

        emailsSent++;
      } catch (error) {
        console.error(`Error sending reminder to ${lead.email}:`, error);
        errors++;
      }
    }

    return Response.json({ success: true, emailsSent, errors, totalLeadsProcessed: unconvertedLeads.length });
  } catch (error) {
    console.error('Error in abandoned cart reminders:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});