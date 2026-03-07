import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * AI-Powered Email Content Generator
 * Creates personalized emails for leads and clients
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { 
      email_type,
      lead_id,
      tone = 'professional',
      goal,
      custom_instructions
    } = await req.json();

    if (!email_type) {
      return Response.json({ error: 'Missing email_type' }, { status: 400 });
    }

    let leadData = null;
    if (lead_id) {
      const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
      leadData = leads[0];
    }

    // Build context for AI
    const context = {
      business_name: leadData?.business_name || '[Business Name]',
      health_score: leadData?.health_score || 0,
      critical_issues: leadData?.critical_issues || [],
      business_category: leadData?.business_category || 'business',
      pain_point: leadData?.pain_point || 'visibility',
      goals: leadData?.goals || []
    };

    // Email type prompts
    const prompts = {
      welcome: `Create a warm welcome email for ${context.business_name}, a new lead who just completed our GMB audit quiz. 
Their health score is ${context.health_score}/100. 
Main pain point: ${context.pain_point}.
Key issues: ${context.critical_issues.slice(0, 3).join(', ')}.

The email should:
- Welcome them and acknowledge their audit results
- Highlight 2-3 key findings from their audit
- Explain what happens next in our process
- Include a clear call-to-action to schedule a consultation
- Be ${tone} in tone
${custom_instructions ? `\nAdditional instructions: ${custom_instructions}` : ''}`,

      follow_up: `Create a follow-up email for ${context.business_name} who hasn't responded to our initial outreach.
Their GMB health score is ${context.health_score}/100.
Business type: ${context.business_category}.

The email should:
- Reference their previous audit/interaction
- Provide additional value (new insight or tip)
- Create urgency without being pushy
- Include social proof or case study reference
- Clear next step/CTA
- Be ${tone} in tone
${custom_instructions ? `\nAdditional instructions: ${custom_instructions}` : ''}`,

      nurture: `Create a nurture email for ${context.business_name} to keep them engaged.
Focus on education and value-add content.
Business type: ${context.business_category}.

The email should:
- Provide actionable GMB optimization tip
- Share relevant industry insight
- Soft sell our services without being aggressive
- Build trust and authority
- Be ${tone} in tone
${custom_instructions ? `\nAdditional instructions: ${custom_instructions}` : ''}`,

      campaign: `Create a marketing email for ${goal || 'promoting our GMB services'}.
Target audience: ${context.business_category} businesses.

The email should:
- Have a compelling headline
- Clear value proposition
- Include benefits and results
- Social proof if relevant
- Strong call-to-action
- Be ${tone} in tone
${custom_instructions ? `\nAdditional instructions: ${custom_instructions}` : ''}`,

      custom: custom_instructions || 'Create a professional email for a GMB optimization business.'
    };

    const prompt = prompts[email_type] || prompts.custom;

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${prompt}

Generate a complete email with:
1. subject_line: Compelling subject line (50 chars max)
2. preview_text: Email preview text (100 chars max)
3. body: HTML email body with proper formatting
4. personalization_tips: Array of 3-5 tips for personalizing this email further

Format the body with proper HTML structure including paragraphs, headings, and CTAs.`,
      response_json_schema: {
        type: "object",
        properties: {
          subject_line: { type: "string" },
          preview_text: { type: "string" },
          body: { type: "string" },
          personalization_tips: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    return Response.json({ 
      success: true,
      email: aiResponse,
      context_used: context
    });

  } catch (error) {
    console.error('Error generating email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});