import { base44 } from '@/api/base44Client';

/**
 * Lead scoring engine - calculates lead quality score
 * Score: 0-100 based on multiple factors
 */
export class LeadScoringEngine {
  static async calculateScore(leadId) {
    try {
      const lead = await base44.entities.Lead.get(leadId);
      let score = 0;
      const factors = [];

      // Profile completeness (max 20 points)
      if (lead.business_name) { score += 5; factors.push('Has business name +5'); }
      if (lead.email) { score += 5; factors.push('Has email +5'); }
      if (lead.phone) { score += 5; factors.push('Has phone +5'); }
      if (lead.website) { score += 5; factors.push('Has website +5'); }

      // GMB data quality (max 25 points)
      if (lead.gmb_rating >= 4.5) { score += 10; factors.push('High GMB rating +10'); }
      else if (lead.gmb_rating >= 4.0) { score += 5; factors.push('Good GMB rating +5'); }
      
      if (lead.gmb_reviews_count >= 50) { score += 10; factors.push('Many reviews +10'); }
      else if (lead.gmb_reviews_count >= 25) { score += 5; factors.push('Some reviews +5'); }
      
      if (lead.gmb_photos_count >= 20) { score += 5; factors.push('Good photos +5'); }

      // Engagement (max 30 points)
      const events = await base44.entities.ConversionEvent.filter({ lead_id: leadId });
      const quizCompleted = events.some(e => e.event_name.includes('quiz_completed'));
      const emailOpened = events.some(e => e.event_name.includes('email_opened'));
      const linkClicked = events.some(e => e.event_name.includes('clicked'));
      
      if (quizCompleted) { score += 15; factors.push('Completed quiz +15'); }
      if (emailOpened) { score += 10; factors.push('Opened email +10'); }
      if (linkClicked) { score += 5; factors.push('Clicked link +5'); }

      // Recency (max 15 points)
      const createdDate = new Date(lead.created_date);
      const hoursSinceCreation = (Date.now() - createdDate) / (1000 * 60 * 60);
      
      if (hoursSinceCreation < 24) { score += 15; factors.push('Created <24h +15'); }
      else if (hoursSinceCreation < 72) { score += 10; factors.push('Created <72h +10'); }
      else if (hoursSinceCreation < 168) { score += 5; factors.push('Created <1wk +5'); }

      // Pain point severity (max 10 points)
      if (lead.health_score < 40) { score += 10; factors.push('Critical health score +10'); }
      else if (lead.health_score < 60) { score += 5; factors.push('Low health score +5'); }

      // Cap at 100
      score = Math.min(score, 100);

      // Determine grade
      let grade;
      if (score >= 80) grade = 'A';
      else if (score >= 60) grade = 'B';
      else if (score >= 40) grade = 'C';
      else grade = 'D';

      return {
        score,
        grade,
        factors,
        recommendation: this.getRecommendation(score)
      };
    } catch (error) {
      console.error('Lead scoring error:', error);
      return { score: 0, grade: 'F', factors: [], recommendation: 'Error calculating score' };
    }
  }

  static getRecommendation(score) {
    if (score >= 80) return 'Hot lead - Contact immediately';
    if (score >= 60) return 'Warm lead - Follow up within 24h';
    if (score >= 40) return 'Cold lead - Add to nurture sequence';
    return 'Low priority - Monitor engagement';
  }

  static async batchScore(leadIds) {
    const results = await Promise.all(
      leadIds.map(id => this.calculateScore(id))
    );
    return results;
  }
}