import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { adminLeadNotificationTemplate } from './utils/emailTemplates.js';
import { logError, handleFunctionError } from './utils/errorLogging.js';

async function sendEmailWithRetry(base44, emailData, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await base44.asServiceRole.integrations.Core.SendEmail(emailData);
      if (attempt > 1) console.log(`Email sent on attempt ${attempt}`);
      return { success: true, attempts: attempt };
    } catch (error) {
      console.error(`Email attempt ${attempt} failed:`, error.message);
      if (attempt < maxAttempts) {
        const delay = 1000 * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // INTERNAL FUNCTION ONLY - Service role required
    // This should only be called from backend automations, not client
    const payload = await req.json();
    
    let leadData;
    if (payload.leadData) {
      leadData = payload.leadData;
    } else if (payload.event && payload.data) {
      leadData = payload.data;
    } else {
      return Response.json({ error: 'Lead data required' }, { status: 400 });
    }

    if (!leadData || !leadData.email) {
      return Response.json({ error: 'Lead data with email required' }, { status: 400 });
    }

    // Get admin email from AppSettings (no hardcoded default)
    let adminEmail = null;
    try {
      const settings = await base44.asServiceRole.entities.AppSettings.filter({
        setting_key: 'admin_email'
      });
      if (settings && settings.length > 0 && settings[0].setting_value?.email) {
        adminEmail = settings[0].setting_value.email;
      }
    } catch (settingsError) {
      console.warn('Could not load admin email from AppSettings:', settingsError.message);
    }

    if (!adminEmail) {
      return Response.json({ error: 'Admin email not configured in AppSettings' }, { status: 500 });
    }

    const emailBody = adminLeadNotificationTemplate(leadData);

    await sendEmailWithRetry(base44, {
      to: adminEmail,
      from_name: 'LocalRank.ai System',
      subject: `🆕 New Lead: ${leadData.business_name} (Score: ${leadData.health_score}/100)`,
      body: emailBody
    });

    return Response.json({ success: true, notifiedEmail: adminEmail });
  } catch (error) {
    const errorInfo = handleFunctionError(error, {
      functionName: 'notifyAdminNewLead',
      errorType: 'email_failure'
    });

    await logError(createClientFromRequest(req), {
      type: 'email_failure',
      severity: 'high',
      message: `Failed to notify admin of new lead: ${error.message}`,
      stackTrace: error.stack,
      metadata: { function: 'notifyAdminNewLead', errorId: errorInfo.logId }
    }).catch(() => {});

    return Response.json({ error: error.message, errorId: errorInfo.logId }, { status: 500 });
  }
});