import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { auditDownloadTemplate } from './utils/emailTemplates.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const { email, businessName, auditScore } = payload;

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    const emailBody = auditDownloadTemplate(businessName, auditScore);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      from_name: 'LocalRank.ai',
      subject: `✅ Your GMB Audit Report has been downloaded - Next Steps Included`,
      body: emailBody
    });

    return Response.json({ success: true, email });
  } catch (error) {
    console.error('Error sending audit download confirmation:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});