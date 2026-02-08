import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler } from './utils/errorHandler.js';

/**
 * Enhanced Foxy Nurture Email - HYBRID VERSION
 * Uses Resend API if available, falls back to Base44 Core.SendEmail
 * Enhanced with WOMP framework and meta ad images
 */

// Meta ad image URLs
const META_AD_IMAGES = {
  pain_point: 'https://gmb-rank-booster-f0798aa4.base44.app/assets/meta-ads/pain-01.jpg',
  social_proof: 'https://gmb-rank-booster-f0798aa4.base44.app/assets/meta-ads/social-03.jpg',
  urgency: 'https://gmb-rank-booster-f0798aa4.base44.app/assets/meta-ads/urgency-05.jpg',
  foxy: 'https://gmb-rank-booster-f0798aa4.base44.app/assets/meta-ads/foxy-07.jpg'
};

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { nurtureId } = await req.json();

    // Get nurture record
    const nurtures = await base44.asServiceRole.entities.LeadNurture.filter({ id: nurtureId });
    if (!nurtures || nurtures.length === 0) {
      return Response.json({ error: 'Nurture record not found' }, { status: 404 });
    }
    const nurture = nurtures[0];

    // Get lead data
    const leads = await base44.asServiceRole.entities.Lead.filter({ id: nurture.lead_id });
    if (!leads || leads.length === 0) {
      throw new Error('Lead not found');
    }
    const leadData = leads[0];

    // Calculate revenue metrics
    const avgOrderValue = leadData.business_category === 'home_services' ? 450 : 
                         leadData.business_category === 'medical' ? 350 :
                         leadData.business_category === 'professional' ? 400 : 350;
    
    const searchVolume = 1200;
    const currentRank = leadData.health_score < 70 ? 9 : leadData.health_score < 85 ? 5 : 3;
    const currentCTR = currentRank >= 9 ? 0.02 : currentRank >= 5 ? 0.06 : 0.15;
    const targetCTR = 0.25;
    const monthlyLeak = Math.round(searchVolume * (targetCTR - currentCTR) * avgOrderValue * 0.3);

    // Get email content with WOMP framework
    const emailContent = getWOMPEmailTemplate(nurture.current_step + 1, leadData, monthlyLeak);

    // Try Resend API first, fallback to Base44 Core
    let result;
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    if (RESEND_API_KEY) {
      // Use Resend API
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Foxy from LocalRank.ai <onboarding@resend.dev>',
          to: leadData.email,
          subject: emailContent.subject,
          html: emailContent.html,
        }),
      });

      if (!response.ok) {
        throw new Error(`Resend API error: ${response.statusText}`);
      }

      result = await response.json();
    } else {
      // Fallback to Base44 Core.SendEmail
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: leadData.email,
        from_name: 'Foxy from LocalRank.ai',
        subject: emailContent.subject,
        body: emailContent.html
      });
      
      result = { id: 'base44-core-' + Date.now() };
    }

    // Log email
    await base44.asServiceRole.entities.EmailLog.create({
      to: leadData.email,
      from: 'Foxy from LocalRank.ai',
      subject: emailContent.subject,
      type: 'nurture',
      status: 'sent',
      metadata: { 
        lead_id: leadData.id, 
        nurture_id: nurtureId,
        nurture_step: nurture.current_step + 1,
        email_id: result.id,
        health_score: leadData.health_score,
        revenue_leak: monthlyLeak,
        sent_via: RESEND_API_KEY ? 'resend_api' : 'base44_core'
      }
    });

    // Update nurture record
    const nextStep = nurture.current_step + 1;
    const nextEmailDate = new Date();
    nextEmailDate.setDate(nextEmailDate.getDate() + 2);

    await base44.asServiceRole.entities.LeadNurture.update(nurtureId, {
      current_step: nextStep,
      emails_sent: (nurture.emails_sent || 0) + 1,
      last_email_date: new Date().toISOString(),
      next_email_date: nextStep < nurture.total_steps ? nextEmailDate.toISOString() : null,
      status: nextStep >= nurture.total_steps ? 'completed' : 'active'
    });

    return Response.json({ 
      success: true, 
      email_id: result.id,
      next_step: nextStep,
      sequence_complete: nextStep >= nurture.total_steps,
      sent_via: RESEND_API_KEY ? 'resend_api' : 'base44_core'
    });

  } catch (error) {
    console.error('Foxy nurture email error:', error);
    
    // Log error
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'email_failure',
        severity: 'high',
        message: `Foxy nurture email failed: ${error.message}`,
        metadata: { function: 'sendFoxyNurtureEmailEnhanced', error: error.stack }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return Response.json({ error: error.message }, { status: 500 });
  }
}));

/**
 * WOMP Framework Email Templates with Meta Ad Images
 */
