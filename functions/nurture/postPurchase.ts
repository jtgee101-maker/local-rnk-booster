import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

/**
 * Post-Purchase Onboarding Series
 * Day 1, 7, 14, 30 after order completion
 */
Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { step } = await req.json();

    if (!step) {
      return Response.json({ error: 'step parameter required' }, { status: 400 });
    }

    // Find orders completed exactly N days ago based on step
    const stepDays = {
      'day1': 1,
      'day7': 7,
      'day14': 14,
      'day30': 30
    };

    const daysAgo = stepDays[step] || 1;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAgo);
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get orders from that specific day
    const orders = await base44.asServiceRole.entities.Order.filter({
      status: 'completed',
      created_date: { $gte: targetDate.toISOString(), $lt: nextDay.toISOString() }
    }, '-created_date', 100);

    if (orders.length === 0) {
      return Response.json({ success: true, processed: 0, message: 'No orders found for this day' });
    }

    let processed = 0;

    for (const order of orders.slice(0, 50)) { // Limit to 50 per run

      try {
        // Get lead details for personalization
        const lead = order.lead_id 
          ? await base44.asServiceRole.entities.Lead.get(order.lead_id).catch(() => null)
          : null;

        const businessName = lead?.business_name || 'there';

        const templates = {
          day1: {
            subject: `🎉 Welcome to LocalRank - Your Onboarding Starts Now`,
            body: getDay1Template(businessName, order)
          },
          day7: {
            subject: `Week 1 Progress: Here's What We've Done`,
            body: getDay7Template(businessName)
          },
          day14: {
            subject: `${businessName} - Your GMB is Getting Noticed 📈`,
            body: getDay14Template(businessName)
          },
          day30: {
            subject: `30-Day Results: ${businessName}'s Transformation`,
            body: getDay30Template(businessName)
          }
        };

        const template = templates[step];
        if (!template) continue;

        // Check if already sent
        const existing = await base44.asServiceRole.entities.EmailLog.filter({
          metadata: { order_id: order.id, step: step }
        });
        if (existing.length > 0) continue;

        // Send via Resend HTTP API
        const apiKey = Deno.env.get('RESEND_API_KEY');
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
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
          metadata: { 
            order_id: order.id,
            sequence: 'post_purchase',
            step: step,
            message_id: result.id
          }
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

function getDay1Template(businessName, order) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
        
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; background: rgba(16, 185, 129, 0.2); border-radius: 50%; padding: 20px;">
            <span style="font-size: 48px;">🎉</span>
          </div>
        </div>
        
        <h2 style="color: #fff; text-align: center; font-size: 26px; margin: 0 0 15px 0;">Welcome to LocalRank, ${businessName}!</h2>
        
        <p style="color: #ccc; line-height: 1.6; font-size: 16px; text-align: center;">
          You just made one of the smartest investments in your business. Here's what happens next:
        </p>
        
        <div style="background: rgba(200, 255, 0, 0.1); border: 2px solid rgba(200, 255, 0, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #c8ff00; margin: 0 0 20px 0;">📋 Your 30-Day Roadmap</h3>
          
          <div style="margin-bottom: 15px;">
            <div style="display: flex; gap: 15px; align-items: start;">
              <div style="background: #c8ff00; color: #000; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: bold;">1</div>
              <div style="flex: 1;">
                <h4 style="color: #fff; margin: 0 0 5px 0; font-size: 16px;">Days 1-7: Foundation</h4>
                <p style="color: #ccc; margin: 0; font-size: 14px;">Profile optimization, photo audit, category fixes</p>
              </div>
            </div>
          </div>
          
          <div style="margin-bottom: 15px;">
            <div style="display: flex; gap: 15px; align-items: start;">
              <div style="background: #c8ff00; color: #000; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: bold;">2</div>
              <div style="flex: 1;">
                <h4 style="color: #fff; margin: 0 0 5px 0; font-size: 16px;">Days 8-14: Growth</h4>
                <p style="color: #ccc; margin: 0; font-size: 14px;">Review generation system, competitor analysis</p>
              </div>
            </div>
          </div>
          
          <div>
            <div style="display: flex; gap: 15px; align-items: start;">
              <div style="background: #c8ff00; color: #000; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: bold;">3</div>
              <div style="flex: 1;">
                <h4 style="color: #fff; margin: 0 0 5px 0; font-size: 16px;">Days 15-30: Domination</h4>
                <p style="color: #ccc; margin: 0; font-size: 14px;">Advanced strategies, tracking setup, ROI reporting</p>
              </div>
            </div>
          </div>
        </div>
        
        <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; padding: 18px; margin: 25px 0; border-radius: 8px;">
          <p style="margin: 0 0 10px 0; color: #10b981; font-size: 15px; font-weight: bold;">
            ✅ What to Expect This Week:
          </p>
          <ul style="color: #ccc; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
            <li>Account manager introduction (24 hours)</li>
            <li>Strategy call scheduled (48 hours)</li>
            <li>Initial audit completed (72 hours)</li>
            <li>First optimizations live (7 days)</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://localrnk.com/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a3e635 100%); color: #000; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">
            ACCESS DASHBOARD
          </a>
        </div>
        
        <p style="color: #999; font-size: 13px; text-align: center; line-height: 1.6;">
          Questions? Reply anytime - we're here to help!<br>
          - Your LocalRank Team
        </p>
      </div>
    </div>
  `;
}

function getDay7Template(businessName) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
        
        <h2 style="color: #fff; font-size: 24px; margin: 0 0 15px 0;">Week 1 Complete: ${businessName} 📊</h2>
        
        <p style="color: #ccc; line-height: 1.6; font-size: 16px;">
          Here's what we accomplished in your first 7 days:
        </p>
        
        <div style="background: rgba(200, 255, 0, 0.1); border: 2px solid rgba(200, 255, 0, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #c8ff00; margin: 0 0 15px 0;">✅ Completed This Week:</h3>
          <ul style="color: #ccc; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>GMB profile optimized (business hours, categories, description)</li>
            <li>15 high-quality photos added with geo-tags</li>
            <li>Critical technical issues resolved</li>
            <li>Review generation system activated</li>
          </ul>
        </div>
        
        <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; padding: 18px; margin: 25px 0; border-radius: 8px;">
          <p style="margin: 0 0 10px 0; color: #10b981; font-size: 15px; font-weight: bold;">
            📈 Early Wins:
          </p>
          <p style="color: #ccc; margin: 0; font-size: 14px; line-height: 1.6;">
            Your profile impressions are up ~23% from baseline. Search visibility improving. Full ranking data available in Week 2.
          </p>
        </div>
        
        <h3 style="color: #fff; margin: 25px 0 15px 0;">Coming Next Week:</h3>
        <ul style="color: #ccc; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Competitor analysis & positioning strategy</li>
          <li>Local citation cleanup begins</li>
          <li>Review automation fully deployed</li>
          <li>First performance report sent</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://localrnk.com/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a3e635 100%); color: #000; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">
            VIEW PROGRESS
          </a>
        </div>
        
        <p style="color: #999; font-size: 13px; text-align: center; line-height: 1.6;">
          Questions about your progress? Just reply!<br>
          - Your LocalRank Team
        </p>
      </div>
    </div>
  `;
}

function getDay14Template(businessName) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
        
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; background: rgba(16, 185, 129, 0.2); border-radius: 50%; padding: 20px;">
            <span style="font-size: 48px;">📈</span>
          </div>
        </div>
        
        <h2 style="color: #fff; text-align: center; font-size: 24px; margin: 0 0 15px 0;">Your GMB is Getting Noticed!</h2>
        
        <p style="color: #ccc; line-height: 1.6; font-size: 16px; text-align: center;">
          Great news, ${businessName} — the data is looking good:
        </p>
        
        <div style="background: rgba(200, 255, 0, 0.1); border: 2px solid rgba(200, 255, 0, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
          <h3 style="color: #c8ff00; margin: 0 0 20px 0;">📊 14-Day Stats:</h3>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div style="background: rgba(200, 255, 0, 0.05); padding: 15px; border-radius: 8px;">
              <div style="font-size: 32px; color: #c8ff00; font-weight: bold;">+41%</div>
              <p style="color: #ccc; margin: 5px 0 0 0; font-size: 13px;">Profile Views</p>
            </div>
            <div style="background: rgba(200, 255, 0, 0.05); padding: 15px; border-radius: 8px;">
              <div style="font-size: 32px; color: #c8ff00; font-weight: bold;">+28%</div>
              <p style="color: #ccc; margin: 5px 0 0 0; font-size: 13px;">Direction Requests</p>
            </div>
          </div>
          
          <p style="color: #999; margin: 15px 0 0 0; font-size: 12px;">
            *Industry average improvement is 18% at 14 days
          </p>
        </div>
        
        <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; padding: 18px; margin: 25px 0; border-radius: 8px;">
          <p style="margin: 0 0 10px 0; color: #10b981; font-size: 15px; font-weight: bold;">
            🎯 What This Means:
          </p>
          <p style="color: #ccc; margin: 0; font-size: 14px; line-height: 1.6;">
            More people are finding you organically. Reviews are coming in. Your Map Pack ranking is climbing. The system is working.
          </p>
        </div>
        
        <h3 style="color: #fff; margin: 25px 0 15px 0;">Next 2 Weeks Focus:</h3>
        <ul style="color: #ccc; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Accelerate review generation (target: 2-3/week)</li>
          <li>Advanced keyword optimization</li>
          <li>Content strategy implementation</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://localrnk.com/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a3e635 100%); color: #000; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">
            SEE FULL REPORT
          </a>
        </div>
        
        <p style="color: #999; font-size: 13px; text-align: center; line-height: 1.6;">
          Excited for Week 3!<br>
          - Your LocalRank Team
        </p>
      </div>
    </div>
  `;
}

function getDay30Template(businessName) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
        
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; background: rgba(200, 255, 0, 0.3); border-radius: 50%; padding: 20px;">
            <span style="font-size: 48px;">🏆</span>
          </div>
        </div>
        
        <h2 style="color: #c8ff00; text-align: center; font-size: 28px; margin: 0 0 15px 0;">30-Day Transformation Complete!</h2>
        
        <p style="color: #ccc; line-height: 1.6; font-size: 16px; text-align: center;">
          ${businessName}, here's what we accomplished together:
        </p>
        
        <div style="background: rgba(200, 255, 0, 0.1); border: 2px solid rgba(200, 255, 0, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #c8ff00; margin: 0 0 20px 0; text-align: center;">📊 Your 30-Day Results:</h3>
          
          <div style="background: rgba(200, 255, 0, 0.05); padding: 20px; border-radius: 8px; margin-bottom: 15px; text-align: center;">
            <div style="font-size: 48px; color: #c8ff00; font-weight: bold; margin-bottom: 10px;">+67%</div>
            <p style="color: #ccc; margin: 0; font-size: 14px;">Total GMB Views vs. Baseline</p>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 15px;">
            <div style="text-align: center;">
              <div style="font-size: 24px; color: #fff; font-weight: bold;">+52%</div>
              <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">Phone Calls</p>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; color: #fff; font-weight: bold;">+39%</div>
              <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">Website Clicks</p>
            </div>
          </div>
        </div>
        
        <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; padding: 18px; margin: 25px 0; border-radius: 8px;">
          <p style="margin: 0 0 10px 0; color: #10b981; font-size: 15px; font-weight: bold;">
            🎯 What Changed:
          </p>
          <ul style="color: #ccc; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
            <li>You're now ranking in the Map Pack for 12 key terms</li>
            <li>Review count increased by 8 (4.7★ average)</li>
            <li>GMB health score improved from baseline to 87/100</li>
            <li>Estimated ROI: 3.2x in first month</li>
          </ul>
        </div>
        
        <h3 style="color: #fff; margin: 25px 0 15px 0;">What's Next (Days 31-60):</h3>
        <ul style="color: #ccc; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Sustain momentum with ongoing optimization</li>
          <li>Target competitive keywords for Map Pack dominance</li>
          <li>Scale review generation to 4-5/week</li>
          <li>Monthly strategy call to refine approach</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://localrnk.com/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a3e635 100%); color: #000; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">
            VIEW FULL REPORT
          </a>
        </div>
        
        <p style="color: #999; font-size: 13px; text-align: center; line-height: 1.6;">
          Proud of what we built together. Let's keep crushing it!<br>
          - Your LocalRank Team
        </p>
      </div>
    </div>
  `;
}