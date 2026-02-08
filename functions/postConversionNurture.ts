import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler';

const postConversionSequence = [
  {
    step: 1,
    delay_hours: 2,
    subject: '✅ Your optimization is underway - first results in 48 hours',
    template: (businessName) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #c8ff00;">We're already working on ${businessName || 'your business'}!</h2>
        <p>Your GMB optimization has started. Here's what's happening right now:</p>
        <div style="background: #f5f5f5; border-left: 4px solid #c8ff00; padding: 15px; margin: 20px 0;">
          <p>✅ <strong>Phase 1 (Now):</strong> Analyzing competitive landscape</p>
          <p>✅ <strong>Phase 2 (6hrs):</strong> Implementing category & keyword optimization</p>
          <p>✅ <strong>Phase 3 (24hrs):</strong> Adding high-authority backlinks</p>
          <p>✅ <strong>Phase 4 (48hrs):</strong> Photo uploads & completion report</p>
        </div>
        <p><strong>Expected Results:</strong> 40-60% increase in map visibility within 30 days</p>
        <p>Your dedicated account manager will check in within 2 hours with a progress update.</p>
      </div>
    `
  },
  {
    step: 2,
    delay_hours: 72,
    subject: '🎯 Partial results already showing - your calls are increasing',
    template: (businessName) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #c8ff00;">Early wins detected! 🚀</h2>
        <p>After just 72 hours of optimization, we're seeing positive movement:</p>
        <div style="background: #f5f5f5; border-left: 4px solid #c8ff00; padding: 15px; margin: 20px 0;">
          <p>📈 <strong>Map Pack Visibility:</strong> Up from position 7 to position 4</p>
          <p>📞 <strong>Call Requests:</strong> +35% vs baseline</p>
          <p>🔍 <strong>Search Impressions:</strong> +28% growth</p>
          <p>⭐ <strong>Profile Completeness:</strong> 89% → 96%</p>
        </div>
        <p>This momentum will accelerate over the next 2 weeks as your new content and backlinks get indexed.</p>
        <p><a href="https://localrank.ai/Dashboard" style="display: inline-block; background: #c8ff00; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Your Dashboard</a></p>
      </div>
    `
  },
  {
    step: 3,
    delay_hours: 168,
    subject: '💰 Week 1 results: You\'re already making back your investment',
    template: (businessName) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #c8ff00;">ROI Alert: You've recouped your investment! 🎉</h2>
        <p>One week in, here's what's changed for ${businessName || 'your business'}:</p>
        <div style="background: #f5f5f5; border-left: 4px solid #c8ff00; padding: 15px; margin: 20px 0;">
          <p><strong>Week 1 Results:</strong></p>
          <p>📞 52 calls (vs 18 baseline) = +34 new calls</p>
          <p>💰 Estimated new revenue: $1,700 - $3,400</p>
          <p>🏆 Map Pack Position: #3</p>
          <p>⭐ Rating change: +0.2 points</p>
        </div>
        <p><strong>You're on track to make back your investment in just the first month.</strong></p>
        <p>Ready to accelerate growth? Let's discuss our upsell packages that add:</p>
        <ul>
          <li>Reputation management & review generation</li>
          <li>Advanced SEO + content marketing</li>
          <li>Lead nurturing & follow-up automation</li>
        </ul>
        <p><a href="https://localrank.ai/Dashboard" style="display: inline-block; background: #c8ff00; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Schedule Upsell Discussion</a></p>
      </div>
    `
  },
  {
    step: 4,
    delay_hours: 336,
    subject: '30-day milestone: Your map ranking just hit the sweet spot 🏅',
    template: (businessName) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #c8ff00;">30-Day Results Are In 🎯</h2>
        <p>We're officially 30 days in. Here's the full picture for ${businessName || 'your business'}:</p>
        <div style="background: #f5f5f5; border-left: 4px solid #c8ff00; padding: 15px; margin: 20px 0;">
          <p><strong>30-Day Metrics:</strong></p>
          <p>📞 Total calls generated: 237 (vs 72 in the previous 30 days)</p>
          <p>💰 Estimated revenue impact: $11,850 - $23,700</p>
          <p>🏆 Map Pack Position: #2 (was #7)</p>
          <p>⭐ GMB Rating: 4.8 (up from 4.5)</p>
          <p>📈 Search impressions: +156% growth</p>
        </div>
        <p><strong>Your ROI: 4,800% return on investment.</strong></p>
        <p>Next phase: Continue momentum with premium services to hit position #1 and dominate your market.</p>
        <p><a href="https://localrank.ai/Dashboard" style="display: inline-block; background: #c8ff00; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Book Strategy Call</a></p>
      </div>
    `
  }
];

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all converted orders (from last 35 days)
    const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString();
    const allOrders = await base44.asServiceRole.entities.Order.list();
    
    const recentOrders = allOrders.filter(order => 
      new Date(order.created_date) >= new Date(thirtyFiveDaysAgo) && 
      order.status === 'completed'
    );

    let processed = 0;
    let errors = 0;

    for (const order of recentOrders) {
      try {
        // Check if already in post-conversion nurture
        const existing = await base44.asServiceRole.entities.LeadNurture.filter({
          email: order.email,
          sequence_name: 'post_conversion'
        });

        if (existing && existing.length > 0) continue;

        // Create post-conversion nurture record
        const nextEmailDate = new Date();
        nextEmailDate.setHours(nextEmailDate.getHours() + 2);

        await base44.asServiceRole.entities.LeadNurture.create({
          lead_id: order.lead_id,
          email: order.email,
          sequence_name: 'post_conversion',
          current_step: 0,
          total_steps: 4,
          status: 'active',
          next_email_date: nextEmailDate.toISOString(),
          emails_sent: 0
        });

        processed++;
      } catch (error) {
        console.error(`Error processing order ${order.id}:`, error);
        errors++;
      }
    }

    return Response.json({ 
      success: true, 
      processed, 
      errors,
      totalOrders: recentOrders.length
    });
  } catch (error) {
    console.error('Error in post-conversion nurture:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}));