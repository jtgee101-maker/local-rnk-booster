/**
 * Enhanced email templates with AI-generated insights
 * Includes comprehensive GMB analysis and personalized recommendations
 */

export const enhancedAuditTemplate = (leadData, analysis) => {
  const styles = getEnhancedStyles();
  const scoreColor = leadData.health_score >= 70 ? '#10b981' : 
                     leadData.health_score >= 50 ? '#f59e0b' : '#ef4444';

  return `
    <div style="${styles.container}">
      <div style="${styles.header}">
        <h1 style="${styles.title}">LocalRank.ai</h1>
        <p style="color: #999; margin: 10px 0 0 0;">Your Personalized GMB Optimization Report</p>
      </div>
      
      <div style="${styles.wrapper}">
        <!-- Hero Section -->
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; background: ${scoreColor}33; border-radius: 50%; padding: 25px;">
            <span style="font-size: 56px;">📊</span>
          </div>
        </div>
        
        <h2 style="${styles.secondaryTitle}">Your GMB Analysis Complete</h2>
        <p style="color: #ccc; text-align: center; margin-bottom: 30px;">
          AI-powered deep analysis of ${leadData.business_name || 'your business'}'s Google My Business profile
        </p>

        <!-- Score Card with Breakdown -->
        <div style="${styles.scoreCard}">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <p style="color: #999; margin: 0; font-size: 12px; font-weight: bold;">GMB HEALTH SCORE</p>
              <div style="font-size: 48px; color: ${scoreColor}; font-weight: bold; margin: 10px 0;">
                ${leadData.health_score}/100
              </div>
              <p style="color: #ccc; margin: 5px 0; font-size: 14px;">
                ${leadData.health_score >= 70 ? '✅ Good Foundation' : 
                  leadData.health_score >= 50 ? '⚠️ Needs Work' : '🚨 Critical Issues'}
              </p>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 14px; color: #999; line-height: 1.8;">
                <div>Rating: <strong>${leadData.gmb_rating || 'N/A'}</strong> ⭐</div>
                <div>Reviews: <strong>${leadData.gmb_reviews_count || 0}</strong></div>
                <div>Photos: <strong>${leadData.gmb_photos_count || 0}</strong></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Competitive Position -->
        ${analysis?.competitiveInsights ? `
        <div style="${styles.insightBox}">
          <h3 style="color: #fff; margin-top: 0; margin-bottom: 15px;">🎯 Your Competitive Position</h3>
          <p style="color: #ccc; margin: 0 0 12px 0;">
            <strong>Rating:</strong> ${analysis.competitiveInsights.ratingPosition}
          </p>
          <p style="color: #ccc; margin: 0 0 12px 0;">
            <strong>Review Volume:</strong> ${analysis.competitiveInsights.reviewCountPosition}
          </p>
          <p style="color: #ccc; margin: 0 0 12px 0;">
            <strong>Visibility Gap:</strong> You're visible in ${100 - analysis.competitiveInsights.visibility}% of potential searches
          </p>
          ${analysis.competitiveInsights.competitiveAdvantages?.length > 0 ? `
            <p style="color: #c8ff00; font-weight: bold; margin: 15px 0 8px 0;">✅ Your Strengths:</p>
            <ul style="color: #ccc; margin: 0; padding-left: 20px;">
              ${analysis.competitiveInsights.competitiveAdvantages.map(adv => 
                `<li style="margin: 5px 0;">${adv}</li>`
              ).join('')}
            </ul>
          ` : ''}
        </div>
        ` : ''}

        <!-- Revenue Impact -->
        ${analysis?.revenueImpact ? `
        <div style="${styles.alertBox}">
          <div style="display: flex; gap: 15px;">
            <div style="font-size: 24px;">💰</div>
            <div style="flex: 1;">
              <h3 style="color: #fff; margin: 0 0 10px 0;">Revenue Impact</h3>
              <p style="color: #ccc; margin: 5px 0;">
                <strong>Monthly Loss:</strong> $${analysis.revenueImpact.currentMonthlyLoss?.toLocaleString() || '0'}
              </p>
              <p style="color: #ccc; margin: 5px 0;">
                <strong>Annual Impact:</strong> $${analysis.revenueImpact.annualRevenueLoss?.toLocaleString() || '0'}
              </p>
              <p style="color: #c8ff00; margin: 10px 0 0 0; font-size: 13px;">
                💡 Fix your profile = Break even in ${analysis.revenueImpact.breakEven}
              </p>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Critical Issues -->
        ${analysis?.competitiveInsights?.vulnerabilities?.length > 0 ? `
        <div style="${styles.criticalBox}">
          <h3 style="color: #ff6b6b; margin: 0 0 15px 0;">🚨 Critical Issues (Fix First)</h3>
          <div style="space-y-2;">
            ${analysis.competitiveInsights.vulnerabilities.slice(0, 3).map((vuln, idx) => `
              <div style="display: flex; gap: 10px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255, 107, 107, 0.2);">
                <div style="background: #ff6b6b; color: #fff; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 12px; font-weight: bold;">
                  ${idx + 1}
                </div>
                <p style="color: #ccc; margin: 0; line-height: 1.4;">${vuln}</p>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Top Recommendations -->
        ${analysis?.recommendations?.recommendations ? `
        <div style="${styles.recommendationBox}">
          <h3 style="color: #c8ff00; margin: 0 0 15px 0;">📋 Prioritized Action Plan</h3>
          ${analysis.recommendations.recommendations.slice(0, 3).map((rec, idx) => `
            <div style="background: rgba(200, 255, 0, 0.05); border-left: 3px solid #c8ff00; padding: 15px; margin-bottom: 12px; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <h4 style="color: #c8ff00; margin: 0; font-size: 14px;">
                  <strong>Priority ${rec.priority}:</strong> ${rec.action}
                </h4>
                <span style="background: #c8ff00; color: #000; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">
                  ${rec.timeline}
                </span>
              </div>
              <p style="color: #ccc; margin: 8px 0; font-size: 13px;">
                <strong>Impact:</strong> ${rec.impact}
              </p>
              ${rec.actionItems ? `
                <p style="color: #999; margin: 8px 0; font-size: 12px;">
                  ${rec.actionItems.join(' • ')}
                </p>
              ` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Projected Results -->
        ${analysis?.recommendations?.projectedResults ? `
        <div style="${styles.successBox}">
          <h3 style="color: #10b981; margin: 0 0 15px 0;">🎯 What You Can Expect (90 Days)</h3>
          <ul style="color: #ccc; line-height: 1.8; margin: 0; padding-left: 20px;">
            ${analysis.recommendations.projectedResults.successMetrics?.map(metric =>
              `<li>${metric}</li>`
            ).join('') || ''}
            <li><strong>Call Volume:</strong> +50% estimated increase</li>
          </ul>
        </div>
        ` : ''}

        <!-- CTA -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://localrnk.com/CheckoutV2" style="${styles.ctaButton}">
            Get Your Optimization Plan
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 10px;">
            Complete implementation takes 90 days
          </p>
        </div>

        <!-- Footer -->
        <div style="${styles.footer}">
          <p style="color: #999; font-size: 12px; text-align: center; line-height: 1.6;">
            This personalized analysis was generated by our AI team and tailored to ${leadData.business_name || 'your business'}. 
            Questions? Reply to this email or contact support@localrnk.com
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>© 2026 LocalRank.ai • Built for Lead Independence</p>
      </div>
    </div>
  `;
};

function getEnhancedStyles() {
  return {
    container: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 40px 20px;',
    wrapper: 'background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid #333; border-radius: 16px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);',
    header: 'text-align: center; margin-bottom: 30px;',
    title: 'color: #c8ff00; font-size: 36px; margin: 0; font-weight: 800;',
    secondaryTitle: 'color: #fff; text-align: center; margin-top: 0; font-size: 28px; margin-bottom: 10px;',
    scoreCard: 'background: rgba(200, 255, 0, 0.08); border: 1px solid rgba(200, 255, 0, 0.2); border-radius: 12px; padding: 25px; margin: 30px 0; backdrop-filter: blur(10px);',
    insightBox: 'background: rgba(100, 200, 255, 0.1); border-left: 4px solid #64c8ff; padding: 20px; margin: 20px 0; border-radius: 8px;',
    alertBox: 'background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 8px;',
    criticalBox: 'background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.3); padding: 20px; margin: 20px 0; border-radius: 8px;',
    recommendationBox: 'background: rgba(200, 255, 0, 0.05); border: 1px solid rgba(200, 255, 0, 0.2); padding: 20px; margin: 20px 0; border-radius: 8px;',
    successBox: 'background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px;',
    ctaButton: 'display: inline-block; background: linear-gradient(135deg, #c8ff00 0%, #a3e635 100%); color: #000; padding: 16px 50px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px; box-shadow: 0 10px 30px rgba(200, 255, 0, 0.3); transition: all 0.3s;',
    footer: 'border-top: 1px solid #333; margin-top: 30px; padding-top: 20px;'
  };
}

export { getEnhancedStyles };