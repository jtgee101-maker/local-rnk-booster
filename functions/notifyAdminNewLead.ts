import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@3.0.0';
import { adminLeadNotificationTemplate } from './utils/emailTemplates.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
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

    // Send email via Resend with retry
    let emailSent = false;
    let lastError = null;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await resend.emails.send({
          from: 'LocalRank.ai <noreply@localrank.ai>',
          to: adminEmail,
          subject: `🆕 New Lead: ${leadData.business_name || 'New Business'} (Score: ${leadData.health_score || 'N/A'}/100)`,
          html: emailBody
        });
        
        if (result.error) {
          throw new Error(result.error.message);
        }
        
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
    console.error('Function error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});