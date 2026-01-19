/**
 * Shared email templates and utilities
 * Centralizes all email HTML generation for consistency and maintainability
 */

export const getEmailStyles = () => ({
  container: 'font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;',
  wrapper: 'background: #1a1a2e; border: 1px solid #333; border-radius: 12px; padding: 30px;',
  header: 'text-align: center; margin-bottom: 30px;',
  title: 'color: #c8ff00; font-size: 32px; margin: 0;',
  secondaryTitle: 'color: #fff; text-align: center; margin-top: 0;',
  highlight: 'background: rgba(200, 255, 0, 0.1); border: 1px solid rgba(200, 255, 0, 0.3); border-radius: 8px; padding: 20px; margin: 30px 0;',
  ctaButton: 'display: inline-block; background: #c8ff00; color: #000; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;',
  infoBox: 'background: rgba(200, 255, 0, 0.05); border-left: 4px solid #c8ff00; border-radius: 4px; padding: 15px; margin: 20px 0;',
  footer: 'border-top: 1px solid #333; margin-top: 30px; padding-top: 20px;'
});

export const getAdminEmailStyles = () => ({
  container: 'font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;',
  wrapper: 'background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;',
  highlight: 'background: rgba(200, 255, 0, 0.1); border-left: 4px solid #c8ff00; padding: 15px; margin-bottom: 20px;',
  ctaButton: 'display: inline-block; background: #c8ff00; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;'
});

