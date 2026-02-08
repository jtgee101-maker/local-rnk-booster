import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler';

const nurtureSequence = [
  {
    step: 1,
    delay_hours: 24,
    subject: "Don't lose another customer to competitors 🚨",
    template: (businessName) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #c8ff00;">Hey there,</h2>
        <p>Yesterday you discovered that ${businessName || 'your business'} has critical GMB issues costing you leads.</p>
        <p>The good news? These are <strong>easy fixes</strong> that take less than 30 minutes.</p>
        <p>But here's what happens if you wait:</p>
        <ul>
          <li>15+ calls per day continue going to competitors</li>
          <li>Your ranking drops further each week</li>
          <li>You lose $15,000+ in annual revenue</li>
        </ul>
        <a href="https://localrank.ai/Pricing" style="display: inline-block; background: #c8ff00; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
          Fix My GMB Profile Now
        </a>
        <p style="color: #666; font-size: 14px;">Limited time: 82% off (expires in 48 hours)</p>
      </div>
    `
  },
  {
    step: 2,
    delay_hours: 48,
    subject: "Your competitors just got 47 more calls than you 📞",
    template: (businessName) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Quick question...</p>
        <p>How many calls did you get from Google Maps this week?</p>
        <p>While you're thinking about it, your top 3 competitors are getting 15-20 calls <em>per day</em>.</p>
        <p><strong>What's the difference?</strong></p>
        <p>They optimized their GMB profiles. That's it.</p>
        <p>Same area. Same customers. Different results.</p>
        <a href="https://localrank.ai/Pricing" style="display: inline-block; background: #c8ff00; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
          Get My Fair Share of Calls
        </a>
      </div>
    `
  },
  {
    step: 3,
    delay_hours: 96,
    subject: "Last chance: 82% off expires tonight 🔥",
    template: (businessName) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>This is it.</p>
        <p>After tonight, our 82% discount goes away and the price jumps to $4.99/day.</p>
        <p>Right now? Just $0.11/day.</p>
        <p>For less than the cost of a stamp, you can:</p>
        <ul>
          <li>✅ Stop losing calls to competitors</li>
          <li>✅ Rank in the top 3 map pack</li>
          <li>✅ Get 15+ more leads per week</li>
        </ul>
        <p><strong>But only if you act now.</strong></p>
        <a href="https://localrank.ai/Pricing" style="display: inline-block; background: #c8ff00; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
          Claim 82% Off Now
        </a>
        <p style="color: #ef4444; font-weight: bold;">⏰ Offer expires in: 12 hours</p>
      </div>
    `
  },
  {
    step: 4,
    delay_hours: 168,
    subject: "We saved this spot for you... but not for long",
    template: (businessName) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>I'll be honest with you...</p>
        <p>We can only handle so many businesses at once. Right now we have 47 spots left.</p>
        <p>Once they're gone, there's a 30-day waitlist.</p>
        <p>We reserved a spot for ${businessName || 'your business'}, but I can't hold it forever.</p>
        <p>If you want to finally show up in the top 3 map results...</p>
        <p>If you're tired of watching competitors steal your customers...</p>
        <p>Now's the time.</p>
        <a href="https://localrank.ai/Pricing" style="display: inline-block; background: #c8ff00; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
          Claim My Spot Now
        </a>
      </div>
    `
  },
  {
    step: 5,
    delay_hours: 240,
    subject: "Final email: Your GMB audit results",
    template: (businessName, healthScore) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>This is my last email.</p>
        <p>I wanted to remind you of your results:</p>
        <div style="background: #1a1a1a; border-left: 4px solid #c8ff00; padding: 20px; margin: 20px 0;">
          <p><strong>Business:</strong> ${businessName || 'Your Business'}</p>
          <p><strong>Health Score:</strong> ${healthScore || 'N/A'}/100</p>
          <p><strong>Estimated Monthly Loss:</strong> $${Math.round((100 - (healthScore || 50)) * 200)}</p>
        </div>
        <p>You can keep losing money to competitors, or you can fix this today.</p>
        <p>Either way, I wish you the best.</p>
        <a href="https://localrank.ai/Pricing" style="display: inline-block; background: #c8ff00; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
          Get Started
        </a>
        <p style="color: #666; font-size: 12px;">If you're not interested, you won't hear from me again.</p>
      </div>
    `
  }
];

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active nurture sequences due for next email
    const now = new Date().toISOString();
    const activeNurtures = await base44.asServiceRole.entities.LeadNurture.filter({ 
      status: 'active'
    });

    const dueNurtures = activeNurtures.filter(n => 
      n.next_email_date && new Date(n.next_email_date) <= new Date()
    );

    let processed = 0;
    let errors = 0;

    for (const nurture of dueNurtures) {
      try {
        const nextStep = nurture.current_step + 1;
        
        if (nextStep > nurture.total_steps) {
          await base44.asServiceRole.entities.LeadNurture.update(nurture.id, {
            status: 'completed'
          });
          continue;
        }

        const sequence = nurtureSequence[nextStep - 1];
        if (!sequence) continue;

        // Get lead details
        const leads = await base44.asServiceRole.entities.Lead.filter({ id: nurture.lead_id });
        const lead = leads[0];

        // Send email
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: nurture.email,
          from_name: 'LocalRank.ai',
          subject: sequence.subject,
          body: sequence.template(lead?.business_name, lead?.health_score)
        });

        // Log email
        await base44.asServiceRole.entities.EmailLog.create({
          to: nurture.email,
          from: 'LocalRank.ai',
          subject: sequence.subject,
          type: 'other',
          status: 'sent',
          metadata: { nurture_id: nurture.id, step: nextStep }
        });

        // Update nurture
        const nextEmailDate = new Date();
        const nextSequence = nurtureSequence[nextStep];
        if (nextSequence) {
          nextEmailDate.setHours(nextEmailDate.getHours() + nextSequence.delay_hours);
        }

        await base44.asServiceRole.entities.LeadNurture.update(nurture.id, {
          current_step: nextStep,
          emails_sent: nurture.emails_sent + 1,
          last_email_date: new Date().toISOString(),
          next_email_date: nextSequence ? nextEmailDate.toISOString() : null,
          status: nextStep >= nurture.total_steps ? 'completed' : 'active'
        });

        processed++;
      } catch (error) {
        console.error('Error processing nurture:', error);
        errors++;
      }
    }

    return Response.json({ 
      success: true, 
      processed, 
      errors,
      total: dueNurtures.length 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}));