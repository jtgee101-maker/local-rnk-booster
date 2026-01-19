import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { adminUpsellNotificationTemplate } from './utils/emailTemplates.js';
import { logError, handleFunctionError } from './utils/errorLogging.js';

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
      const settings = await base44.asServiceRole.entities.AppSettings.filter({
        setting_key: 'admin_email'
      });
      if (settings && settings.length > 0 && settings[0].setting_value?.email) {
        adminEmail = settings[0].setting_value.email;
      }
    } catch (settingsError) {
      console.warn('Could not load admin email from AppSettings, using default:', settingsError.message);
    }

    const emailBody = adminUpsellNotificationTemplate(orderData);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: adminEmail,
      from_name: 'LocalRank.ai System',
      subject: `💰 New Upsell Conversion - $${orderData.total_amount || '0'} - ${orderData.email || 'New Order'}`,
      body: emailBody
    });

    return Response.json({ success: true, notifiedEmail: adminEmail });
  } catch (error) {
    const errorInfo = handleFunctionError(error, {
      functionName: 'sendAdminUpsellNotification',
      errorType: 'email_failure'
    });

    await logError(createClientFromRequest(req), {
      type: 'email_failure',
      severity: 'high',
      message: `Failed to send admin upsell notification: ${error.message}`,
      stackTrace: error.stack,
      metadata: { function: 'sendAdminUpsellNotification', errorId: errorInfo.logId }
    }).catch(() => {});

    return Response.json({ error: error.message, errorId: errorInfo.logId }, { status: 500 });
  }
});