function getWOMPEmailTemplate(step, lead, monthlyLeak) {
  const templates = {
    1: getStep1Template(lead, monthlyLeak),
    2: getStep2Template(lead, monthlyLeak),
    3: getStep3Template(lead, monthlyLeak),
    4: getStep4Template(lead, monthlyLeak),
    5: getStep5Template(lead, monthlyLeak)
  };

  return templates[step] || templates[1];
}

// Step 1: W - What's In It For Me
function getStep1Template(lead, monthlyLeak) {
  const businessName = lead.business_name || 'Your Business';
  const imageUrl = META_AD_IMAGES.pain_point;
  
  return {
    subject: `🚨 ${businessName}: $${monthlyLeak.toLocaleString()}/month leaking to competitors`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
        
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${imageUrl}" alt="Revenue Loss" style="max-width: 100%; border-radius: 12px; border: 1px solid #333;" />
        </div>
        
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
          
          <h2 style="color: #ef4444; font-size: 28px; margin: 0 0 15px 0; text-align: center;">
            What would an extra $${monthlyLeak.toLocaleString()}/month do for ${businessName}?
          </h2>
          
          <p style="color: #ccc; font-size: 16px; line-height: 1.6; text-align: center;">
            That's what you're <strong style="color: #fff;">currently losing</strong> to competitors who show up in the Map Pack when you don't.
          </p>
          
          <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <p style="margin: 0; font-size: 32px; font-weight: bold; color: #ef4444; text-align: center;">$${(monthlyLeak * 12).toLocaleString()}/year</p>
            <p style="margin: 10px 0 0 0; color: #aaa; text-align: center;">Going to your competitors</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://gmb-rank-booster-f0798aa4.base44.app/QuizGeeniusV2" 
               style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a8e000 100%); color: #0a0a0f; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              ⚡ Complete My Audit (2 Minutes)
            </a>
          </div>
          
        </div>
      </div>
    `
  };
}

// Step 2: O - Objection Handling
function getStep2Template(lead, monthlyLeak) {
  const businessName = lead.business_name || 'Your Business';
  
  return {
    subject: `💭 "Can't I just fix this myself?" (The truth about DIY)`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
          
          <h2 style="color: #fff; font-size: 24px; margin: 0 0 20px 0;">
            "Can't I just fix this myself?"
          </h2>
          
          <p style="color: #ccc; font-size: 16px; line-height: 1.6;">
            Absolutely! But here's what most ${lead.business_category || 'business'} owners discover:
          </p>
          
          <div style="background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #c8ff00; margin: 0 0 10px 0; font-weight: bold;">DIY Timeline:</p>
            <ul style="color: #ccc; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Research & learning: 2-3 months</li>
              <li>Implementation: 3-6 months</li>
              <li>Testing & optimization: 2-3 months</li>
              <li><strong>Total: 6-12 months</strong></li>
            </ul>
          </div>
          
          <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 0; color: #ef4444; font-weight: bold;">
              Cost of waiting: $${monthlyLeak.toLocaleString()}/month × 12 months = $${(monthlyLeak * 12).toLocaleString()}
            </p>
          </div>
          
          <p style="color: #ccc; font-size: 16px; line-height: 1.6;">
            <strong style="color: #fff;">Or...</strong> Let us fix everything in <span style="color: #c8ff00;">48 hours</span> for a fraction of that cost.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://gmb-rank-booster-f0798aa4.base44.app/CheckoutV2" 
               style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a8e000 100%); color: #0a0a0f; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              🚀 Fix My GMB in 48 Hours
            </a>
          </div>
          
        </div>
      </div>
    `
  };
}

