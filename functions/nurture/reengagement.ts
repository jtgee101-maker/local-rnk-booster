import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Re-engagement Campaign for Inactive Leads
 * 30, 60, 90 day sequences
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { daysSince = 30 } = await req.json();

    if (![30, 60, 90].includes(daysSince)) {
      return Response.json({ error: 'daysSince must be 30, 60, or 90' }, { status: 400 });
    }

    // Find leads created X days ago that haven't converted
    const targetDate = new Date(Date.now() - daysSince * 24 * 60 * 60 * 1000);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)).toISOString();

    const leads = await base44.asServiceRole.entities.Lead.filter({
      created_date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'converted' }
    }, '-created_date', 100);

    let sent = 0;

    for (const lead of leads) {
      try {
        // Check if they have an order (converted)
        const orders = await base44.asServiceRole.entities.Order.filter({
          email: lead.email,
          status: 'completed'
        }, '-created_date', 1);

        if (orders.length > 0) continue; // Skip if converted

        // Check if already sent this reengagement email
        const existingEmail = await base44.asServiceRole.entities.EmailLog.filter({
          to: lead.email,
          metadata: { sequence: 'reengagement', days: daysSince }
        }, '-created_date', 1);

        if (existingEmail.length > 0) continue;

        const template = getReengagementTemplate(lead, daysSince);

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: lead.email,
          from_name: 'LocalRank.ai',
          subject: template.subject,
          body: template.body
        });

        await base44.asServiceRole.entities.EmailLog.create({
          to: lead.email,
          from: 'LocalRank.ai',
          subject: template.subject,
          type: 'nurture',
          status: 'sent',
          metadata: { 
            lead_id: lead.id,
            sequence: 'reengagement',
            days: daysSince
          }
        });

        sent++;
      } catch (error) {
        console.error(`Failed to send reengagement to ${lead.email}:`, error);
      }
    }

    return Response.json({ 
      success: true,
      targetLeads: leads.length,
      sent 
    });
  } catch (error) {
    console.error('Reengagement error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getReengagementTemplate(lead, days) {
  const templates = {
    30: {
      subject: `${lead.business_name || 'Hey'} - Still Stuck with Lead Aggregators?`,
      body: get30DayTemplate(lead)
    },
    60: {
      subject: `You've Lost $${Math.round((100 - lead.health_score) * 80 * 2)} Since Your Audit...`,
      body: get60DayTemplate(lead)
    },
    90: {
      subject: `Final Check-In: ${lead.business_name || 'Your Business'} & Lead Independence`,
      body: get90DayTemplate(lead)
    }
  };

  return templates[days];
}

function get30DayTemplate(lead) {
  const monthlyLoss = Math.round((100 - lead.health_score) * 80);
  
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
        
        <h2 style="color: #fff; font-size: 24px; margin: 0 0 15px 0;">Quick Check-In, ${lead.business_name || 'there'}</h2>
        
        <p style="color: #ccc; line-height: 1.6; font-size: 16px;">
          30 days ago, you discovered your GMB score was <strong style="color: #ff6b6b;">${lead.health_score}/100</strong>.
        </p>
        
        <p style="color: #ccc; line-height: 1.6; font-size: 16px;">
          I'm following up because that score means you're still losing around <strong style="color: #c8ff00;">$${monthlyLoss}/month</strong> to aggregator fees and missed organic leads.
        </p>
        
        <div style="background: rgba(239, 68, 68, 0.15); border: 2px solid #ef4444; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
          <p style="color: #ff6b6b; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">IN THE LAST 30 DAYS ALONE:</p>
          <div style="font-size: 42px; color: #ef4444; font-weight: bold; margin: 10px 0;">
            -$${monthlyLoss}
          </div>
          <p style="color: #ccc; margin: 5px 0 0 0; font-size: 13px;">lost to lead rental fees</p>
        </div>
        
        <h3 style="color: #fff; margin: 25px 0 15px 0;">What's Changed in 30 Days:</h3>
        <ul style="color: #ccc; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>We've helped 23 businesses escape aggregators</li>
          <li>Average first-month ROI: 3.1x</li>
          <li>Spots are filling up fast (only 5 left)</li>
        </ul>
        
        <div style="background: rgba(200, 255, 0, 0.08); border-left: 4px solid #c8ff00; padding: 18px; margin: 25px 0; border-radius: 8px;">
          <p style="margin: 0; color: #ccc; font-size: 14px; line-height: 1.6;">
            <strong style="color: #c8ff00;">💡 Simple Question:</strong> Would you rather own your leads or keep renting them?
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://localrnk.com/Pricing" style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a3e635 100%); color: #000; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">
            STOP THE BLEEDING
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 12px;">
            60-day guarantee • Cancel anytime
          </p>
        </div>
        
        <p style="color: #999; font-size: 13px; text-align: center; line-height: 1.6;">
          Still have questions? Just hit reply.<br>
          - The LocalRank Team
        </p>
      </div>
    </div>
  `;
}

function get60DayTemplate(lead) {
  const totalLoss = Math.round((100 - lead.health_score) * 80 * 2);
  
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
        
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; background: rgba(239, 68, 68, 0.2); border-radius: 50%; padding: 20px;">
            <span style="font-size: 48px;">⏰</span>
          </div>
        </div>
        
        <h2 style="color: #fff; text-align: center; font-size: 24px; margin: 0 0 15px 0;">The 60-Day Reality Check</h2>
        
        <p style="color: #ccc; line-height: 1.6; font-size: 16px; text-align: center;">
          ${lead.business_name || 'Hi there'}, it's been 60 days since your GMB audit.
        </p>
        
        <div style="background: rgba(239, 68, 68, 0.15); border: 2px solid #ef4444; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
          <p style="color: #ff6b6b; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">ESTIMATED LOSS SINCE AUDIT:</p>
          <div style="font-size: 48px; color: #ef4444; font-weight: bold; margin: 10px 0;">
            $${totalLoss.toLocaleString()}
          </div>
          <p style="color: #ccc; margin: 5px 0 0 0; font-size: 13px;">in lead rental & opportunity cost</p>
        </div>
        
        <p style="color: #ccc; line-height: 1.6; font-size: 16px;">
          I don't want to be pushy, but I also don't want to see you keep bleeding money.
        </p>
        
        <div style="background: rgba(100, 200, 255, 0.08); border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="color: #ccc; margin: 0; font-size: 13px; line-height: 1.5;">
            <strong style="color: #64c8ff;">"I wish I'd started 6 months earlier. My only regret."</strong><br>
            <span style="color: #999;">- James T., Landscaping ($12K saved in Year 1)</span>
          </p>
        </div>
        
        <h3 style="color: #fff; margin: 25px 0 15px 0;">Here's What You Could Have by Day 90:</h3>
        <ul style="color: #ccc; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Zero aggregator fees</li>
          <li>3-5x more organic leads</li>
          <li>Complete control of your pipeline</li>
          <li>ROI that compounds month after month</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://localrnk.com/Pricing" style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a3e635 100%); color: #000; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">
            TAKE CONTROL NOW
          </a>
        </div>
        
        <p style="color: #999; font-size: 13px; text-align: center; line-height: 1.6;">
          This is our last follow-up. Decision is yours.<br>
          - The LocalRank Team
        </p>
      </div>
    </div>
  `;
}

function get90DayTemplate(lead) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
        
        <h2 style="color: #fff; font-size: 24px; margin: 0 0 15px 0;">Final Message, ${lead.business_name || 'there'}</h2>
        
        <p style="color: #ccc; line-height: 1.6; font-size: 16px;">
          It's been 90 days since your GMB audit. I wanted to reach out one last time.
        </p>
        
        <p style="color: #ccc; line-height: 1.6; font-size: 16px;">
          If you've already solved your lead generation issues — awesome. Genuinely happy for you.
        </p>
        
        <p style="color: #ccc; line-height: 1.6; font-size: 16px;">
          But if you're still dealing with:
        </p>
        
        <ul style="color: #ccc; line-height: 1.8; margin: 15px 0; padding-left: 20px;">
          <li>$100+ per lead fees on Thumbtack/Angi</li>
          <li>Leads that don't convert</li>
          <li>Never ranking in the Map Pack</li>
          <li>Competitors getting all the organic traffic</li>
        </ul>
        
        <p style="color: #ccc; line-height: 1.6; font-size: 16px;">
          ...then nothing has changed since your audit 3 months ago.
        </p>
        
        <div style="background: rgba(200, 255, 0, 0.08); border-left: 4px solid #c8ff00; padding: 18px; margin: 25px 0; border-radius: 8px;">
          <p style="margin: 0; color: #ccc; font-size: 14px; line-height: 1.6;">
            <strong style="color: #c8ff00;">💡 Real Talk:</strong> The businesses that started 90 days ago are now pulling 40-60% of their leads organically. Zero aggregator fees. They own their pipeline.
          </p>
        </div>
        
        <p style="color: #ccc; line-height: 1.6; font-size: 16px;">
          If that sounds better than what you're doing now, here's your last chance to join them:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://localrnk.com/Pricing" style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a3e635 100%); color: #000; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">
            GET STARTED
          </a>
        </div>
        
        <p style="color: #999; font-size: 13px; text-align: center; line-height: 1.6;">
          No more follow-ups after this. Best of luck either way.<br>
          - The LocalRank Team
        </p>
      </div>
    </div>
  `;
}