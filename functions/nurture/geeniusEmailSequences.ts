import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const sequences = {
  // Immediately after audit submission
  audit_submitted: {
    delay: 0,
    template: (lead) => ({
      subject: "Your GMB Audit is Being Analyzed",
      from: "LocalRank.ai <support@localrank.ai>",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #c8ff00;">Thank you, ${lead.contact_name || 'there'}!</h2>
          <p>We've received your audit submission for <strong>${lead.business_name}</strong>.</p>
          <p>Our AI is analyzing your Google My Business profile now. You'll get:</p>
          <ul>
            <li>📊 Full audit report (within 2 hours)</li>
            <li>🎯 Personalized optimization roadmap</li>
            <li>💡 AI-powered recommendations</li>
          </ul>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">Check your inbox for your custom audit report soon!</p>
        </div>
      `
    })
  },

  // 2 hours after audit - no pathway selection
  pathway_selection_nudge_2h: {
    delay: 7200,
    template: (lead) => ({
      subject: "Your GMB Audit Results Are Ready 🎯",
      from: "LocalRank.ai <support@localrank.ai>",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Hi ${lead.contact_name || 'there'},</h2>
          <p>Your GMB audit for <strong>${lead.business_name}</strong> is complete! Health Score: <strong>${lead.health_score || 'N/A'}/100</strong></p>
          <p style="margin: 20px 0;"><strong>Now it's time to pick your path forward:</strong></p>
          <table style="width: 100%; margin: 20px 0;">
            <tr>
              <td style="padding: 15px; border: 2px solid #c8ff00; border-radius: 8px; text-align: center;">
                <strong style="color: #c8ff00;">🏛️ Gov Tech Grant</strong><br>
                <span style="font-size: 12px; color: #666;">$25K-$50K Grant Eligible</span><br><br>
                <a href="https://localrank.ai/BridgeGeenius?email=${encodeURIComponent(lead.email)}&pathway=1" style="background: #c8ff00; color: #0a0a0f; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Path →</a>
              </td>
              <td style="padding: 15px; border: 2px solid #9ca3af; border-radius: 8px; text-align: center;">
                <strong>💼 Done-For-You</strong><br>
                <span style="font-size: 12px; color: #666;">Full Optimization Service</span><br><br>
                <a href="https://localrank.ai/BridgeGeenius?email=${encodeURIComponent(lead.email)}&pathway=2" style="background: #374151; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Path →</a>
              </td>
              <td style="padding: 15px; border: 2px solid #9ca3af; border-radius: 8px; text-align: center;">
                <strong>🎓 DIY Program</strong><br>
                <span style="font-size: 12px; color: #666;">$97/month Self-Guided</span><br><br>
                <a href="https://localrank.ai/BridgeGeenius?email=${encodeURIComponent(lead.email)}&pathway=3" style="background: #374151; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Path →</a>
              </td>
            </tr>
          </table>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">⏰ Your results expire in 22 hours. Choose a path to get started!</p>
        </div>
      `
    })
  },

  // 12 hours after audit - still no selection
  pathway_selection_urgent_12h: {
    delay: 43200,
    template: (lead) => ({
      subject: "⏰ Only 12 Hours Left to Choose Your GMB Path",
      from: "LocalRank.ai <support@localrank.ai>",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ff6b6b;">Last Chance, ${lead.contact_name || 'there'}! ⏰</h2>
          <p>Your audit results for <strong>${lead.business_name}</strong> expire in <strong>12 hours</strong>.</p>
          <p style="margin: 20px 0;"><strong>Which path will you choose?</strong></p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>💰 #1: Gov Tech Grant Path</strong> - Get $25K-$50K funding (Only 5 spots left this week)</p>
            <a href="https://localrank.ai/BridgeGeenius?email=${encodeURIComponent(lead.email)}&pathway=1" style="color: #c8ff00; text-decoration: none; font-weight: bold;">Choose Gov Tech →</a>
          </div>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>🚀 #2: Done-For-You Path</strong> - We handle everything (90-day results guaranteed)</p>
            <a href="https://localrank.ai/BridgeGeenius?email=${encodeURIComponent(lead.email)}&pathway=2" style="color: #c8ff00; text-decoration: none; font-weight: bold;">Choose DFY →</a>
          </div>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>📚 #3: DIY Program</strong> - Learn to optimize yourself ($97/month, cancel anytime)</p>
            <a href="https://localrank.ai/BridgeGeenius?email=${encodeURIComponent(lead.email)}&pathway=3" style="color: #c8ff00; text-decoration: none; font-weight: bold;">Choose DIY →</a>
          </div>
          <p style="color: #ff6b6b; font-size: 12px; margin-top: 20px;"><strong>Results expire in 12 hours.</strong></p>
        </div>
      `
    })
  },

  // After pathway selection - DFY pathway
  dfy_pathway_selected: {
    delay: 0,
    template: (lead) => ({
      subject: "Let's Schedule Your Done-For-You Optimization",
      from: "LocalRank.ai <sales@localrank.ai>",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #c8ff00;">Perfect, ${lead.contact_name || 'there'}! 🎯</h2>
          <p>You've chosen our Done-For-You optimization for <strong>${lead.business_name}</strong>.</p>
          <p><strong>Here's what happens next:</strong></p>
          <ol>
            <li>📅 <strong>Schedule Strategy Call</strong> (15 min) - Your free consultation</li>
            <li>📊 <strong>Deep Dive Audit</strong> - We review everything</li>
            <li>🔧 <strong>Full Optimization</strong> - Complete GMB setup</li>
            <li>📈 <strong>Monthly Reviews</strong> - Track your results</li>
          </ol>
          <p style="margin: 20px 0;"><a href="https://localrank.ai/Checkout?email=${encodeURIComponent(lead.email)}&pathway=2" style="background: #c8ff00; color: #0a0a0f; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">Book Strategy Call (Free) →</a></p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">💡 <strong>Tip:</strong> Spots fill up fast. Book within the next 24 hours for priority scheduling.</p>
        </div>
      `
    })
  },

  // After pathway selection - Grant pathway
  grant_pathway_selected: {
    delay: 0,
    template: (lead) => ({
      subject: "Get Pre-Qualified for Your $25K-$50K Gov Tech Grant",
      from: "LocalRank.ai <grants@localrank.ai>",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #c8ff00;">Exciting News, ${lead.contact_name || 'there'}! 🏛️</h2>
          <p>You're eligible for <strong>$25K-$50K in Gov Tech Grant funding</strong> for <strong>${lead.business_name}</strong>!</p>
          <p><strong>Your grant pre-qualification includes:</strong></p>
          <ul>
            <li>✅ Grant eligibility assessment</li>
            <li>✅ Free grant writing consultation</li>
            <li>✅ Complete application support</li>
            <li>✅ Dedicated grant specialist</li>
          </ul>
          <p style="margin: 20px 0;"><a href="https://localrank.ai/Checkout?email=${encodeURIComponent(lead.email)}&pathway=1" style="background: #c8ff00; color: #0a0a0f; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">Start Grant Application →</a></p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">⏳ Application window closes ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}. Apply now!</p>
        </div>
      `
    })
  },

  // After pathway selection - DIY pathway
  diy_pathway_selected: {
    delay: 0,
    template: (lead) => ({
      subject: "Get Started with DIY GMB Optimization - $97/month",
      from: "LocalRank.ai <support@localrank.ai>",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #c8ff00;">Let's Do This, ${lead.contact_name || 'there'}! 💪</h2>
          <p>You're ready to optimize <strong>${lead.business_name}</strong> on your own terms.</p>
          <p><strong>Your DIY Program Includes:</strong></p>
          <ul>
            <li>✓ Step-by-step optimization guide</li>
            <li>✓ AI-powered content templates</li>
            <li>✓ Monthly strategy calls</li>
            <li>✓ Weekly video trainings</li>
            <li>✓ Only $97/month (cancel anytime)</li>
          </ul>
          <p style="margin: 20px 0;"><a href="https://localrank.ai/Checkout?email=${encodeURIComponent(lead.email)}&pathway=3" style="background: #c8ff00; color: #0a0a0f; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">Start DIY Program →</a></p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">🎁 <strong>First month special:</strong> Use code LOCALRANK25 for 25% off.</p>
        </div>
      `
    })
  },

  // Post-purchase sequence
  post_purchase_day1: {
    delay: 0,
    template: (lead) => ({
      subject: "Welcome to Your GMB Optimization Journey! 🚀",
      from: "LocalRank.ai <success@localrank.ai>",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #c8ff00;">Welcome to LocalRank.ai, ${lead.contact_name || 'there'}! 🎉</h2>
          <p>Your order is confirmed! We're excited to help <strong>${lead.business_name}</strong> dominate local search.</p>
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>📧 Check your email for access instructions</li>
            <li>🔑 Create your dashboard account</li>
            <li>📞 Schedule your first call with your specialist</li>
          </ol>
          <p style="margin: 20px 0;"><a href="https://localrank.ai/Dashboard" style="background: #c8ff00; color: #0a0a0f; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Access Your Dashboard →</a></p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">💬 Questions? Reply to this email or contact support@localrank.ai</p>
        </div>
      `
    })
  },

  // Follow-up after checkout abandon
  checkout_abandoned_1h: {
    delay: 3600,
    template: (lead) => ({
      subject: "Your Order is Still Pending - Complete in 60 Seconds",
      from: "LocalRank.ai <sales@localrank.ai>",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Hi ${lead.contact_name || 'there'},</h2>
          <p>You were about to complete your order for <strong>${lead.business_name}</strong>. We're here to help if you have questions!</p>
          <p style="margin: 20px 0;"><a href="https://localrank.ai/Checkout?email=${encodeURIComponent(lead.email)}" style="background: #c8ff00; color: #0a0a0f; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Complete Your Order →</a></p>
          <p><strong>Common questions:</strong></p>
          <ul>
            <li>✓ Flexible payment plans available</li>
            <li>✓ 30-day money-back guarantee</li>
            <li>✓ No contracts, cancel anytime (DIY)</li>
          </ul>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">💬 Reply to this email or call 1-800-LOCALRANK</p>
        </div>
      `
    })
  },

  // Follow-up after checkout abandon - 24h
  checkout_abandoned_24h: {
    delay: 86400,
    template: (lead) => ({
      subject: "Last Chance: Complete Your Order Before Results Expire",
      from: "LocalRank.ai <sales@localrank.ai>",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ff6b6b;">⏰ Last Chance!</h2>
          <p>Your audit results for <strong>${lead.business_name}</strong> expire in 24 hours.</p>
          <p>If you've decided not to move forward, that's totally fine. But if you're still interested:</p>
          <p style="margin: 20px 0;"><a href="https://localrank.ai/Checkout?email=${encodeURIComponent(lead.email)}" style="background: #c8ff00; color: #0a0a0f; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Complete Your Order Now →</a></p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">After 24 hours, you'll need to start a new audit. Don't wait!</p>
        </div>
      `
    })
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Allow service role or authenticated user
    let user;
    try {
      user = await base44.auth.me();
    } catch (e) {
      // If auth fails, we might be called from automation - continue with service role
      console.log('Auth failed, using service role');
    }

    const { lead_id, sequence_key } = await req.json();

    if (!lead_id || !sequence_key) {
      return new Response(
        JSON.stringify({ error: 'Missing lead_id or sequence_key' }),
        { status: 400 }
      );
    }

    // Use service role to fetch lead
    const lead = await base44.asServiceRole.entities.Lead.filter({ id: lead_id }).then(r => r[0]);
    if (!lead) {
      return new Response(JSON.stringify({ error: `Lead not found with id: ${lead_id}` }), { status: 404 });
    }

    const sequence = sequences[sequence_key];
    if (!sequence) {
      return new Response(JSON.stringify({ error: 'Invalid sequence key' }), { status: 400 });
    }

    const emailData = sequence.template(lead);

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: emailData.from,
        to: lead.email,
        subject: emailData.subject,
        html: emailData.html,
        tags: [
          { name: 'sequence', value: sequence_key },
          { name: 'funnel', value: 'geenius' },
          { name: 'business', value: lead.business_name }
        ]
      })
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const resendData = await emailResponse.json();

    // Log email using service role
    await base44.asServiceRole.entities.EmailLog.create({
      to: lead.email,
      from: emailData.from,
      subject: emailData.subject,
      type: 'nurture',
      status: 'sent',
      metadata: {
        lead_id,
        sequence_key,
        business_name: lead.business_name,
        resend_id: resendData.id,
        funnel: 'geenius'
      }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      resend_id: resendData.id,
      lead_email: lead.email,
      sequence_key 
    }), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});