// Step 3: M - Make It Easy
function getStep3Template(lead, monthlyLeak) {
  const imageUrl = META_AD_IMAGES.foxy;
  
  return {
    subject: `✅ 3 clicks to fix your GMB (Here's how)`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
        
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${imageUrl}" alt="Foxy" style="max-width: 200px; border-radius: 12px;" />
        </div>
        
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
          
          <h2 style="color: #c8ff00; font-size: 24px; margin: 0 0 20px 0; text-align: center;">
            We make it ridiculously easy
          </h2>
          
          <div style="background: rgba(200, 255, 0, 0.1); border: 1px solid rgba(200, 255, 0, 0.3); border-radius: 12px; padding: 25px; margin: 20px 0;">
            
            <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
              <div style="background: #c8ff00; color: #000; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">1</div>
              <div>
                <p style="color: #fff; margin: 0; font-weight: bold;">Complete Your Audit (2 minutes)</p>
                <p style="color: #aaa; margin: 5px 0 0 0; font-size: 14px;">We analyze your GMB and identify all issues</p>
              </div>
            </div>
            
            <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
              <div style="background: #c8ff00; color: #000; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">2</div>
              <div>
                <p style="color: #fff; margin: 0; font-weight: bold;">Approve Your Fix Plan</p>
                <p style="color: #aaa; margin: 5px 0 0 0; font-size: 14px;">Review our recommendations and give the green light</p>
              </div>
            </div>
            
            <div style="display: flex; align-items: flex-start;">
              <div style="background: #c8ff00; color: #000; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">3</div>
              <div>
                <p style="color: #fff; margin: 0; font-weight: bold;">We Fix Everything in 48 Hours</p>
                <p style="color: #aaa; margin: 5px 0 0 0; font-size: 14px;">Sit back while our AI + experts optimize your GMB</p>
              </div>
            </div>
            
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://gmb-rank-booster-f0798aa4.base44.app/QuizGeeniusV2" 
               style="display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a8e000 100%); color: #0a0a0f; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              ⚡ Start Now (2 Minutes)
            </a>
          </div>
          
        </div>
      </div>
    `
  };
}

// Step 4: P - Proof
function getStep4Template(lead, monthlyLeak) {
  const imageUrl = META_AD_IMAGES.social_proof;
  
  return {
    subject: `📈 How Sarah recovered $12,400/month (Case Study)`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
        
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${imageUrl}" alt="Success Story" style="max-width: 100%; border-radius: 12px; border: 1px solid #333;" />
        </div>
        
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
          
          <h2 style="color: #00f2ff; font-size: 24px; margin: 0 0 20px 0;">
            Real Client Results
          </h2>
          
          <div style="background: rgba(0, 242, 255, 0.1); border: 1px solid #00f2ff; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="color: #fff; margin: 0 0 10px 0; font-size: 18px; font-weight: bold;">Sarah's Dental Studio</p>
            <p style="color: #ccc; margin: 0; font-size: 14px; line-height: 1.6;">
              "We were invisible on Google Maps. LocalRank changed everything in 3 weeks."
            </p>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; text-align: center;">
              <p style="color: #c8ff00; font-size: 24px; font-weight: bold; margin: 0;">+312%</p>
              <p style="color: #aaa; font-size: 12px; margin: 5px 0 0 0;">Visibility Increase</p>
            </div>
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; text-align: center;">
              <p style="color: #c8ff00; font-size: 24px; font-weight: bold; margin: 0;">47</p>
              <p style="color: #aaa; font-size: 12px; margin: 5px 0 0 0;">New Patients</p>
            </div>
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; text-align: center;">
              <p style="color: #c8ff00; font-size: 24px; font-weight: bold; margin: 0;">3 weeks</p>
              <p style="color: #aaa; font-size: 12px; margin: 5px 0 0 0;">Time to Results</p>
            </div>
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; text-align: center;">
              <p style="color: #c8ff00; font-size: 24px; font-weight: bold; margin: 0;">$12.4K</p>
              <p style="color: #aaa; font-size: 12px; margin: 5px 0 0 0;">Monthly Revenue</p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://gmb-rank-booster-f0798aa4.base44.app/CheckoutV2" 
               style="display: inline-block; background: linear-gradient(135deg, #00f2ff 0%, #00c8ff 100%); color: #0a0a0f; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              🚀 Get Similar Results
            </a>
          </div>
          
        </div>
      </div>
    `
  };
}

// Step 5: Final CTA
function getStep5Template(lead, monthlyLeak) {
  const dailyLoss = Math.round(monthlyLeak / 30);
  const imageUrl = META_AD_IMAGES.urgency;
  
  return {
    subject: `⏰ Final notice: $${dailyLoss} lost today alone`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;">
        
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${imageUrl}" alt="Urgency" style="max-width: 100%; border-radius: 12px; border: 1px solid #333;" />
        </div>
        
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 30px;">
          
          <div style="background: rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 15px; text-align: center; margin-bottom: 25px;">
            <span style="color: #ef4444; font-size: 14px; font-weight: bold;">⏰ FINAL NOTICE</span>
          </div>
          
          <h2 style="color: #ef4444; font-size: 26px; margin: 0 0 15px 0; text-align: center;">
            $${dailyLoss} lost today.
          </h2>
          
          <p style="color: #ccc; font-size: 16px; line-height: 1.6; text-align: center;">
            That's how much went to your competitors while you were reading this email series.
          </p>
          
          <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <p style="margin: 0; color: #fff; text-align: center; font-weight: bold;">
              This is your last chance to recover $${monthlyLeak.toLocaleString()}/month.
            </p>
          </div>
          
          <p style="color: #aaa; font-size: 14px; text-align: center; line-height: 1.6;">
            After this, you'll be removed from our priority list and your spot will go to another business.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://gmb-rank-booster-f0798aa4.base44.app/CheckoutV2?urgency=final" 
               style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #fff; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);">
              🚨 Claim My Spot Now
            </a>
          </div>
          
          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px;">
            This is the final email in our series. If you're not ready now, we understand. You can always reach out when the time is right.
          </p>
          
        </div>
      </div>
    `
  };
}
