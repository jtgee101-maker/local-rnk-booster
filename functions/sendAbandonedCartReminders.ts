import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Find leads that haven't converted in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const allLeads = await base44.asServiceRole.entities.Lead.list();
    
    const unconvertedLeads = allLeads.filter(lead => {
      const leadCreatedDate = new Date(lead.created_date);
      return leadCreatedDate >= new Date(twentyFourHoursAgo) && lead.status === 'new';
    });

    let emailsSent = 0;
    let errors = 0;

    for (const lead of unconvertedLeads) {
      try {
        // Check if already sent abandonment email recently
        const recentEmails = await base44.asServiceRole.entities.EmailLog.filter({
          to: lead.email,
          type: 'abandoned_cart'
        });

        const sentToday = recentEmails.some(e => {
          const emailDate = new Date(e.created_date);
          const today = new Date();
          return emailDate.toDateString() === today.toDateString();
        });

        if (sentToday) continue;

        // Send abandoned cart email
        await base44.functions.invoke('sendAbandonedCartEmail', {
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

    return Response.json({ 
      success: true, 
      emailsSent, 
      errors,
      totalLeadsProcessed: unconvertedLeads.length
    });
  } catch (error) {
    console.error('Error in abandoned cart reminders:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});