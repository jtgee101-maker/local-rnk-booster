import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all leads from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const leads = await base44.asServiceRole.entities.Lead.list('-created_date', 500);
    const orders = await base44.asServiceRole.entities.Order.list('-created_date', 500);

    // Create a set of emails that have orders
    const emailsWithOrders = new Set(orders.map(o => o.email));

    let emailsSent = 0;
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    for (const lead of leads) {
      const createdDate = new Date(lead.created_date);
      
      // Check if lead was created 24+ hours ago but less than 7 days
      if (createdDate < oneDayAgo && createdDate > sevenDaysAgo) {
        // Check if they don't have an order
        if (!emailsWithOrders.has(lead.email)) {
          try {
            await base44.asServiceRole.functions.invoke('sendAbandonedCartEmail', {
              leadData: lead
            });
            emailsSent++;
          } catch (error) {
            console.error(`Failed to send abandoned cart email to ${lead.email}:`, error);
          }
        }
      }
    }

    return Response.json({ 
      success: true, 
      emailsSent,
      message: `Sent ${emailsSent} abandoned cart emails`
    });
  } catch (error) {
    console.error('Error in abandoned cart reminder job:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});