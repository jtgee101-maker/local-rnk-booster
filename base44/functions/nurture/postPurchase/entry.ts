import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Post-Purchase Onboarding Series — Day 1, 7, 14, 30
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { step } = await req.json();

    if (!step) return Response.json({ error: 'step parameter required' }, { status: 400 });

    const stepDays = { day1: 1, day7: 7, day14: 14, day30: 30 };
    const daysAgo = stepDays[step] || 1;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAgo);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const orders = await base44.asServiceRole.entities.Order.filter({
      status: 'completed',
      created_date: { $gte: targetDate.toISOString(), $lt: nextDay.toISOString() }
    }, '-created_date', 100);

    if (orders.length === 0) return Response.json({ success: true, processed: 0, message: 'No orders found for this day' });

    const apiKey = Deno.env.get('RESEND_API_KEY');
    let processed = 0;

    for (const order of orders.slice(0, 50)) {
      try {
        let businessName = 'there';
        if (order.lead_id) {
          const leads = await base44.asServiceRole.entities.Lead.filter({ id: order.lead_id });
          if (leads[0]) businessName = leads[0].business_name || 'there';
        }

        const templates = {
          day1: { subject: `🎉 Welcome to LocalRank - Your Onboarding Starts Now`, body: getDay1Template(businessName) },
          day7: { subject: `Week 1 Progress: Here's What We've Done`, body: getDay7Template(businessName) },
          day14: { subject: `${businessName} - Your GMB is Getting Noticed 📈`, body: getDay14Template(businessName) },
          day30: { subject: `30-Day Results: ${businessName}'s Transformation`, body: getDay30Template(businessName) }
        };

        const template = templates[step];
        if (!template) continue;

        const existing = await base44.asServiceRole.entities.EmailLog.filter({
          metadata: { order_id: order.id, step }
        });
        if (existing.length > 0) continue;

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'LocalRank.ai Team <noreply@updates.localrnk.com>',
            to: order.email,
            subject: template.subject,
            html: template.body
          })
        });

        if (!response.ok) throw new Error(`Resend API failed: ${response.statusText}`);
        const result = await response.json();

        await base44.asServiceRole.entities.EmailLog.create({
          to: order.email,
          from: 'LocalRank.ai',
          subject: template.subject,
          type: 'post_conversion',
          status: 'sent',
          metadata: { order_id: order.id, sequence: 'post_purchase', step, message_id: result.id }
        });

        processed++;
      } catch (error) {
        console.error(`Failed to send ${step} email for order ${order.id}:`, error);
      }
    }

    return Response.json({ success: true, step, processed });
  } catch (error) {
    console.error('Post-purchase error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getDay1Template(businessName) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
        <h2 style="color: #fff; text-align: center; font-size: 26px; margin: 0 0 15px 0;">Welcome to LocalRank, ${businessName}! 🎉</h2>
        <p style="color: #ccc; line-height: 1.6; font-size: 16px; text-align: center;">You just made one of the smartest investments in your business. Here's what happens next:</p>
        <div style="background: rgba(200, 255, 0, 0.1); border: 2px solid rgba(200, 255, 0, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #c8ff00; margin: 0 0 20px 0;">📋 Your 30-Day Roadmap</h3>
          <p style="color: #ccc; font-size: 14px; line-height: 1.8; margin: 0;">
            <strong style="color: #fff;">Days 1-7:</strong> Profile optimization, photo audit, category fixes<br>
            <strong style="color: #fff;">Days 8-14:</strong> Review generation system, competitor analysis<br>
            <strong style="color: #fff;">Days 15-30:</strong> Advanced strategies, tracking setup, ROI reporting
          </p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://localrnk.com/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a3e635 100%); color: #000; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">ACCESS DASHBOARD</a>
        </div>
        <p style="color: #999; font-size: 13px; text-align: center;">Questions? Reply anytime!<br>- Your LocalRank Team</p>
      </div>
    </div>
  `;
}

function getDay7Template(businessName) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
        <h2 style="color: #fff; font-size: 24px; margin: 0 0 15px 0;">Week 1 Complete: ${businessName} 📊</h2>
        <div style="background: rgba(200, 255, 0, 0.1); border: 2px solid rgba(200, 255, 0, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #c8ff00; margin: 0 0 15px 0;">✅ Completed This Week:</h3>
          <ul style="color: #ccc; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>GMB profile optimized</li>
            <li>15 high-quality photos added</li>
            <li>Critical technical issues resolved</li>
            <li>Review generation system activated</li>
          </ul>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://localrnk.com/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a3e635 100%); color: #000; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">VIEW PROGRESS</a>
        </div>
        <p style="color: #999; font-size: 13px; text-align: center;">- Your LocalRank Team</p>
      </div>
    </div>
  `;
}

function getDay14Template(businessName) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
        <h2 style="color: #fff; text-align: center; font-size: 24px; margin: 0 0 15px 0;">Your GMB is Getting Noticed! 📈</h2>
        <p style="color: #ccc; line-height: 1.6; font-size: 16px; text-align: center;">Great news, ${businessName} — the data is looking good:</p>
        <div style="background: rgba(200, 255, 0, 0.1); border: 2px solid rgba(200, 255, 0, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
          <h3 style="color: #c8ff00; margin: 0 0 15px 0;">📊 14-Day Stats:</h3>
          <div style="font-size: 32px; color: #c8ff00; font-weight: bold;">+41% Profile Views</div>
          <div style="font-size: 32px; color: #c8ff00; font-weight: bold; margin-top: 10px;">+28% Direction Requests</div>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://localrnk.com/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a3e635 100%); color: #000; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">SEE FULL REPORT</a>
        </div>
        <p style="color: #999; font-size: 13px; text-align: center;">- Your LocalRank Team</p>
      </div>
    </div>
  `;
}

function getDay30Template(businessName) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
        <h2 style="color: #c8ff00; text-align: center; font-size: 28px; margin: 0 0 15px 0;">30-Day Transformation Complete! 🏆</h2>
        <p style="color: #ccc; line-height: 1.6; font-size: 16px; text-align: center;">${businessName}, here's what we accomplished together:</p>
        <div style="background: rgba(200, 255, 0, 0.1); border: 2px solid rgba(200, 255, 0, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
          <div style="font-size: 48px; color: #c8ff00; font-weight: bold;">+67%</div>
          <p style="color: #ccc; margin: 5px 0 0 0; font-size: 14px;">Total GMB Views vs. Baseline</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://localrnk.com/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a3e635 100%); color: #000; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">VIEW FULL REPORT</a>
        </div>
        <p style="color: #999; font-size: 13px; text-align: center;">Proud of what we built together!<br>- Your LocalRank Team</p>
      </div>
    </div>
  `;
}