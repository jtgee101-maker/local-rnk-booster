import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { leadId, step, auditData } = await req.json();

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const lead = await base44.asServiceRole.entities.Lead.get(leadId);
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const emailTemplates = getEmailTemplate(step, auditData, lead);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Foxy from LocalRank.ai <foxy@localrank.ai>',
        to: lead.email,
        subject: emailTemplates.subject,
        html: emailTemplates.html,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.statusText}`);
    }

    const result = await response.json();

    // Log email
    await base44.asServiceRole.entities.EmailLog.create({
      to: lead.email,
      from: 'Foxy from LocalRank.ai',
      subject: emailTemplates.subject,
      type: 'nurture',
      status: 'sent',
      metadata: { lead_id: leadId, nurture_step: step, email_id: result.id }
    });

    return Response.json({ success: true, email_id: result.id });

  } catch (error) {
    console.error('Email send error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getEmailTemplate(step, auditData, lead) {
  const templates = {
    1: getStep1Template(auditData, lead),
    2: getStep2Template(auditData, lead),
    3: getStep3Template(auditData, lead),
    4: getStep4Template(auditData, lead),
    5: getStep5Template(auditData, lead)
  };

  return templates[step] || templates[1];
}

function getStep1Template(auditData, lead) {
  const industryTips = {
    'home_services': 'home service businesses like yours',
    'medical': 'healthcare practices',
    'professional': 'professional services',
    'retail': 'retail businesses',
    'other': 'local businesses'
  };

  const industry = industryTips[lead.business_category] || 'local businesses';

  return {
    subject: `${lead.business_name} - Your Foxy Audit Results & Next Steps`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .logo { color: #c8ff00; font-size: 24px; font-weight: bold; }
    .content { background: #f9f9f9; padding: 30px; }
    .highlight-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .stat-box { background: white; border: 2px solid #c8ff00; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
    .stat-number { font-size: 36px; font-weight: bold; color: #dc3545; }
    .stat-label { color: #666; margin-top: 5px; }
    .cta-button { display: inline-block; background: #c8ff00; color: #0a0a0f; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .issue-list { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; }
    .issue-item { padding: 10px 0; border-bottom: 1px solid #eee; }
    .footer { background: #0a0a0f; color: #999; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🦊 LocalRank.ai</div>
      <h1 style="margin: 10px 0;">Your Foxy Audit is Complete!</h1>
      <p style="margin: 5px 0; opacity: 0.9;">Hi ${lead.business_name},</p>
    </div>
    
    <div class="content">
      <p>Thanks for trusting Foxy to analyze your local visibility! After reviewing your Google Business Profile, I've uncovered some critical insights specific to ${industry}.</p>
      
      <div class="stat-box">
        <div class="stat-number">$${auditData.revenue_leak.toLocaleString()}</div>
        <div class="stat-label">Estimated Monthly Revenue Leak</div>
        <p style="color: #666; margin-top: 10px;">That's <strong>$${auditData.annual_leak.toLocaleString()}/year</strong> going to competitors</p>
      </div>

      <h2>🎯 Your Top 3 Critical Issues:</h2>
      <div class="issue-list">
        ${(auditData.critical_issues || ['Missing business hours', 'Low review count', 'Incomplete profile']).slice(0, 3).map(issue => 
          `<div class="issue-item">❌ ${issue}</div>`
        ).join('')}
      </div>

      <div class="highlight-box">
        <strong>💡 Industry-Specific Insight:</strong> 
        <p>For ${industry}, we've found that fixing these 3 issues alone can increase Map Pack visibility by 40-60% within 30 days.</p>
      </div>

      <h2>📊 Your GMB Health Score: ${auditData.health_score}/100</h2>
      <p>${getHealthScoreMessage(auditData.health_score)}</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://yourapp.base44.app/QuizGeeniusV2?email=${lead.email}" class="cta-button">
          📈 Get Your Full Action Plan
        </a>
      </div>

      <h3>🔥 Tomorrow's Email Preview:</h3>
      <p>I'll share a case study of a ${industry.split(' ')[0]} business that went from a ${auditData.health_score} health score to 94 in just 45 days. You'll see their exact strategy.</p>

      <p style="margin-top: 30px;">Keep sniffing out those opportunities! 🦊</p>
      <p><strong>- Foxy</strong><br>Your AI Local SEO Detective</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} LocalRank.ai - Helping local businesses dominate their markets</p>
      <p>You received this because you completed a free Foxy audit.</p>
    </div>
  </div>
</body>
</html>
    `
  };
}

