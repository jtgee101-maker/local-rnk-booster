import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString();
    const recentOrders = await base44.asServiceRole.entities.Order.filter({
      status: 'completed',
      created_date: { $gte: thirtyFiveDaysAgo }
    }, '-created_date', 500);

    let processed = 0;
    let errors = 0;

    for (const order of recentOrders) {
      try {
        const existing = await base44.asServiceRole.entities.LeadNurture.filter({
          email: order.email,
          sequence_name: 'post_conversion'
        });
        if (existing && existing.length > 0) continue;

        const nextEmailDate = new Date();
        nextEmailDate.setHours(nextEmailDate.getHours() + 2);

        await base44.asServiceRole.entities.LeadNurture.create({
          lead_id: order.lead_id,
          email: order.email,
          sequence_name: 'post_conversion',
          current_step: 0,
          total_steps: 4,
          status: 'active',
          next_email_date: nextEmailDate.toISOString(),
          emails_sent: 0
        });

        processed++;
      } catch (error) {
        console.error(`Error processing order ${order.id}:`, error);
        errors++;
      }
    }

    return Response.json({ success: true, processed, errors, totalOrders: recentOrders.length });
  } catch (error) {
    console.error('Post-conversion nurture error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});