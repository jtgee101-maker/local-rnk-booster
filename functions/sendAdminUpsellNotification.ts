import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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

    // Get admin email from AppSettings
    let adminEmail = 'jtgee101@gmail.com';
    try {
      const settings = await base44.asServiceRole.entities.AppSettings.filter({ setting_key: 'admin_email' });
      if (settings?.[0]?.setting_value?.email) {
        adminEmail = settings[0].setting_value.email;
      }
    } catch (e) {
      console.warn('Could not load admin email from AppSettings');
    }

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #c8ff00; background: #0a0a0f; padding: 20px; border-radius: 8px;">💰 New Upsell Conversion</h2>
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-top: 16px;">
          <p><strong>Email:</strong> ${orderData.email || 'N/A'}</p>
          <p><strong>Amount:</strong> $${orderData.total_amount || '0'}</p>
          <p><strong>Order ID:</strong> ${orderData.id || 'N/A'}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        </div>
        <div style="margin-top: 20px; text-align: center;">
          <a href="https://localrank.ai/AdminControlCenter" style="background: #c8ff00; color: #0a0a0f; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View in Admin →</a>
        </div>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: adminEmail,
      from_name: 'LocalRank.ai System',
      subject: `💰 New Upsell Conversion - $${orderData.total_amount || '0'} - ${orderData.email || 'New Order'}`,
      body: emailBody
    });

    return Response.json({ success: true, notifiedEmail: adminEmail });
  } catch (error) {
    console.error('Error sending admin upsell notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});