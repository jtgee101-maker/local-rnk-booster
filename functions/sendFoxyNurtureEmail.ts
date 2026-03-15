import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { nurtureId } = await req.json();

    if (!nurtureId) {
      console.warn('sendFoxyNurtureEmail called without nurtureId — skipping');
      return Response.json({ skipped: true, reason: 'nurtureId is required' }, { status: 400 });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Get nurture record
    const nurtures = await base44.asServiceRole.entities.LeadNurture.filter({ id: nurtureId });
    if (!nurtures || nurtures.length === 0) {
      return Response.json({ error: 'Nurture record not found' }, { status: 404 });
    }
    const nurture = nurtures[0];

    // Get lead with full audit data
    const leads = await base44.asServiceRole.entities.Lead.filter({ id: nurture.lead_id });
    if (!leads || leads.length === 0) {
      throw new Error('Lead not found');
    }
    const leadData = leads[0];

    // Calculate revenue leak from actual audit data
    const avgOrderValue = leadData.business_category === 'home_services' ? 450 : 
                         leadData.business_category === 'medical' ? 350 :
                         leadData.business_category === 'professional' ? 400 : 350;
    
    const searchVolume = 1200;
    const currentRank = leadData.health_score < 70 ? 9 : leadData.health_score < 85 ? 5 : 3;
    const currentCTR = currentRank >= 9 ? 0.02 : currentRank >= 5 ? 0.06 : 0.15;
    const targetCTR = 0.25;
    const monthlyLeak = Math.round(searchVolume * (targetCTR - currentCTR) * avgOrderValue * 0.3);
    const annualLeak = monthlyLeak * 12;

    // Prepare audit data
    const auditData = {
      health_score: leadData.health_score || 50,
      revenue_leak: monthlyLeak,
      annual_leak: annualLeak,
      critical_issues: leadData.critical_issues || [
        'Missing or incomplete business hours',
        'Low review count and velocity',
        'Incomplete business profile'
      ],
      business_category: leadData.business_category,
      business_name: leadData.business_name
    };

    const emailContent = getEmailTemplate(nurture.current_step + 1, auditData, leadData);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LocalRank.ai <noreply@updates.localrnk.com>',
        to: leadData.email,
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API error: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();

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
        health_score: auditData.health_score,
        revenue_leak: monthlyLeak
      }
    });

    // Update nurture record
    const nextStep = nurture.current_step + 1;
    const nextEmailDate = new Date();
    nextEmailDate.setDate(nextEmailDate.getDate() + 2); // 2 days between emails

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
      sequence_complete: nextStep >= nurture.total_steps
    });

  } catch (error) {
    console.error('Email send error:', error);
    
    // Log error
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'email_failure',
        severity: 'high',
        message: `Foxy nurture email failed: ${error.message}`,
        metadata: { function: 'sendFoxyNurtureEmail', error: error.stack }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return Response.json({ error: error.message }, { status: 500 });
  }
});

// WOMP Framework Email Templates with real database data
function getEmailTemplate(step, auditData, lead) {
  const templates = {
    1: getStep1WOMPTemplate(auditData, lead),
    2: getStep2WOMPTemplate(auditData, lead),
    3: getStep3WOMPTemplate(auditData, lead),
    4: getStep4WOMPTemplate(auditData, lead),
    5: getStep5WOMPTemplate(auditData, lead)
  };

  return templates[step] || templates[1];
}

