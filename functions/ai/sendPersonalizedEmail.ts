import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Send AI-Generated Personalized Email
 * Generates and sends personalized email to a lead
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { 
      lead_id,
      email_type = 'welcome',
      template_id,
      custom_instructions,
      precomposed_subject,
      precomposed_body
    } = await req.json();

    if (!lead_id) {
      return Response.json({ error: 'Missing lead_id' }, { status: 400 });
    }

    // Fetch lead
    const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
    const lead = leads[0];
    
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    let emailContent;

    // Use precomposed content if provided (from AIEmailComposer)
    if (precomposed_subject && precomposed_body) {
      emailContent = {
        subject_line: precomposed_subject,
        body: precomposed_body
      };
    } else if (template_id) {
      const templates = await base44.asServiceRole.entities.EmailTemplate.filter({ id: template_id });
      const template = templates[0];
      
      if (!template) {
        return Response.json({ error: 'Template not found' }, { status: 404 });
      }

      // Personalize template
      emailContent = {
        subject_line: template.subject_line
          .replace('{business_name}', lead.business_name)
          .replace('{health_score}', lead.health_score),
        body: template.body_html
          .replace('{business_name}', lead.business_name)
          .replace('{health_score}', lead.health_score)
          .replace('{critical_issues}', lead.critical_issues?.slice(0, 3).join('<br>') || '')
      };
    } else {
      // Generate with AI
      const generationResponse = await base44.asServiceRole.functions.invoke('ai/generateEmail', {
        email_type,
        lead_id,
        custom_instructions
      });
      
      emailContent = generationResponse.email;
    }

    // Send email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'LocalRank.ai <hello@localrank.ai>',
        to: lead.email,
        subject: emailContent.subject_line,
        html: emailContent.body
      })
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(`Email send failed: ${emailResult.message}`);
    }

    // Log email
    await base44.asServiceRole.entities.EmailLog.create({
      to: lead.email,
      from: 'LocalRank.ai <hello@localrank.ai>',
      subject: emailContent.subject_line,
      type: email_type,
      status: 'sent',
      metadata: {
        lead_id,
        template_id,
        ai_generated: !template_id,
        resend_id: emailResult.id
      }
    });

    return Response.json({ 
      success: true,
      email_id: emailResult.id,
      subject: emailContent.subject_line
    });

  } catch (error) {
    console.error('Error sending personalized email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});