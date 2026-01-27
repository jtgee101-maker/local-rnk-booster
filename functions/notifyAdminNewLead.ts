import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { sendAdminEmail } from './utils/resendEmailService.js';
import { adminLeadNotificationTemplate } from './utils/emailTemplates.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
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

    // Get admin email from AppSettings
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

    // Send email via production-grade service
    try {
      const result = await sendAdminEmail(
        adminEmail,
        `🆕 New Lead: ${leadData.business_name || 'New Business'} (Score: ${leadData.health_score || 'N/A'}/100)`,
        emailBody
      );
      
      // Log successful send
      await base44.asServiceRole.entities.EmailLog.create({
        to: adminEmail,
        from: 'LocalRank.ai System',
        subject: `New Lead: ${leadData.business_name || 'New Business'}`,
        type: 'admin_notification',
        status: 'sent',
        metadata: {
          function: 'notifyAdminNewLead',
          lead_id: leadData.id,
          business_name: leadData.business_name,
          health_score: leadData.health_score,
          message_id: result.messageId
        }
      }).catch(err => console.error('Failed to log email:', err));

      return Response.json({ 
        success: true, 
        notifiedEmail: adminEmail,
        messageId: result.messageId
      });
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError.message);
      
      // Log the error
      try {
        await base44.asServiceRole.entities.ErrorLog.create({
          error_type: 'email_failure',
          severity: 'medium',
          message: `Admin notification failed: ${emailError.message}`,
          stack_trace: emailError.stack,
          metadata: { 
            function: 'notifyAdminNewLead',
            lead_id: leadData.id,
            admin_email: adminEmail
          }
        });
      } catch (logErr) {
        console.error('Error logging failed:', logErr);
      }

      return Response.json({ 
        success: false, 
        error: emailError.message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Function error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});