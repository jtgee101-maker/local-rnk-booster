import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { adminLeadNotificationTemplate } from './utils/emailTemplates.js';
import { logError, handleFunctionError } from './utils/errorLogging.js';
import { sendEmailWithRetry } from './utils/emailRetry.js';

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

    // Send email with robust retry
    let emailSent = false;
    let lastError = null;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: adminEmail,
          from_name: 'LocalRank.ai System',
          subject: `🆕 New Lead: ${leadData.business_name || 'New Business'} (Score: ${leadData.health_score || 'N/A'}/100)`,
          body: emailBody
        });
        emailSent = true;
        console.log(`Admin notification sent successfully on attempt ${attempt}`);
        break;
      } catch (emailError) {
        lastError = emailError;
        console.error(`Admin email attempt ${attempt} failed:`, emailError.message);
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    if (!emailSent) {
      console.error(`Failed to send admin notification after 3 attempts: ${lastError?.message}`);
      // Log but don't fail - admin notification is non-critical
      try {
        await base44.asServiceRole.entities.ErrorLog.create({
          error_type: 'email_failure',
          severity: 'medium',
          message: `Admin notification failed after 3 attempts: ${lastError?.message}`,
          metadata: { 
            function: 'notifyAdminNewLead',
            lead_id: leadData.id,
            admin_email: adminEmail
          }
        });
      } catch (logErr) {
        console.error('Error logging failed:', logErr);
      }
    }

    return Response.json({ 
      success: emailSent, 
      notifiedEmail: adminEmail,
      attempts: emailSent ? 'Success' : 'Failed after 3 attempts'
    });
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