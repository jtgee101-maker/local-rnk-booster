import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

// Type definition for EmailLog
interface EmailLog {
  id: string;
  type: string;
  status: string;
  created_date: string;
  is_unsubscribed?: boolean;
  resend_count?: number;
  subject: string;
  to: string;
  from?: string;
  metadata?: {
    lead_id?: string;
    body?: string;
  };
}

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const payload = await req.json();
    const { emailType, hoursDelay = 24, limit = 100 } = payload;

    // Get unopened emails sent X hours ago
    const cutoffTime = new Date(Date.now() - (hoursDelay * 60 * 60 * 1000)).toISOString();
    
    const allLogs = await base44.asServiceRole.entities.EmailLog.list('-created_date', 10000) as EmailLog[];
    
    const unopenedEmails = allLogs.filter((log: EmailLog) => 
      log.type === emailType &&
      (log.status === 'sent' || log.status !== 'opened') &&
      new Date(log.created_date) < new Date(cutoffTime) &&
      !log.is_unsubscribed &&
      (log.resend_count || 0) < 2 // Max 2 resends
    ).slice(0, limit);

    let resent = 0;
    let errors = 0;

    // Type definition for Lead
    interface Lead {
      business_name?: string;
      health_score?: number;
    }

    for (const emailLog of unopenedEmails) {
      try {
        // Get original lead/order data from metadata
        const leadId = emailLog.metadata?.lead_id;
        
        if (!leadId) continue;

        // Send resend email based on type
        let emailBody = '';
        const subject = `[RESEND] ${emailLog.subject}`;

        if (emailLog.type === 'abandoned_cart') {
          const leads = await base44.asServiceRole.entities.Lead.filter({ id: leadId }) as Lead[];
          const lead = leads[0];
          const healthScore = lead?.health_score ?? 50;
          const calculatedCost = Math.round((100 - healthScore) * 150);
          
          emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px;">
              <p>Hi ${lead?.business_name || 'there'},</p>
              <p style="color: #ef4444; font-weight: bold;">⚠️ This is a reminder - your GMB optimization opportunity expires in 24 hours!</p>
              <p>We noticed you didn't complete your order. Your audit showed critical issues that are costing you:</p>
              <p style="font-size: 24px; color: #c8ff00; font-weight: bold;">$${calculatedCost}/month</p>
              <p><a href="https://localrank.ai/Pricing" style="display: inline-block; background: #c8ff00; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Complete Your Order Now - 30% OFF</a></p>
              <p style="color: #666; font-size: 12px;">This offer expires in 24 hours.</p>
            </div>
          `;
        }

        // Send email
        if (emailBody) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: emailLog.to,
            from_name: 'LocalRank.ai',
            subject,
            body: emailBody
          });

          // Update resend count
          const currentResendCount = emailLog.resend_count || 0;
          await base44.asServiceRole.entities.EmailLog.update(emailLog.id, {
            resend_count: currentResendCount + 1,
            last_resent_at: new Date().toISOString()
          });

          resent++;
        }
      } catch (error) {
        console.error(`Error resending to ${emailLog.to}:`, error);
        errors++;
      }
    }

    return Response.json({
      success: true,
      resent,
      errors,
      total: unopenedEmails.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}));