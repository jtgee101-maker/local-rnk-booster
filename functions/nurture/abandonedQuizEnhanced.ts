import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

/**
 * Abandoned Quiz Follow-up - ENHANCED WITH WOMP + META ADS
 * Triggers when someone starts quiz but doesn't complete
 * Uses 10 meta ad images and WOMP framework
 */

// Meta ad image URLs (from uploaded batch)
const META_AD_IMAGES = {
  pain_point: [
    'https://gmb-rank-booster-f0798aa4.base44.app/assets/meta-ads/pain-01.jpg',
    'https://gmb-rank-booster-f0798aa4.base44.app/assets/meta-ads/pain-02.jpg'
  ],
  social_proof: [
    'https://gmb-rank-booster-f0798aa4.base44.app/assets/meta-ads/social-03.jpg',
    'https://gmb-rank-booster-f0798aa4.base44.app/assets/meta-ads/social-04.jpg'
  ],
  urgency: [
    'https://gmb-rank-booster-f0798aa4.base44.app/assets/meta-ads/urgency-05.jpg',
    'https://gmb-rank-booster-f0798aa4.base44.app/assets/meta-ads/urgency-06.jpg'
  ],
  foxy: [
    'https://gmb-rank-booster-f0798aa4.base44.app/assets/meta-ads/foxy-07.jpg',
    'https://gmb-rank-booster-f0798aa4.base44.app/assets/meta-ads/foxy-08.jpg'
  ],
  educational: [
    'https://gmb-rank-booster-f0798aa4.base44.app/assets/meta-ads/edu-09.jpg',
    'https://gmb-rank-booster-f0798aa4.base44.app/assets/meta-ads/edu-10.jpg'
  ]
};

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Find incomplete quiz sessions
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    
    const quizStarts = await base44.asServiceRole.entities.ConversionEvent.filter({
      funnel_version: 'v3',
      event_name: 'quizv3_started',
      created_date: { $gte: twoDaysAgo, $lte: oneDayAgo }
    }, '-created_date', 100);
    
    const completions = await base44.asServiceRole.entities.ConversionEvent.filter({
      funnel_version: 'v3',
      event_name: 'quizv3_completed',
      created_date: { $gte: twoDaysAgo }
    }, '-created_date', 100);
    
    const completedSessions = new Set(completions.map(c => c.session_id));
    const abandonedSessions = quizStarts.filter(s => !completedSessions.has(s.session_id));
    
    let sent = 0;
    let errors = 0;
    
    for (const session of abandonedSessions.slice(0, 50)) {
      try {
        // Check existing emails
        const existingEmail = await base44.asServiceRole.entities.EmailLog.filter({
          metadata: { session_id: session.session_id, sequence: 'abandoned_quiz' }
        }, '-created_date', 1);
        
        if (existingEmail.length > 0) continue;
        
        const email = session.properties?.email || session.properties?.contact_email;
        if (!email) continue;
        
        // Get business name for personalization
        const businessName = session.properties?.business_name || 'Your Business';
        
        // Import Resend service
        const { sendCustomerEmail } = await import('../utils/resendEmailService.js');
        
        // Select email variant (A/B test: 50/50)
        const variant = Math.random() > 0.5 ? 'A' : 'B';
        const emailData = getWOMPEmail(variant, businessName);
        
        await sendCustomerEmail(
          email,
          emailData.subject,
          emailData.body,
          'Foxy from LocalRank.ai'
        );
        
        await base44.asServiceRole.entities.EmailLog.create({
          to: email,
          from: 'Foxy from LocalRank.ai',
          subject: emailData.subject,
          type: 'nurture',
          status: 'sent',
          variant: variant,
          metadata: { 
            session_id: session.session_id,
            sequence: 'abandoned_quiz',
            framework: 'WOMP',
            business_name: businessName
          }
        });
        
        sent++;
        
        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 100));
        
      } catch (error) {
        console.error('Failed to send abandoned email:', error);
        errors++;
      }
    }
    
    return Response.json({ 
      success: true, 
      abandoned: abandonedSessions.length,
      sent,
      errors,
      message: 'Enhanced WOMP emails sent with meta ad images'
    });
  } catch (error) {
    console.error('Abandoned quiz error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}));

/**
 * WOMP Framework Email Templates
 * A/B test two variants
 */
function getWOMPEmail(variant, businessName) {
  if (variant === 'A') {
    // Variant A: Pain-Focused (WOMP)
    return {
      subject: `🚨 ${businessName}: $2,847 leaking this month`,
      body: getPainFocusedTemplate(businessName)
    };
  } else {
    // Variant B: Urgency-Focused (WOMP)
    return {
      subject: `⏰ 3 customers just chose your competitor`,
      body: getUrgencyFocusedTemplate(businessName)
    };
  }
}

function getPainFocusedTemplate(businessName) {
  const imageUrl = META_AD_IMAGES.pain_point[0];
  
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
      
      <!-- Meta Ad Image -->
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="${imageUrl}" alt="Revenue Loss Visualization" style="max-width: 100%; border-radius: 12px; border: 1px solid #333;" />
      </div>
      
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
        
        <!-- W - What's In It For Me -->
        <h2 style="color: #ef4444; font-size: 28px; margin: 0 0 15px 0; text-align: center;">
          What would an extra $2,847/month do for ${businessName}?
        </h2>
        
        <p style="color: #ccc; font-size: 16px; line-height: 1.6; text-align: center;">
          That's what you're <strong style="color: #fff;">currently losing</strong> to competitors who show up in the Map Pack when you don't.
        </p>
        
        <!-- Revenue Calculator Box -->
        <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 8px;">
          <p style="margin: 0; font-size: 32px; font-weight: bold; color: #ef4444; text-align: center;">$34,164/year</p>
          <p style="margin: 10px 0 0 0; color: #aaa; text-align: center;">Going to your competitors</p>
        </div>
        
        <!-- O - Objection Handling -->
        <div style="background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #c8ff00; margin: 0 0 10px 0;">💭 "Can't I just fix this myself?"</h3>
          <p style="color: #aaa; margin: 0; font-size: 14px; line-height: 1.5;">
            Sure! But most DIY attempts take <strong>6-12 months</strong>. That's <strong style="color: #fff;">$17K-$34K</strong> left on the table while you figure it out.
          </p>
        </div>
        
        <!-- M - Make It Easy -->
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #fff; font-size: 18px; margin: 0 0 20px 0;">
            <strong>Or...</strong> Let me fix everything in <span style="color: #c8ff00;">48 hours</span>.
          </p>
          
          <a href="https://gmb-rank-booster-f0798aa4.base44.app/QuizGeeniusV2" 
             style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a8e000 100%); color: #0a0a0f; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            ⚡ Complete My Audit (2 Minutes)
          </a>
        </div>
        
        <!-- P - Proof -->
        <div style="background: rgba(0, 242, 255, 0.1); border: 1px solid #00f2ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #00f2ff; margin: 0 0 10px 0;">🎯 Real Client Results</h3>
          <p style="color: #ccc; margin: 0; font-size: 14px; line-height: 1.5;">
            <strong>Sarah's Dental Studio:</strong> +312% visibility in 3 weeks → 47 new patients → $12,400 additional monthly revenue
          </p>
        </div>
        
        <!-- Urgency -->
        <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">
          P.S. Your competitors are already doing this. Every day you wait is another <strong style="color: #ef4444;">$94</strong> gone.
        </p>
        
      </div>
      
      <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px;">
        You're receiving this because you started a LocalRank audit.<br>
        <a href="{unsubscribe_url}" style="color: #444;">Unsubscribe</a>
      </p>
      
    </div>
  `;
}

function getUrgencyFocusedTemplate(businessName) {
  const imageUrl = META_AD_IMAGES.urgency[0];
  
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
      
      <!-- Meta Ad Image -->
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="${imageUrl}" alt="Urgency Visualization" style="max-width: 100%; border-radius: 12px; border: 1px solid #333;" />
      </div>
      
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
        
        <!-- Urgent Hook -->
        <div style="background: rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 15px; text-align: center; margin-bottom: 25px;">
          <span style="color: #ef4444; font-size: 14px; font-weight: bold;">⏰ WHILE YOU READ THIS...</span>
        </div>
        
        <!-- W - What's In It For Me -->
        <h2 style="color: #fff; font-size: 24px; margin: 0 0 15px 0; text-align: center;">
          3 potential customers searched for "${businessName}"
        </h2>
        
        <p style="color: #ef4444; font-size: 20px; text-align: center; font-weight: bold; margin: 20px 0;">
          They chose your competitor.
        </p>
        
        <!-- Daily Loss Calculator -->
        <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 8px;">
          <p style="margin: 0; color: #aaa; font-size: 14px; text-align: center;">That's</p>
          <p style="margin: 10px 0; font-size: 36px; font-weight: bold; color: #ef4444; text-align: center;">$94</p>
          <p style="margin: 0; color: #aaa; font-size: 14px; text-align: center;">lost today alone</p>
        </div>
        
        <!-- O - Objection Handling -->
        <p style="color: #ccc; font-size: 15px; line-height: 1.6; text-align: center;">
          Not because they're better. Not because of price. Because they were <strong style="color: #fff;">visible</strong> and you weren't.
        </p>
        
        <!-- M - Make It Easy -->
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #fff; font-size: 16px; margin: 0 0 20px 0;">
            Fix your visibility in <span style="color: #c8ff00;">48 hours</span> with 3 clicks:
          </p>
          
          <a href="https://gmb-rank-booster-f0798aa4.base44.app/QuizGeeniusV2" 
             style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #fff; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);">
            🚨 Stop The Bleeding Now
          </a>
        </div>
        
        <!-- P - Proof -->
        <div style="background: rgba(0, 242, 255, 0.1); border: 1px solid #00f2ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <p style="color: #00f2ff; margin: 0 0 10px 0; font-weight: bold;">✅ What Happens Next:</p>
          <ul style="color: #ccc; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
            <li><strong>Week 1:</strong> GMB optimized → 23% more profile views</li>
            <li><strong>Week 2-3:</strong> AI citations deployed → ChatGPT visibility</li>
            <li><strong>Week 4:</strong> Map Pack ranking improves → 3-5x more clicks</li>
            <li><strong>Month 2-3:</strong> Top 3 positioning → $2,847+/mo recovered</li>
          </ul>
        </div>
        
        <!-- Final CTA -->
        <p style="color: #888; font-size: 13px; text-align: center; margin-top: 30px; line-height: 1.5;">
          Every minute you wait, another potential customer chooses them.<br>
          <strong style="color: #fff;">Don't let them take another one.</strong>
        </p>
        
      </div>
      
      <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px;">
        You're receiving this because you started a LocalRank audit.<br>
        <a href="{unsubscribe_url}" style="color: #444;">Unsubscribe</a>
      </p>
      
    </div>
  `;
}
