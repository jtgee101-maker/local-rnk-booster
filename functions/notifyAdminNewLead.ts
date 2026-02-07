import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler';
import { adminLeadNotificationTemplate } from './utils/emailTemplates.js';

Deno.serve(withDenoErrorHandler(async (req) => {
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

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY not configured');
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

    // Send via Resend HTTP API directly
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `LocalRank.ai System <noreply@updates.localrnk.com>`,
        to: adminEmail,
        subject: `🆕 New Lead: ${leadData.business_name || 'New Business'} (Score: ${leadData.health_score || 'N/A'}/100)`,
        html: emailBody
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Resend API error: ${result.message || response.statusText}`);
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
        message_id: result.id
      }
    }).catch(err => console.error('Failed to log email:', err));

    return Response.json({ 
      success: true, 
      notifiedEmail: adminEmail,
      messageId: result.id
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