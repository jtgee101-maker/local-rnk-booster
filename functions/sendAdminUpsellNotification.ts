import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    let orderData;
    if (payload.orderData) {
      orderData = payload.orderData;
    } else if (payload.event && payload.data) {
      orderData = payload.data;
    } else {
      return Response.json({ error: 'Order data required' }, { status: 400 });
    }

    const adminEmail = 'jtgee101@gmail.com';

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; border-bottom: 2px solid #c8ff00; padding-bottom: 10px;">
          🎉 New Upsell Conversion
        </h2>
        
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <div style="background: rgba(200, 255, 0, 0.1); border-left: 4px solid #c8ff00; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #333; font-weight: bold; font-size: 18px;">
              💰 ${orderData.total_amount ? '$' + orderData.total_amount : 'New Upsell'}
            </p>
          </div>
          
          <table style="width: 100%; margin: 10px 0;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 40%; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0;">${orderData.email || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Lead ID:</td>
              <td style="padding: 8px 0;">${orderData.lead_id || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Base Offer:</td>
              <td style="padding: 8px 0;">${orderData.base_offer?.product || 'GMB Optimization & Audit'} - $${orderData.base_offer?.price || '99'}</td>
            </tr>
            ${orderData.upsells && orderData.upsells.length > 0 ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Upsells Accepted:</td>
                <td style="padding: 8px 0;">
                  ${orderData.upsells.filter(u => u.accepted).map(u => `${u.product} ($${u.price})`).join(', ')}
                </td>
              </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Total Value:</td>
              <td style="padding: 8px 0; color: #c8ff00; font-weight: bold; font-size: 16px;">$${orderData.total_amount || '0'}</td>
            </tr>
            ${orderData.stripe_payment_intent ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Payment Intent:</td>
                <td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${orderData.stripe_payment_intent}</td>
              </tr>
            ` : ''}
          </table>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <a href="https://localrank.ai/Admin" 
               style="display: inline-block; background: #c8ff00; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View in Admin Dashboard
            </a>
          </div>
        </div>
        
        <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #333; font-size: 14px;">
            <strong>📋 Action Items:</strong> Send welcome call, schedule kickoff, assign account manager
          </p>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          This is an automated notification from LocalRank.ai
        </p>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: adminEmail,
      from_name: 'LocalRank.ai System',
      subject: `💰 New Upsell Conversion - $${orderData.total_amount || '0'} - ${orderData.email || 'New Order'}`,
      body: emailBody
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending admin upsell notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});