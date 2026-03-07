import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Welcome Series for New Leads — Day 1, 3, 7 automated emails
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, step } = await req.json();

    if (!lead_id || !step) return Response.json({ error: 'lead_id and step required' }, { status: 400 });

    const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
    const lead = leads[0];
    if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });

    const templates = {
      day1: { subject: `${lead.business_name || 'Hi'} - Your GMB Roadmap is Ready 🎯`, body: getDay1Template(lead) },
      day3: { subject: `Quick Win: Boost Your GMB in 15 Minutes`, body: getDay3Template(lead) },
      day7: { subject: `${lead.business_name || 'Hey'} - Still Paying Lead Fees? Here's the Math...`, body: getDay7Template(lead) }
    };

    const template = templates[step];
    if (!template) return Response.json({ error: 'Invalid step' }, { status: 400 });

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
      metadata: { lead_id: lead.id, sequence: 'welcome', step }
    });

    return Response.json({ success: true, step });
  } catch (error) {
    console.error('Welcome series error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getDay1Template(lead) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
        <h1 style="color: #c8ff00; font-size: 28px; margin: 0 0 20px 0;">Hi ${lead.business_name || 'there'}! 👋</h1>
        <p style="color: #ccc; line-height: 1.6; font-size: 16px;">Your audit showed a <strong style="color: #c8ff00;">${lead.health_score}/100</strong> score. Here's what that means for your bottom line:</p>
        <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 8px;">
          <h3 style="color: #ff6b6b; margin: 0 0 12px 0;">💰 What You're Losing Monthly:</h3>
          <ul style="color: #ccc; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li><strong>$${Math.round((100 - lead.health_score) * 50)}</strong> in missed organic leads</li>
            <li><strong>$${Math.round((100 - lead.health_score) * 80)}</strong> paid to Thumbtack/Angi</li>
          </ul>
        </div>
        <h3 style="color: #fff; margin: 25px 0 15px 0;">Your Critical Issues:</h3>
        <ol style="color: #ccc; line-height: 1.8; margin: 0; padding-left: 20px;">
          ${(lead.critical_issues || []).slice(0, 3).map(issue => `<li>${issue}</li>`).join('')}
        </ol>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://localrnk.com/Pricing" style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a3e635 100%); color: #000; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">SEE FULL ROADMAP</a>
        </div>
        <p style="color: #999; font-size: 13px; text-align: center;">Reply to this email with any questions!<br>- The LocalRank Team</p>
      </div>
    </div>
  `;
}

function getDay3Template(lead) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
        <h2 style="color: #fff; text-align: center; font-size: 24px; margin: 0 0 15px 0;">⚡ Quick Win: 15-Minute GMB Boost</h2>
        <p style="color: #ccc; line-height: 1.6; font-size: 16px;">Hey ${lead.business_name || 'there'}! Here's something you can do RIGHT NOW to improve your ranking:</p>
        <div style="background: rgba(200, 255, 0, 0.1); border: 2px solid rgba(200, 255, 0, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #c8ff00; margin: 0 0 15px 0;">🎯 Today's Action: Add 10 High-Quality Photos</h3>
          <ul style="color: #ccc; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>3 exterior shots (different angles)</li>
            <li>3 work-in-progress photos</li>
            <li>2 before/after comparisons</li>
            <li>2 team photos (builds trust)</li>
          </ul>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://business.google.com" style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a3e635 100%); color: #000; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">GO TO GMB DASHBOARD</a>
        </div>
        <p style="color: #999; font-size: 13px; text-align: center;">Takes 15 minutes. Impact lasts forever.<br>- LocalRank Team</p>
      </div>
    </div>
  `;
}

function getDay7Template(lead) {
  const monthlyAggregatorCost = Math.round((100 - lead.health_score) * 80);
  const annualCost = monthlyAggregatorCost * 12;
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
        <h2 style="color: #fff; font-size: 26px; margin: 0 0 15px 0;">The Real Cost of "Renting" Leads</h2>
        <p style="color: #ccc; line-height: 1.6; font-size: 16px;">${lead.business_name || 'Hey there'}, I ran the numbers for your business...</p>
        <div style="background: rgba(239, 68, 68, 0.15); border: 2px solid #ef4444; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
          <p style="color: #ff6b6b; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">YOU'RE PROJECTED TO SPEND</p>
          <div style="font-size: 48px; color: #ef4444; font-weight: bold; margin: 10px 0;">$${annualCost.toLocaleString()}</div>
          <p style="color: #ccc; margin: 5px 0 0 0; font-size: 14px;">on lead aggregators this year</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://localrnk.com/Pricing" style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a3e635 100%); color: #000; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">STOP RENTING LEADS</a>
        </div>
        <p style="color: #999; font-size: 13px; text-align: center;">60-day money-back guarantee<br>- The LocalRank Team</p>
      </div>
    </div>
  `;
}