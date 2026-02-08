import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

/**
 * Abandoned GeeNiusPath Follow-up
 * Targets leads who viewed results but haven't converted to any pathway
 */
Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { daysSince = 7 } = await req.json();

    // Find leads that viewed results N days ago but haven't converted
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysSince);
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get leads created around that time (viewed results)
    const candidateLeads = await base44.asServiceRole.entities.Lead.filter({
      created_date: { $gte: targetDate.toISOString(), $lt: nextDay.toISOString() }
    }, '-created_date', 200);

    // Filter to only those NOT converted (no corresponding order)
    const allOrders = await base44.asServiceRole.entities.Order.list('-created_date', 10000);
    const convertedLeadIds = new Set(allOrders.map(o => o.lead_id).filter(Boolean));

    const unconvertedLeads = candidateLeads.filter(lead => !convertedLeadIds.has(lead.id));

    let sent = 0;
    const apiKey = Deno.env.get('RESEND_API_KEY');

    for (const lead of unconvertedLeads.slice(0, 50)) {
      try {
        // Check if already sent for this lead/day
        const existingEmail = await base44.asServiceRole.entities.EmailLog.filter({
          to: lead.email,
          metadata: { lead_id: lead.id, sequence: `abandoned_geenius_${daysSince}d` }
        });

        if (existingEmail.length > 0) continue;

        const template = getTemplate(daysSince, lead);

        // Send via Resend HTTP API
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'GeeNiusPath Team <noreply@updates.localrnk.com>',
            to: lead.email,
            subject: template.subject,
            html: template.body
          })
        });

        if (!response.ok) throw new Error(`Resend API failed: ${response.statusText}`);

        const result = await response.json();

        await base44.asServiceRole.entities.EmailLog.create({
          to: lead.email,
          from: 'GeeNiusPath Team',
          subject: template.subject,
          type: 'nurture',
          status: 'sent',
          metadata: {
            lead_id: lead.id,
            sequence: `abandoned_geenius_${daysSince}d`,
            health_score: lead.health_score,
            critical_issues_count: lead.critical_issues?.length || 0,
            message_id: result.id
          }
        });

        sent++;
      } catch (error) {
        console.error(`Failed to send abandoned GeeNiusPath email to ${lead.email}:`, error);
      }
    }

    return Response.json({
      success: true,
      daysSince,
      candidates: unconvertedLeads.length,
      sent
    });
  } catch (error) {
    console.error('Abandoned GeeNiusPath error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}));

function getTemplate(daysSince, lead) {
  const businessName = lead.business_name || 'there';
  const scoreColor = lead.health_score >= 70 ? '#10b981' : lead.health_score >= 50 ? '#f59e0b' : '#ef4444';

  if (daysSince === 7) {
    return {
      subject: `${businessName} - Your Pathways Are Still Available (Last Chance)`,
      body: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
            
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="display: inline-block; background: rgba(147, 51, 234, 0.2); border-radius: 50%; padding: 20px;">
                <span style="font-size: 48px;">🚀</span>
              </div>
            </div>
            
            <h2 style="color: #fff; text-align: center; font-size: 26px; margin: 0 0 15px 0;">Wait! Your Pathways Are Still Available</h2>
            
            <p style="color: #ccc; line-height: 1.6; font-size: 16px; text-align: center; margin-bottom: 20px;">
              Hi ${businessName},<br>
              You received your GMB Health Score of <span style="color: ${scoreColor}; font-weight: bold; font-size: 18px;">${lead.health_score}/100</span> but didn't choose your growth pathway yet.
            </p>
            
            ${lead.critical_issues && lead.critical_issues.length > 0 ? `
            <div style="background: rgba(239, 68, 68, 0.1); border: 2px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #ff6b6b; margin: 0 0 12px 0;">🚨 Why You're Losing Leads:</h3>
              ${lead.critical_issues.slice(0, 2).map(issue => {
                const issueObj = typeof issue === 'string' ? { issue } : issue;
                return `
                  <div style="margin: 10px 0; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 6px;">
                    <div style="color: #fff; font-weight: bold; margin-bottom: 4px;">${issueObj.issue}</div>
                    ${issueObj.revenue_loss ? `<div style="color: #ff6b6b; font-size: 13px;">💸 ${issueObj.revenue_loss}</div>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
            ` : ''}
            
            <div style="background: rgba(147, 51, 234, 0.1); border: 2px solid rgba(147, 51, 234, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0;">
              <h3 style="color: #a855f7; margin: 0 0 15px 0;">Your 3 Pathways to Fix This:</h3>
              <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid rgba(147, 51, 234, 0.2);">
                <div style="color: #fff; font-weight: bold; margin-bottom: 5px;">👑 GeeNius Gov Tech Grant</div>
                <p style="color: #ccc; margin: 0; font-size: 13px;">Free infrastructure upgrade program</p>
              </div>
              <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid rgba(147, 51, 234, 0.2);">
                <div style="color: #fff; font-weight: bold; margin-bottom: 5px;">🛠️ Done For You Service</div>
                <p style="color: #ccc; margin: 0; font-size: 13px;">We handle everything for you</p>
              </div>
              <div>
                <div style="color: #fff; font-weight: bold; margin-bottom: 5px;">🎓 DIY Software - $199/mo</div>
                <p style="color: #ccc; margin: 0; font-size: 13px;">Full training & support included</p>
              </div>
            </div>
            
            <div style="background: rgba(239, 68, 68, 0.15); border: 2px solid rgba(239, 68, 68, 0.4); border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
              <p style="color: #ff6b6b; margin: 0; font-size: 14px; font-weight: bold;">
                ⏰ Limited Time Offer Ends This Week
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://localrnk.com/BridgeGeenius?lead_id=${lead.id}" style="display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: #fff; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">
                CHOOSE MY PATHWAY →
              </a>
            </div>
            
            <p style="color: #999; font-size: 13px; text-align: center; line-height: 1.6;">
              Questions? Reply to this email - we're happy to help!
            </p>
          </div>
        </div>
      `
    };
  } else if (daysSince === 14) {
    return {
      subject: `${businessName} - Final Reminder: Your Growth Pathways Expire Soon`,
      body: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
            
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="display: inline-block; background: rgba(239, 68, 68, 0.2); border-radius: 50%; padding: 20px;">
                <span style="font-size: 48px;">🔥</span>
              </div>
            </div>
            
            <h2 style="color: #ff6b6b; text-align: center; font-size: 24px; margin: 0 0 15px 0;">FINAL REMINDER: 48 Hours Left</h2>
            
            <p style="color: #ccc; line-height: 1.6; font-size: 16px; text-align: center; margin-bottom: 20px;">
              Hi ${businessName},<br>
              <strong style="color: #ff6b6b;">Your exclusive pathway offers expire in 48 hours.</strong>
            </p>
            
            <div style="background: rgba(239, 68, 68, 0.2); border: 2px solid rgba(239, 68, 68, 0.5); border-radius: 12px; padding: 25px; margin: 25px 0;">
              <p style="color: #ff6b6b; margin: 0 0 15px 0; font-weight: bold; font-size: 16px;">⚠️ What Happens If You Wait:</p>
              <ul style="color: #ccc; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Every day of delay = lost ranking opportunity</li>
                <li>Your competitors are already optimizing</li>
                <li>Next opening for new clients is March 2026</li>
                <li>No extension or re-offer after this</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://localrnk.com/BridgeGeenius?lead_id=${lead.id}" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #fff; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px; border: 2px solid rgba(239, 68, 68, 0.4);">
                CHOOSE NOW BEFORE IT'S GONE
              </a>
            </div>
            
            <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; padding: 18px; margin: 25px 0; border-radius: 8px;">
              <p style="color: #ccc; margin: 0; font-size: 13px; line-height: 1.6;">
                Your score of <span style="color: ${scoreColor}; font-weight: bold;">${lead.health_score}/100</span> shows real opportunity here. Don't let it slip away.
              </p>
            </div>
            
            <p style="color: #999; font-size: 13px; text-align: center; line-height: 1.6; margin-top: 20px;">
              This is your final reminder.<br>
              - The GeeNiusPath Team
            </p>
          </div>
        </div>
      `
    };
  }

  return {
    subject: `${businessName} - Your GeeNiusPath Report is Ready`,
    body: `<p>Hi ${businessName}, your pathways are ready. Review them now!</p>`
  };
}