export const quizSubmissionTemplate = (leadData) => {
  const styles = getEmailStyles();
  
  return `
    <div style="${styles.container}">
      <div style="${styles.header}">
        <h1 style="${styles.title}">LocalRank.ai</h1>
      </div>
      
      <div style="${styles.wrapper}">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; background: rgba(200, 255, 0, 0.2); border-radius: 50%; padding: 20px;">
            <span style="font-size: 48px;">🎯</span>
          </div>
        </div>
        
        <h2 style="${styles.secondaryTitle}">Quiz Complete!</h2>
        
        <p style="color: #ccc; line-height: 1.6; text-align: center;">
          Thanks for completing the LocalRank lead independence audit, ${leadData.business_name || 'valued business owner'}!
        </p>
        
        <div style="${styles.highlight}">
          <p style="margin: 0 0 15px 0; color: #999; font-size: 12px;">YOUR RESULTS</p>
          <div style="text-align: center;">
            <div style="font-size: 48px; color: #c8ff00; font-weight: bold; margin: 10px 0;">${leadData.health_score}</div>
            <p style="margin: 5px 0; color: #ccc;">GMB Health Score</p>
            ${leadData.thumbtack_tax ? `
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(200,255,0,0.2);">
                <p style="margin: 5px 0; color: #999; font-size: 12px;">ANNUAL COST OF LEAD RENTING</p>
                <div style="font-size: 32px; color: #ef4444; font-weight: bold;">$${leadData.thumbtack_tax.toLocaleString()}</div>
              </div>
            ` : ''}
          </div>
        </div>
        
        ${leadData.critical_issues && leadData.critical_issues.length > 0 ? `
          <h3 style="color: #fff; margin-top: 30px;">Critical Issues Identified:</h3>
          <ul style="color: #ccc; line-height: 1.8; margin: 15px 0; padding-left: 20px;">
            ${leadData.critical_issues.slice(0, 3).map(issue => 
              `<li style="margin: 8px 0;">${issue}</li>`
            ).join('')}
          </ul>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://localrnk.com/CheckoutV2" style="${styles.ctaButton}">
            View Full Results & Options
          </a>
        </div>
        
        <div style="${styles.infoBox}">
          <p style="margin: 0; color: #ccc; font-size: 14px; line-height: 1.6;">
            <strong>💡 Next Step:</strong> Review your customized audit results and let us help you escape the lead-renting cycle.
          </p>
        </div>
        
        <div style="${styles.footer}">
          <p style="color: #999; font-size: 14px; text-align: center; line-height: 1.6;">
            Questions? Reply to this email or contact us at support@localrnk.com
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>© 2026 LocalRank.ai • Privacy Policy</p>
      </div>
    </div>
  `;
};

export const auditDownloadTemplate = (businessName) => {
  const styles = getEmailStyles();
  
  return `
    <div style="${styles.container}">
      <div style="${styles.header}">
        <h1 style="${styles.title}">LocalRank.ai</h1>
      </div>
      
      <div style="${styles.wrapper}">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; background: rgba(200, 255, 0, 0.2); border-radius: 50%; padding: 20px;">
            <span style="font-size: 48px;">📄</span>
          </div>
        </div>
        
        <h2 style="${styles.secondaryTitle}">Your Audit Report is Ready</h2>
        
        <p style="color: #ccc; line-height: 1.6; text-align: center;">
          ${businessName ? `Thanks ${businessName}!` : 'Thank you!'} Your detailed GMB audit report has been generated and is ready for download.
        </p>
        
        <div style="${styles.highlight}">
          <p style="margin: 0 0 15px 0; color: #999; font-size: 12px;">COMPLETE ANALYSIS INCLUDED</p>
          <ul style="color: #ccc; line-height: 2; text-align: left; display: inline-block; margin: 0; padding: 0;">
            <li>✅ GMB Health Score</li>
            <li>✅ Profile Statistics</li>
            <li>✅ Critical Issues Found</li>
            <li>✅ Optimization Roadmap</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://localrnk.com/ThankYou" style="${styles.ctaButton}">
            Download Your Report
          </a>
        </div>
        
        <div style="${styles.infoBox}">
          <p style="margin: 0; color: #ccc; font-size: 14px; line-height: 1.6;">
            <strong>🚀 What's Next?</strong> Review your report and book a free consultation with our team to discuss your personalized optimization plan.
          </p>
        </div>
        
        <div style="${styles.footer}">
          <p style="color: #999; font-size: 14px; text-align: center; line-height: 1.6;">
            Questions about your report? Reply to this email or contact support@localrnk.com
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>© 2026 LocalRank.ai • Privacy Policy</p>
      </div>
    </div>
  `;
};

export const upsellTemplate = (businessName, selectedPlan, amount) => {
  const styles = getEmailStyles();
  
  return `
    <div style="${styles.container}">
      <div style="${styles.header}">
        <h1 style="${styles.title}">LocalRank.ai</h1>
      </div>
      
      <div style="${styles.wrapper}">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; background: rgba(200, 255, 0, 0.2); border-radius: 50%; padding: 20px;">
            <span style="font-size: 48px;">🚀</span>
          </div>
        </div>
        
        <h2 style="${styles.secondaryTitle}">Upgrade Confirmed!</h2>
        
        <p style="color: #ccc; line-height: 1.6; text-align: center;">
          You've upgraded to ${selectedPlan || 'an enhanced plan'}. Let's accelerate your local dominance.
        </p>
        
        <div style="${styles.highlight}">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px 0; color: #999;">Service Plan:</td>
              <td style="padding: 8px 0; color: #fff; text-align: right; font-weight: bold;">${selectedPlan || 'Premium'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #999;">Monthly Investment:</td>
              <td style="padding: 8px 0; color: #c8ff00; text-align: right; font-size: 20px; font-weight: bold;">$${amount || '0'}</td>
            </tr>
          </table>
        </div>
        
        <h3 style="color: #fff; margin-top: 30px;">Your Next Steps</h3>
        <div style="color: #ccc; line-height: 1.8;">
          <p>✅ Your dedicated account manager will contact you within 24 hours</p>
          <p>✅ We'll schedule your strategy kickoff call</p>
          <p>✅ Implementation begins immediately on your custom plan</p>
          <p>✅ Monthly progress reports tracking your growth</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://localrnk.com/Dashboard" style="${styles.ctaButton}">
            Access Your Dashboard
          </a>
        </div>
        
        <div style="${styles.infoBox}">
          <p style="margin: 0; color: #ccc; font-size: 14px; line-height: 1.6;">
            <strong>💡 Pro Tip:</strong> Your dashboard contains all resources needed to maximize your investment. Check it out!
          </p>
        </div>
        
        <div style="${styles.footer}">
          <p style="color: #999; font-size: 14px; text-align: center; line-height: 1.6;">
            Questions? Reply to this email or contact us at support@localrnk.com
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>© 2026 LocalRank.ai • Privacy Policy</p>
      </div>
    </div>
  `;
};

export const orderConfirmationTemplate = (businessName, productName, orderAmount) => {
  const styles = getEmailStyles();
  
  return `
    <div style="${styles.container}">
      <div style="${styles.header}">
        <h1 style="${styles.title}">LocalRank.ai</h1>
      </div>
      
      <div style="${styles.wrapper}">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; background: rgba(16, 185, 129, 0.2); border-radius: 50%; padding: 20px;">
            <span style="font-size: 48px;">✅</span>
          </div>
        </div>
        
        <h2 style="${styles.secondaryTitle}">Order Confirmed!</h2>
        
        <p style="color: #ccc; line-height: 1.6; text-align: center;">
          Thank you for your purchase, ${businessName || 'valued customer'}! Your order has been confirmed.
        </p>
        
        <div style="${styles.highlight}">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px 0; color: #999;">Product:</td>
              <td style="padding: 8px 0; color: #fff; text-align: right; font-weight: bold;">${productName || 'GMB Optimization'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #999;">Amount Paid:</td>
              <td style="padding: 8px 0; color: #c8ff00; text-align: right; font-size: 20px; font-weight: bold;">$${orderAmount || '0'}</td>
            </tr>
          </table>
        </div>
        
        <h3 style="color: #fff; margin-top: 30px;">What Happens Next?</h3>
        <div style="color: #ccc; line-height: 1.8;">
          <p>✅ Our team will begin your GMB optimization within 24 hours</p>
          <p>✅ You'll receive a detailed action plan via email</p>
          <p>✅ A dedicated specialist will reach out to schedule your strategy call</p>
          <p>✅ Access your dashboard to track progress in real-time</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://localrnk.com/Dashboard" style="${styles.ctaButton}">
            View Dashboard
          </a>
        </div>
        
        <div style="${styles.footer}">
          <p style="color: #999; font-size: 14px; text-align: center; line-height: 1.6;">
            Questions? Reply to this email or contact us at support@localrnk.com
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>© 2026 LocalRank.ai • Privacy Policy</p>
      </div>
    </div>
  `;
};

export const adminLeadNotificationTemplate = (leadData) => {
  const adminStyles = getAdminEmailStyles();
  const scoreColor = leadData.health_score >= 70 ? '#10b981' : 
                     leadData.health_score >= 50 ? '#f59e0b' : '#ef4444';

  return `
    <div style="${adminStyles.container}">
      <h2 style="color: #333; border-bottom: 2px solid #c8ff00; padding-bottom: 10px;">
        🔔 New Lead Alert
      </h2>
      
      <div style="${adminStyles.wrapper}">
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
          <a href="https://localrnk.com/Admin" style="${adminStyles.ctaButton}">
            View in Admin Dashboard
          </a>
        </div>
      </div>
      
      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        This is an automated notification from LocalRank.ai
      </p>
    </div>
  `;
};

export const adminUpsellNotificationTemplate = (orderData) => {
   const adminStyles = getAdminEmailStyles();

   return `
     <div style="${adminStyles.container}">
       <h2 style="color: #333; border-bottom: 2px solid #c8ff00; padding-bottom: 10px;">
         🎉 New Upsell Conversion
       </h2>

       <div style="${adminStyles.wrapper}">
         <div style="${adminStyles.highlight}">
           <p style="margin: 0; color: #333; font-weight: bold; font-size: 18px;">
             💰 ${orderData.total_amount ? '$' + orderData.total_amount : 'New Upsell'}
           </p>
         </div>

         <table style="width: 100%; margin: 10px 0;">
           <tr>
             <td style="padding: 8px 0; color: #666; width: 40%; font-weight: bold;">Email:</td>
             <td style="padding: 8px 0;">${orderData.email || 'N/A'}</td>
           </tr>
           <tr>
             <td style="padding: 8px 0; color: #666; font-weight: bold;">Lead ID:</td>
             <td style="padding: 8px 0;">${orderData.lead_id || 'N/A'}</td>
           </tr>
           <tr>
             <td style="padding: 8px 0; color: #666; font-weight: bold;">Base Offer:</td>
             <td style="padding: 8px 0;">${orderData.base_offer?.product || 'GMB Optimization & Audit'} - $${orderData.base_offer?.price || '99'}</td>
           </tr>
           ${orderData.upsells && orderData.upsells.length > 0 ? `
           <tr>
             <td style="padding: 8px 0; color: #666; font-weight: bold;">Upsells Accepted:</td>
             <td style="padding: 8px 0;">
               ${orderData.upsells.filter(u => u.accepted).map(u => `${u.product} ($${u.price})`).join(', ')}
             </td>
           </tr>
           ` : ''}
           <tr>
             <td style="padding: 8px 0; color: #666; font-weight: bold;">Total Value:</td>
             <td style="padding: 8px 0; color: #c8ff00; font-weight: bold; font-size: 16px;">$${orderData.total_amount || '0'}</td>
           </tr>
           ${orderData.stripe_payment_intent ? `
           <tr>
             <td style="padding: 8px 0; color: #666; font-weight: bold;">Payment Intent:</td>
             <td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${orderData.stripe_payment_intent}</td>
           </tr>
           ` : ''}
         </table>

         <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
           <a href="https://localrnk.com/Admin" style="${adminStyles.ctaButton}">
             View in Admin Dashboard
           </a>
         </div>
       </div>

       <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 15px; margin: 20px 0;">
         <p style="margin: 0; color: #333; font-size: 14px;">
           <strong>📋 Action Items:</strong> Send welcome call, schedule kickoff, assign account manager
         </p>
       </div>

       <p style="color: #666; font-size: 12px; margin-top: 20px;">
         This is an automated notification from LocalRank.ai
       </p>
     </div>
   `;
};

export const paymentConfirmationTemplate = (businessName, productName, amount, invoiceId) => {
   const styles = getEmailStyles();

   return `
     <div style="${styles.container}">
       <div style="${styles.header}">
         <h1 style="${styles.title}">LocalRank.ai</h1>
       </div>

       <div style="${styles.wrapper}">
         <div style="text-align: center; margin-bottom: 20px;">
           <div style="display: inline-block; background: rgba(16, 185, 129, 0.2); border-radius: 50%; padding: 20px;">
             <span style="font-size: 48px;">💳</span>
           </div>
         </div>

         <h2 style="${styles.secondaryTitle}">Payment Confirmed!</h2>

         <p style="color: #ccc; line-height: 1.6; text-align: center;">
           Thank you, ${businessName || 'valued customer'}! Your payment has been successfully processed.
         </p>

         <div style="${styles.highlight}">
           <table style="width: 100%;">
             <tr>
               <td style="padding: 8px 0; color: #999;">Service:</td>
               <td style="padding: 8px 0; color: #fff; text-align: right; font-weight: bold;">${productName || 'GMB Optimization'}</td>
             </tr>
             <tr>
               <td style="padding: 8px 0; color: #999;">Amount Charged:</td>
               <td style="padding: 8px 0; color: #c8ff00; text-align: right; font-size: 20px; font-weight: bold;">$${amount || '0'}</td>
             </tr>
             ${invoiceId ? `
             <tr>
               <td style="padding: 8px 0; color: #999;">Invoice ID:</td>
               <td style="padding: 8px 0; color: #fff; text-align: right; font-family: monospace; font-size: 12px;">${invoiceId}</td>
             </tr>
             ` : ''}
           </table>
         </div>

         <h3 style="color: #fff; margin-top: 30px;">Your Service Begins Now</h3>
         <div style="color: #ccc; line-height: 1.8;">
           <p>✅ Your account is now active and ready</p>
           <p>✅ Check your email for onboarding instructions</p>
           <p>✅ Your dedicated team is already working on your optimization</p>
           <p>✅ Access your dashboard to monitor progress</p>
         </div>

         <div style="text-align: center; margin: 30px 0;">
           <a href="https://localrnk.com/Dashboard" style="${styles.ctaButton}">
             View Your Dashboard
           </a>
         </div>

         <div style="${styles.infoBox}">
           <p style="margin: 0; color: #ccc; font-size: 14px; line-height: 1.6;">
             <strong>📧 Next Step:</strong> Watch for an email from your account manager with your personalized optimization timeline.
           </p>
         </div>

         <div style="${styles.footer}">
           <p style="color: #999; font-size: 14px; text-align: center; line-height: 1.6;">
             Questions? Reply to this email or contact us at support@localrnk.com
           </p>
         </div>
       </div>

       <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
         <p>© 2026 LocalRank.ai • Privacy Policy</p>
       </div>
     </div>
   `;
};

export const upsellConversionTemplate = (businessName, upsellProduct, amount, totalValue) => {
   const styles = getEmailStyles();

   return `
     <div style="${styles.container}">
       <div style="${styles.header}">
         <h1 style="${styles.title}">LocalRank.ai</h1>
       </div>

       <div style="${styles.wrapper}">
         <div style="text-align: center; margin-bottom: 20px;">
           <div style="display: inline-block; background: rgba(168, 85, 247, 0.2); border-radius: 50%; padding: 20px;">
             <span style="font-size: 48px;">🎉</span>
           </div>
         </div>

         <h2 style="${styles.secondaryTitle}">Premium Upgrade Confirmed!</h2>

         <p style="color: #ccc; line-height: 1.6; text-align: center;">
           Excellent choice, ${businessName || 'valued customer'}! You've unlocked premium features.
         </p>

         <div style="${styles.highlight}">
           <p style="margin: 0 0 15px 0; color: #999; font-size: 12px;">UPGRADE DETAILS</p>
           <table style="width: 100%;">
             <tr>
               <td style="padding: 8px 0; color: #999;">Premium Service:</td>
               <td style="padding: 8px 0; color: #fff; text-align: right; font-weight: bold;">${upsellProduct || 'Premium Tier'}</td>
             </tr>
             <tr>
               <td style="padding: 8px 0; color: #999;">Upgrade Cost:</td>
               <td style="padding: 8px 0; color: #a855f7; text-align: right; font-size: 20px; font-weight: bold;">$${amount || '0'}</td>
             </tr>
             <tr style="border-top: 1px solid rgba(200,255,0,0.2);">
               <td style="padding: 8px 0; color: #999; font-weight: bold;">Total Subscription Value:</td>
               <td style="padding: 8px 0; color: #c8ff00; text-align: right; font-size: 20px; font-weight: bold;">$${totalValue || '0'}</td>
             </tr>
           </table>
         </div>

         <h3 style="color: #fff; margin-top: 30px;">What You Get Now</h3>
         <div style="color: #ccc; line-height: 1.8;">
           <p>✅ Advanced competitor analysis</p>
           <p>✅ Priority support & dedicated account manager</p>
           <p>✅ Custom strategy sessions (bi-weekly)</p>
           <p>✅ Comprehensive monthly performance reports</p>
           <p>✅ Access to advanced optimization tools</p>
         </div>

         <div style="text-align: center; margin: 30px 0;">
           <a href="https://localrnk.com/Dashboard" style="${styles.ctaButton}">
             Access Premium Dashboard
           </a>
         </div>

         <div style="${styles.infoBox}">
           <p style="margin: 0; color: #ccc; font-size: 14px; line-height: 1.6;">
             <strong>🚀 Pro Tip:</strong> Your premium onboarding call is scheduled within 24 hours. Look for a calendar invite!
           </p>
         </div>

         <div style="${styles.footer}">
           <p style="color: #999; font-size: 14px; text-align: center; line-height: 1.6;">
             Questions? Reply to this email or contact us at support@localrnk.com
           </p>
         </div>
       </div>

       <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
         <p>© 2026 LocalRank.ai • Privacy Policy</p>
       </div>
     </div>
   `;
};