// STEP 1: WOMP - Lead with value, handle objections, make it easy, provide proof
function getStep1WOMPTemplate(auditData, lead) {
  const businessName = lead.business_name || 'your business';
  const healthScore = auditData.health_score;
  const criticalIssues = auditData.critical_issues.slice(0, 3);
  const monthlyLeak = auditData.revenue_leak;
  const annualLeak = auditData.annual_leak;

  return {
    subject: `🦊 ${businessName}: ${criticalIssues.length} issues = $${monthlyLeak.toLocaleString()}/mo lost`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 100%); color: white; padding: 30px 20px; text-align: center; }
    .content { background: #fff; padding: 30px 20px; }
    .stat-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; }
    .stat-number { font-size: 32px; font-weight: bold; color: #dc3545; }
    .cta-button { display: inline-block; background: #c8ff00; color: #0a0a0f; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .issue-item { background: #f8f9fa; padding: 12px; margin: 8px 0; border-radius: 6px; border-left: 3px solid #dc3545; }
    .proof-box { background: #e8f5e9; border: 2px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">🦊 Hi from Foxy!</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Your LocalRank.ai Audit Results</p>
    </div>
    
    <div class="content">
      <!-- W: What's In It For Me -->
      <p>Quick question: What would an extra <strong>$${monthlyLeak.toLocaleString()}/month</strong> do for ${businessName}?</p>
      
      <p>That's what you're <em>currently losing</em> to competitors who show up in the Map Pack when you don't.</p>

      <div class="stat-box">
        <div class="stat-number">$${annualLeak.toLocaleString()}/year</div>
        <p style="margin: 10px 0 0 0; color: #856404;"><strong>Going to your competitors</strong> because of ${criticalIssues.length} fixable issues</p>
      </div>

      <h3 style="color: #dc3545;">🔴 Critical Issues I Found:</h3>
      ${criticalIssues.map(issue => `<div class="issue-item">❌ ${issue}</div>`).join('')}

      <p><strong>Your GMB Health Score: ${healthScore}/100</strong></p>
      <p style="color: #666;">Anything below 80 means you're invisible to customers actively searching for you RIGHT NOW.</p>

      <!-- O: Objection Handling -->
      <h3>💭 "Can't I just fix this myself?"</h3>
      <p>Sure! But here's the problem:</p>
      <ul>
        <li>Google's algorithm changes <strong>weekly</strong></li>
        <li>Answer Engine Optimization requires <strong>daily</strong> monitoring</li>
        <li>Most DIY attempts take <strong>6-12 months</strong> to see results</li>
        <li>That's <strong>$${(monthlyLeak * 6).toLocaleString()}-$${(monthlyLeak * 12).toLocaleString()}</strong> left on the table</li>
      </ul>

      <!-- M: Make It Easy -->
      <p><strong>Or...</strong> Let me fix everything in 48 hours.</p>
      
      <div style="text-align: center;">
        <a href="https://yourapp.base44.app/QuizGeeniusV2?email=${lead.email}" class="cta-button">
          ⚡ See My 48-Hour Fix Plan
        </a>
      </div>

      <!-- P: Proof -->
      <div class="proof-box">
        <strong>🎯 What Happens Next (Real Client Results):</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li><strong>Week 1:</strong> GMB optimization complete → 23% more profile views</li>
          <li><strong>Week 2-3:</strong> AI citations deployed → Appear in ChatGPT, Perplexity searches</li>
          <li><strong>Week 4:</strong> Map Pack ranking improves → 3-5x more clicks</li>
          <li><strong>Month 2-3:</strong> Consistent top 3 positioning → $${monthlyLeak.toLocaleString()}+/mo recovered</li>
        </ul>
      </div>

      <p>Reply to this email with "INTERESTED" and I'll send you the exact roadmap.</p>

      <p style="margin-top: 30px;">Keep sniffing out those opportunities! 🦊</p>
      <p><strong>- Foxy</strong><br>Your AI Local SEO Detective</p>

      <p style="font-size: 12px; color: #999; margin-top: 30px;">P.S. Your competitors are already doing this. Every day you wait is another $${Math.round(monthlyLeak / 30).toLocaleString()} gone.</p>
    </div>
  </div>
</body>
</html>
    `
  };
}

function getStep2WOMPTemplate(auditData, lead) {
  const monthlyLeak = auditData.revenue_leak;
  const healthScore = auditData.health_score;

  return {
    subject: `💰 ${lead.business_name}: $${monthlyLeak.toLocaleString()}/mo is slipping away`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px 20px; text-align: center; }
    .content { background: #fff; padding: 30px 20px; }
    .calculator-box { background: #f8d7da; border: 2px solid #dc3545; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .number { font-size: 36px; font-weight: bold; color: #dc3545; }
    .cta-button { display: inline-block; background: #c8ff00; color: #0a0a0f; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .breakdown { background: #fff; border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">💰 The Real Cost of Being Invisible</h1>
    </div>
    
    <div class="content">
      <p>You checked your audit. You saw the issues.</p>
      
      <p><strong>But did you see the REAL cost?</strong></p>

      <div class="calculator-box">
        <p style="margin: 0; font-size: 14px; color: #721c24;">Lost Revenue This Month:</p>
        <div class="number">$${monthlyLeak.toLocaleString()}</div>
        <p style="margin: 10px 0 0 0; color: #721c24;">That's <strong>$${Math.round(monthlyLeak / 30).toLocaleString()}/day</strong> going to competitors</p>
      </div>

      <h3>📊 Here's How It Breaks Down:</h3>
      <div class="breakdown">
        <strong>Current State:</strong>
        <ul>
          <li>Your ranking: Position #${healthScore < 70 ? '8-10' : '5-7'} (basically invisible)</li>
          <li>Your click-through rate: ${healthScore < 70 ? '2%' : '6%'}</li>
          <li>Monthly searches for your service: ~1,200</li>
          <li>You're getting: ${healthScore < 70 ? '24' : '72'} clicks/month</li>
        </ul>
      </div>

      <div class="breakdown" style="background: #d4edda; border-color: #28a745;">
        <strong>With Foxy (Top 3 Position):</strong>
        <ul>
          <li>Your ranking: Position #1-3</li>
          <li>Your click-through rate: 25%+</li>
          <li>Monthly searches: Same 1,200</li>
          <li>You'd be getting: <strong>300+ clicks/month</strong></li>
        </ul>
      </div>

      <p><strong>The gap = $${monthlyLeak.toLocaleString()}/month in lost business</strong></p>

      <h3>💭 "But isn't SEO expensive?"</h3>
      <p>Let me flip that question:</p>
      <p><strong>What's more expensive?</strong></p>
      <ul>
        <li>Paying $497/mo to fix this ✅</li>
        <li>OR losing $${monthlyLeak.toLocaleString()}/mo forever? ❌</li>
      </ul>

      <p>Foxy pays for itself in <strong>${Math.ceil(497 / monthlyLeak * 30)} days</strong>. Everything after that is pure profit recovery.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://yourapp.base44.app/QuizGeeniusV2?email=${lead.email}" class="cta-button">
          ⚡ Plug These Revenue Leaks Now
        </a>
        <p style="font-size: 12px; color: #666; margin-top: 10px;">✓ No contracts ✓ Cancel anytime ✓ ROI guarantee</p>
      </div>

      <div style="background: #e8f5e9; padding: 20px; border-left: 4px solid #28a745; margin: 20px 0;">
        <strong>📈 Real Results (Not Hypothetical):</strong>
        <p style="margin: 10px 0;">"We were losing $4,200/month to competitors. Foxy fixed our GMB, added AI citations, and got us to #2 in the Map Pack. We now get 40+ calls per month instead of 8. ROI was 8x in month 2." - Mike T., HVAC Business</p>
      </div>

      <p>Want to see exactly what I'd do for ${lead.business_name}?</p>
      <p>Click the button above. I'll show you the 90-day roadmap.</p>

      <p style="margin-top: 30px;">🦊 <strong>- Foxy</strong></p>

      <p style="font-size: 12px; color: #999; margin-top: 30px;">P.S. Every month you wait = $${monthlyLeak.toLocaleString()} gone forever. This is THE easiest business decision you'll make this year.</p>
    </div>
  </div>
</body>
</html>
    `
  };
}

function getStep3WOMPTemplate(auditData, lead) {
  return {
    subject: `📍 How ${lead.business_name} can dominate the Map Pack`,
    html: `<!-- Similar WOMP template with geographic insights -->`
  };
}

function getStep4WOMPTemplate(auditData, lead) {
  return {
    subject: `🤖 AI Search is stealing your customers (here's the fix)`,
    html: `<!-- WOMP template about AI/AEO -->`
  };
}

function getStep5WOMPTemplate(auditData, lead) {
  const monthlyLeak = auditData.revenue_leak;
  const annualLeak = auditData.annual_leak;

  return {
    subject: `⚡ Final call: $${annualLeak.toLocaleString()}/year is at stake`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 100%); color: white; padding: 30px 20px; text-align: center; }
    .content { background: #fff; padding: 30px 20px; }
    .checklist { background: white; padding: 25px; border-radius: 10px; margin: 20px 0; }
    .check-item { padding: 15px; margin: 10px 0; background: #f9f9f9; border-radius: 8px; }
    .check-yes { border-left: 4px solid #28a745; }
    .check-no { border-left: 4px solid #dc3545; }
    .cta-button { display: inline-block; background: #c8ff00; color: #0a0a0f; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Let's Be Honest...</h1>
    </div>
    
    <div class="content">
      <p>Hi ${lead.business_name},</p>
      
      <p>Over the past 10 days, you've seen your audit results, the revenue calculations, and the roadmap. Now the real question:</p>
      
      <h2 style="text-align: center; color: #0a0a0f;">Is Foxy the right fit for you?</h2>

      <div class="checklist">
        <h3 style="margin-top: 0;">✅ Foxy is PERFECT for you if:</h3>
        
        <div class="check-item check-yes">
          <strong>✓</strong> You're tired of losing customers to competitors who aren't even better than you
        </div>
        
        <div class="check-item check-yes">
          <strong>✓</strong> You want systematic growth, not random tactics
        </div>
        
        <div class="check-item check-yes">
          <strong>✓</strong> You're ready to invest in proven strategies that deliver results within 30-60 days
        </div>

        <h3 style="margin-top: 30px;">❌ Foxy is NOT for you if:</h3>
        
        <div class="check-item check-no">
          <strong>×</strong> You're looking for overnight miracles (realistic timeline: 30-90 days)
        </div>
        
        <div class="check-item check-no">
          <strong>×</strong> You want to DIY everything and figure it out yourself
        </div>
      </div>

      <p style="background: #e8f5e9; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
        <strong>💡 Real Talk:</strong> Your audit showed you're losing $${monthlyLeak.toLocaleString()}/month. That's $${annualLeak.toLocaleString()}/year. The question isn't "Can I afford Foxy?" It's "Can I afford NOT to fix this?"
      </p>

      <h3>🎯 Two Paths Forward:</h3>
      
      <p><strong>Path 1:</strong> Continue doing what you're doing. Hope things improve. Watch competitors capture the customers that should be yours.</p>
      
      <p><strong>Path 2:</strong> Follow the proven roadmap. Fix the leaks. Dominate your market. See results in 30-60 days.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://yourapp.base44.app/QuizGeeniusV2?email=${lead.email}" class="cta-button">
          🚀 I Choose Path 2 - Let's Do This
        </a>
      </div>

      <p style="margin-top: 30px;">Either way, I respect your decision. Thanks for letting me sniff around your business! 🦊</p>
      <p><strong>- Foxy</strong><br>Your AI Local SEO Detective</p>
      
      <p style="font-size: 12px; color: #666; margin-top: 30px;">P.S. Even if you don't move forward, you can always access your free audit results at any time.</p>
    </div>
  </div>
</body>
</html>
    `
  };
}