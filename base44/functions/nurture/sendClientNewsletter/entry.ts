import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

/**
 * Client Newsletter Sender
 * Sends Morning Brew / Hustle style newsletter to engaged clients
 * Called manually by admin when new newsletter is ready
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate admin
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { 
      subject, 
      headline, 
      featured_content, 
      updates, 
      business_intel, 
      special_offer,
      test_mode = false 
    } = await req.json();

    if (!subject || !headline) {
      return Response.json({ error: 'Missing required fields: subject, headline' }, { status: 400 });
    }

    // Get all newsletter subscribers (leads with newsletter_subscriber tag)
    const allLeads = await base44.asServiceRole.entities.Lead.list('-created_date', 5000);
    const subscribers = allLeads.filter(lead => 
      lead.tags && lead.tags.includes('newsletter_subscriber')
    );

    // In test mode, only send to admin email
    const recipients = test_mode ? [user.email] : subscribers.map(s => s.email);

    console.log(`Sending newsletter to ${recipients.length} recipients (test_mode: ${test_mode})`);

    // Newsletter template (Morning Brew inspired)
    const generateNewsletterHtml = (recipientEmail) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 680px; margin: 0 auto; background: #ffffff; padding: 0;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%); padding: 30px 40px; border-bottom: 4px solid #c8ff00;">
          <div style="text-align: center;">
            <h1 style="color: #c8ff00; font-size: 32px; margin: 0 0 5px 0; font-weight: 800;">GeeNius Insider</h1>
            <p style="color: #aaa; font-size: 14px; margin: 0;">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px;">
          
          <!-- Headline -->
          <div style="margin-bottom: 35px;">
            <h2 style="color: #0a0a0f; font-size: 28px; line-height: 1.3; margin: 0 0 15px 0; font-weight: 700;">${headline}</h2>
            ${featured_content ? `<p style="color: #333; line-height: 1.8; font-size: 16px; margin: 0;">${featured_content}</p>` : ''}
          </div>

          <!-- Divider -->
          <div style="height: 2px; background: linear-gradient(to right, #c8ff00, #a855f7); margin: 35px 0;"></div>

          ${updates ? `
          <!-- Platform Updates -->
          <div style="margin-bottom: 35px;">
            <h3 style="color: #0a0a0f; font-size: 22px; margin: 0 0 20px 0; font-weight: 700;">🚀 Platform Updates</h3>
            <div style="background: #f9fafb; border-left: 4px solid #c8ff00; padding: 20px; border-radius: 8px;">
              ${updates}
            </div>
          </div>
          ` : ''}

          ${business_intel ? `
          <!-- Business Intel -->
          <div style="margin-bottom: 35px;">
            <h3 style="color: #0a0a0f; font-size: 22px; margin: 0 0 20px 0; font-weight: 700;">💡 Business Intel</h3>
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px;">
              ${business_intel}
            </div>
          </div>
          ` : ''}

          ${special_offer ? `
          <!-- Special Offer -->
          <div style="margin-bottom: 35px;">
            <div style="background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); padding: 30px; border-radius: 12px; text-align: center;">
              <h3 style="color: #fff; font-size: 24px; margin: 0 0 15px 0; font-weight: 700;">🎁 Exclusive Client Offer</h3>
              <p style="color: #fff; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">${special_offer}</p>
              <a href="https://localrank.ai/Dashboard" style="display: inline-block; background: #fff; color: #a855f7; padding: 14px 30px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px;">
                CLAIM YOUR OFFER →
              </a>
            </div>
          </div>
          ` : ''}

          <!-- Quick Links -->
          <div style="background: #0a0a0f; padding: 25px; border-radius: 8px; margin-top: 40px;">
            <h4 style="color: #c8ff00; font-size: 16px; margin: 0 0 15px 0; font-weight: 700;">Quick Links</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
              <a href="https://localrank.ai/Dashboard" style="color: #fff; text-decoration: none; padding: 8px 16px; background: rgba(200, 255, 0, 0.1); border-radius: 6px; font-size: 13px;">Dashboard</a>
              <a href="https://localrank.ai/Reports" style="color: #fff; text-decoration: none; padding: 8px 16px; background: rgba(200, 255, 0, 0.1); border-radius: 6px; font-size: 13px;">Reports</a>
              <a href="mailto:support@localrank.ai" style="color: #fff; text-decoration: none; padding: 8px 16px; background: rgba(200, 255, 0, 0.1); border-radius: 6px; font-size: 13px;">Support</a>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0 0 10px 0; text-align: center;">
            You're receiving this because you're a valued GeeNius Pathway client.<br>
            Questions? Reply to this email or contact us at <a href="mailto:support@localrank.ai" style="color: #a855f7; text-decoration: none;">support@localrank.ai</a>
          </p>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 15px 0 0 0;">
            <a href="https://localrank.ai/Dashboard?settings=true" style="color: #9ca3af; text-decoration: underline;">Update preferences</a> • 
            <a href="mailto:support@localrank.ai?subject=Unsubscribe" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
          </p>
        </div>

      </div>
    `;

    // Send emails in batches (Resend allows batch sending)
    const batchSize = 50;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      try {
        const emailResponse = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(
          batch.map(email => ({
            from: 'GeeNius Insider <onboarding@resend.dev>',
            to: email,
              subject: subject,
              html: generateNewsletterHtml(email),
              tags: [
                { name: 'type', value: 'client_newsletter' },
                { name: 'campaign', value: new Date().toISOString().split('T')[0].replace(/-/g, '') }
              ]
            }))
          )
        });

        if (emailResponse.ok) {
          sent += batch.length;
          
          // Log each email
          const resendData = await emailResponse.json();
          for (let j = 0; j < batch.length; j++) {
            await base44.asServiceRole.entities.EmailLog.create({
              to: batch[j],
              from: 'GeeNius Insider <onboarding@resend.dev>',
              subject: subject,
              type: 'other',
              status: 'sent',
              metadata: {
                email_category: 'client_newsletter',
                campaign_date: new Date().toISOString(),
                resend_id: resendData.data?.[j]?.id,
                test_mode
              }
            });
          }
        } else {
          failed += batch.length;
          console.error(`Batch ${i} failed:`, await emailResponse.text());
        }
      } catch (error) {
        failed += batch.length;
        console.error(`Error sending batch ${i}:`, error);
      }
    }

    return Response.json({ 
      success: true, 
      sent,
      failed,
      total_recipients: recipients.length,
      test_mode
    });

  } catch (error) {
    console.error('Error in sendClientNewsletter:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});