import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    // Handle both direct invocation and entity automation trigger
    let leadData;
    if (payload.leadData) {
      leadData = payload.leadData;
    } else if (payload.event && payload.data) {
      // Entity automation payload
      leadData = payload.data;
    } else {
      return Response.json({ error: 'Lead data required' }, { status: 400 });
    }

    if (!leadData) {
      return Response.json({ error: 'Lead data required' }, { status: 400 });
    }

    const adminEmail = 'jtgee101@gmail.com'; // Admin email

    const scoreColor = leadData.health_score >= 70 ? '#10b981' : 
                       leadData.health_score >= 50 ? '#f59e0b' : '#ef4444';

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; border-bottom: 2px solid #c8ff00; padding-bottom: 10px;">
          🔔 New Lead Alert
        </h2>
        
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #111;">Business: ${leadData.business_name || 'N/A'}</h3>
          
          <table style="width: 100%; margin: 10px 0;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 40%;">Email:</td>
              <td style="padding: 8px 0; font-weight: bold;">${leadData.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Category:</td>
              <td style="padding: 8px 0; font-weight: bold;">${leadData.business_category?.replace(/_/g, ' ') || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Pain Point:</td>
              <td style="padding: 8px 0; font-weight: bold;">${leadData.pain_point?.replace(/_/g, ' ') || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Timeline:</td>
              <td style="padding: 8px 0; font-weight: bold;">${leadData.timeline?.replace(/_/g, ' ') || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">GMB Health Score:</td>
              <td style="padding: 8px 0;">
                <span style="color: ${scoreColor}; font-size: 20px; font-weight: bold;">${leadData.health_score}/100</span>
              </td>
            </tr>
            ${leadData.gmb_rating ? `
            <tr>
              <td style="padding: 8px 0; color: #666;">Google Rating:</td>
              <td style="padding: 8px 0; font-weight: bold;">${leadData.gmb_rating} ⭐ (${leadData.gmb_reviews_count} reviews)</td>
            </tr>
            ` : ''}
            ${leadData.address ? `
            <tr>
              <td style="padding: 8px 0; color: #666;">Location:</td>
              <td style="padding: 8px 0;">${leadData.address}</td>
            </tr>
            ` : ''}
          </table>
          
          ${leadData.critical_issues?.length ? `
          <div style="margin-top: 20px;">
            <h4 style="color: #ef4444; margin-bottom: 10px;">🚨 Critical Issues:</h4>
            <ul style="color: #333; line-height: 1.6;">
              ${leadData.critical_issues.slice(0, 3).map(issue => `<li>${issue}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <a href="https://localrank.ai/Admin" 
               style="display: inline-block; background: #c8ff00; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View in Admin Dashboard
            </a>
          </div>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          This is an automated notification from LocalRank.ai
        </p>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: adminEmail,
      from_name: 'LocalRank.ai System',
      subject: `🆕 New Lead: ${leadData.business_name} (Score: ${leadData.health_score}/100)`,
      body: emailBody
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error notifying admin:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});