function getStep2Template(auditData, lead) {
  return {
    subject: `${lead.business_name} - Real Case Study: $94K in 90 Days`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; }
    .case-study-box { background: white; border: 2px solid #28a745; border-radius: 10px; padding: 20px; margin: 20px 0; }
    .before-after { display: table; width: 100%; margin: 20px 0; }
    .before, .after { display: table-cell; width: 50%; padding: 15px; text-align: center; }
    .before { background: #ffebee; border-radius: 8px 0 0 8px; }
    .after { background: #e8f5e9; border-radius: 0 8px 8px 0; }
    .metric { font-size: 28px; font-weight: bold; margin: 10px 0; }
    .cta-button { display: inline-block; background: #c8ff00; color: #0a0a0f; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #0a0a0f; color: #999; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="color: #c8ff00; font-size: 24px; font-weight: bold;">🦊 LocalRank.ai</div>
      <h1 style="margin: 10px 0;">How Mike's Business Added $94K in 90 Days</h1>
    </div>
    
    <div class="content">
      <p>Hey ${lead.business_name},</p>
      
      <p>Remember your audit showing a ${auditData.health_score} health score? Meet Mike - he was in the exact same position 90 days ago.</p>

      <div class="case-study-box">
        <h2 style="color: #28a745; margin-top: 0;">📊 Mike's Transformation</h2>
        <p><strong>Business:</strong> Home Services (similar to yours)</p>
        <p><strong>Starting Health Score:</strong> ${Math.max(40, auditData.health_score - 10)}</p>
        
        <div class="before-after">
          <div class="before">
            <h3 style="color: #c62828; margin-top: 0;">❌ Before</h3>
            <div class="metric" style="color: #c62828;">12</div>
            <div>Monthly Calls</div>
          </div>
          <div class="after">
            <h3 style="color: #2e7d32; margin-top: 0;">✅ After</h3>
            <div class="metric" style="color: #2e7d32;">87</div>
            <div>Monthly Calls</div>
          </div>
        </div>

        <p style="text-align: center; font-size: 18px; color: #2e7d32; font-weight: bold;">
          725% increase in qualified leads = $94,300 in new revenue
        </p>
      </div>

      <h3>🎯 What Mike Did (Week by Week):</h3>
      <ul style="background: white; padding: 25px 25px 25px 45px; border-radius: 8px;">
        <li><strong>Week 1-2:</strong> Fixed critical GMB issues (same ones you have)</li>
        <li><strong>Week 3-4:</strong> Optimized for geographic coverage</li>
        <li><strong>Week 5-8:</strong> Implemented Foxy's AI content strategy</li>
        <li><strong>Week 9-12:</strong> Dominated local Map Pack rankings</li>
      </ul>

      <p style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <strong>💡 The key difference?</strong> Mike didn't try to figure it all out alone. He followed a proven roadmap tailored to his exact issues (just like yours).
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://yourapp.base44.app/QuizGeeniusV2?email=${lead.email}" class="cta-button">
          🚀 Get Your Personalized Roadmap
        </a>
      </div>

      <p><strong>Tomorrow:</strong> I'll show you the #1 mistake that keeps businesses stuck at a ${auditData.health_score} score (and the 5-minute fix).</p>

      <p style="margin-top: 30px;">Keep hunting! 🦊</p>
      <p><strong>- Foxy</strong></p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} LocalRank.ai</p>
    </div>
  </div>
</body>
</html>
    `
  };
}

function getStep3Template(auditData, lead) {
  return {
    subject: `${lead.business_name} - The #1 Mistake Keeping You Invisible`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; }
    .warning-box { background: #fff3cd; border: 3px solid #dc3545; border-radius: 10px; padding: 20px; margin: 20px 0; }
    .tip-box { background: white; border-left: 4px solid #28a745; padding: 20px; margin: 15px 0; border-radius: 4px; }
    .cta-button { display: inline-block; background: #c8ff00; color: #0a0a0f; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #0a0a0f; color: #999; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="color: #c8ff00; font-size: 24px; font-weight: bold;">🦊 LocalRank.ai</div>
      <h1 style="margin: 10px 0;">Your Competitors Know This Secret...</h1>
    </div>
    
    <div class="content">
      <p>Hi ${lead.business_name},</p>
      
      <p>After analyzing 10,000+ GMB profiles, I've spotted a pattern. Businesses stuck around a ${auditData.health_score} score all make the SAME mistake.</p>

      <div class="warning-box">
        <h2 style="color: #dc3545; margin-top: 0;">⚠️ The Silent Killer</h2>
        <p style="font-size: 18px;"><strong>They focus on random tactics instead of systematic optimization.</strong></p>
        <p>Sound familiar? You post here and there, update your hours occasionally, maybe ask for a review... but there's no strategic sequence.</p>
      </div>

      <h3>🎯 Here's What Top Performers Do Differently:</h3>
      
      <div class="tip-box">
        <h4 style="margin-top: 0;">1. Geographic Dominance First</h4>
        <p>They don't try to rank everywhere. They dominate specific neighborhoods systematically. Your audit showed ${(auditData.critical_issues || []).length} weak zones - that's your starting point.</p>
      </div>

      <div class="tip-box">
        <h4 style="margin-top: 0;">2. Content That Matches Search Intent</h4>
        <p>They don't post random updates. Every piece of content is designed to capture searches in underserved areas.</p>
      </div>

      <div class="tip-box">
        <h4 style="margin-top: 0;">3. Review Velocity Over Review Count</h4>
        <p>It's not about having 100+ reviews. It's about getting consistent, fresh reviews from specific service areas.</p>
      </div>

      <p style="background: #e8f5e9; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
        <strong>💡 Quick Win:</strong> Based on your audit, if you optimize just ONE underserved neighborhood this week, you could capture an extra $${Math.round(auditData.revenue_leak * 0.15).toLocaleString()}/month.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://yourapp.base44.app/QuizGeeniusV2?email=${lead.email}" class="cta-button">
          🗺️ See Your Geographic Strategy
        </a>
      </div>

      <p><strong>Next email:</strong> I'll reveal the exact 90-day domination roadmap used by businesses in your category.</p>

      <p style="margin-top: 30px;">Stay sharp! 🦊</p>
      <p><strong>- Foxy</strong></p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} LocalRank.ai</p>
    </div>
  </div>
</body>
</html>
    `
  };
}

function getStep4Template(auditData, lead) {
  const projectedROI = Math.round(auditData.annual_leak * 2.5);
  
  return {
    subject: `${lead.business_name} - Your 90-Day Domination Blueprint`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; }
    .timeline { background: white; padding: 25px; border-radius: 10px; margin: 20px 0; }
    .phase { margin: 20px 0; padding: 20px; border-left: 4px solid #c8ff00; background: #f9f9f9; border-radius: 4px; }
    .roi-box { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 25px; border-radius: 10px; text-align: center; margin: 20px 0; }
    .cta-button { display: inline-block; background: #c8ff00; color: #0a0a0f; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #0a0a0f; color: #999; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="color: #c8ff00; font-size: 24px; font-weight: bold;">🦊 LocalRank.ai</div>
      <h1 style="margin: 10px 0;">Your Custom 90-Day Roadmap</h1>
    </div>
    
    <div class="content">
      <p>Hi ${lead.business_name},</p>
      
      <p>Based on your audit results and business goals, here's your personalized path to local market dominance:</p>

      <div class="roi-box">
        <h2 style="margin-top: 0;">💰 Projected 12-Month ROI</h2>
        <div style="font-size: 42px; font-weight: bold; margin: 15px 0;">$${projectedROI.toLocaleString()}</div>
        <p style="margin: 0; opacity: 0.9;">Conservative estimate based on similar businesses</p>
      </div>

      <div class="timeline">
        <h2 style="color: #0a0a0f; margin-top: 0;">📅 Your 90-Day Blueprint</h2>
        
        <div class="phase">
          <h3 style="color: #c8ff00; margin-top: 0;">🎯 Days 1-30: Foundation</h3>
          <ul>
            <li>Fix all ${(auditData.critical_issues || []).length} critical GMB issues</li>
            <li>Optimize for your top 5 underserved neighborhoods</li>
            <li>Set up review generation system</li>
            <li><strong>Expected Result:</strong> 25-40% visibility increase</li>
          </ul>
        </div>

        <div class="phase">
          <h3 style="color: #c8ff00; margin-top: 0;">🚀 Days 31-60: Expansion</h3>
          <ul>
            <li>Deploy AI-powered local content strategy</li>
            <li>Capture 10 additional service areas</li>
            <li>Implement competitive monitoring</li>
            <li><strong>Expected Result:</strong> Enter Map Pack in 8-12 neighborhoods</li>
          </ul>
        </div>

        <div class="phase">
          <h3 style="color: #c8ff00; margin-top: 0;">👑 Days 61-90: Domination</h3>
          <ul>
            <li>Achieve #1-3 rankings in core service areas</li>
            <li>Scale content production with automation</li>
            <li>Lock in competitive advantages</li>
            <li><strong>Expected Result:</strong> 3-5x increase in qualified leads</li>
          </ul>
        </div>
      </div>

      <p style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <strong>🔥 Limited Time:</strong> We're currently onboarding businesses at a special founding rate. This expires in 48 hours and won't be available again.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://yourapp.base44.app/QuizGeeniusV2?email=${lead.email}" class="cta-button">
          📋 Get Your Full Implementation Plan
        </a>
      </div>

      <p><strong>Final email tomorrow:</strong> The ultimate decision guide - Is Foxy right for your business?</p>

      <p style="margin-top: 30px;">Almost there! 🦊</p>
      <p><strong>- Foxy</strong></p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} LocalRank.ai</p>
    </div>
  </div>
</body>
</html>
    `
  };
}

function getStep5Template(auditData, lead) {
  return {
    subject: `${lead.business_name} - Final Question: Is Foxy Right For You?`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; }
    .checklist { background: white; padding: 25px; border-radius: 10px; margin: 20px 0; }
    .check-item { padding: 15px; margin: 10px 0; background: #f9f9f9; border-radius: 8px; }
    .check-yes { border-left: 4px solid #28a745; }
    .check-no { border-left: 4px solid #dc3545; }
    .cta-button { display: inline-block; background: #c8ff00; color: #0a0a0f; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #0a0a0f; color: #999; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="color: #c8ff00; font-size: 24px; font-weight: bold;">🦊 LocalRank.ai</div>
      <h1 style="margin: 10px 0;">Let's Be Honest...</h1>
    </div>
    
    <div class="content">
      <p>Hi ${lead.business_name},</p>
      
      <p>Over the past 5 days, you've seen your audit results, case studies, and the roadmap. Now the real question:</p>
      
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
        
        <div class="check-item check-yes">
          <strong>✓</strong> You understand that dominating local search gives you a sustainable competitive advantage
        </div>

        <h3 style="margin-top: 30px;">❌ Foxy is NOT for you if:</h3>
        
        <div class="check-item check-no">
          <strong>×</strong> You're looking for overnight miracles (realistic timeline: 30-90 days)
        </div>
        
        <div class="check-item check-no">
          <strong>×</strong> You want to DIY everything and figure it out yourself
        </div>
        
        <div class="check-item check-no">
          <strong>×</strong> You're not willing to implement proven strategies
        </div>
      </div>

      <p style="background: #e8f5e9; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
        <strong>💡 Real Talk:</strong> Your audit showed you're losing $${auditData.revenue_leak.toLocaleString()}/month. That's $${auditData.annual_leak.toLocaleString()}/year. The question isn't "Can I afford Foxy?" It's "Can I afford NOT to fix this?"
      </p>

      <h3>🎯 Two Paths Forward:</h3>
      
      <p><strong>Path 1:</strong> Continue doing what you're doing. Hope things improve. Watch competitors capture the customers that should be yours.</p>
      
      <p><strong>Path 2:</strong> Follow the proven roadmap. Fix the leaks. Dominate your market. See results in 30-60 days.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://yourapp.base44.app/QuizGeeniusV2?email=${lead.email}" class="cta-button">
          🚀 I Choose Path 2 - Let's Do This
        </a>
      </div>

      <p style="text-align: center; margin: 20px 0;">
        <a href="https://yourapp.base44.app/unsubscribe?email=${lead.email}" style="color: #999; font-size: 12px; text-decoration: underline;">
          Or unsubscribe if this isn't for you
        </a>
      </p>

      <p style="margin-top: 30px;">Either way, I respect your decision. Thanks for letting me sniff around your business! 🦊</p>
      <p><strong>- Foxy</strong><br>Your AI Local SEO Detective</p>
      
      <p style="font-size: 12px; color: #666; margin-top: 30px;">P.S. Even if you don't move forward, you can always access your free audit results at any time.</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} LocalRank.ai</p>
      <p>This is the final email in the Foxy Audit Follow-up sequence.</p>
    </div>
  </div>
</body>
</html>
    `
  };
}

function getHealthScoreMessage(score) {
  if (score >= 80) return "You're doing well, but there's still room to capture more market share.";
  if (score >= 60) return "You're visible in some areas, but competitors are winning in others.";
  if (score >= 40) return "You're losing significant revenue to competitors. Quick wins are available.";
  return "Critical issues are costing you thousands per month. Immediate action needed.";
}