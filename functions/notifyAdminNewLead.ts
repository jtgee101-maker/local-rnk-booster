import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@3.0.0';
import { adminLeadNotificationTemplate } from './utils/emailTemplates.js';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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

    if (!Deno.env.get('RESEND_API_KEY')) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const emailBody = adminLeadNotificationTemplate(leadData);

    // Send via Resend directly
    const emailResult = await resend.emails.send({
      from: `LocalRank.ai System <noreply@updates.localrnk.com>`,
      to: adminEmail,
      subject: `🆕 New Lead: ${leadData.business_name || 'New Business'} (Score: ${leadData.health_score || 'N/A'}/100)`,
      html: emailBody
    });

    if (emailResult.error) {
      throw new Error(`Resend error: ${emailResult.error.message}`);
    }

    // Log successful send (fire and forget)
    base44.asServiceRole.entities.EmailLog.create({
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
        message_id: emailResult.data?.id
      }
    }).catch(err => console.error('Failed to log email:', err));

    return Response.json({ 
      success: true, 
      notifiedEmail: adminEmail,
      messageId: emailResult.data?.id
    });

  } catch (error) {
    console.error('Function error:', error);

    // Log error (fire and forget)
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'email_failure',
        severity: 'medium',
        message: `Admin notification failed: ${error.message}`,
        stack_trace: error.stack,
        metadata: { 
          function: 'notifyAdminNewLead',
          lead_id: leadData?.id
        }
      });
    } catch (logErr) {
      console.error('Error logging failed:', logErr);
    }

    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});