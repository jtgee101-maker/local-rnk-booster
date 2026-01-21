import { HEALTH_SCORE } from './constants';

/**
 * Calculate GMB health score based on business data
 * Centralized logic to avoid duplication
 */
export function calculateHealthScore(businessData) {
  let score = HEALTH_SCORE.BASE;
  
  // Rating scoring
  if (businessData.gmb_rating >= HEALTH_SCORE.RATING.EXCELLENT.threshold) {
    score += HEALTH_SCORE.RATING.EXCELLENT.points;
  } else if (businessData.gmb_rating >= HEALTH_SCORE.RATING.GOOD.threshold) {
    score += HEALTH_SCORE.RATING.GOOD.points;
  } else if (businessData.gmb_rating >= HEALTH_SCORE.RATING.FAIR.threshold) {
    score += HEALTH_SCORE.RATING.FAIR.points;
  } else {
    score += HEALTH_SCORE.RATING.POOR_PENALTY;
  }
  
  // Reviews count
  if (businessData.gmb_reviews_count >= HEALTH_SCORE.REVIEWS.EXCELLENT.threshold) {
    score += HEALTH_SCORE.REVIEWS.EXCELLENT.points;
  } else if (businessData.gmb_reviews_count >= HEALTH_SCORE.REVIEWS.GOOD.threshold) {
    score += HEALTH_SCORE.REVIEWS.GOOD.points;
  } else if (businessData.gmb_reviews_count >= HEALTH_SCORE.REVIEWS.FAIR.threshold) {
    score += HEALTH_SCORE.REVIEWS.FAIR.points;
  } else if (businessData.gmb_reviews_count < HEALTH_SCORE.REVIEWS.POOR.threshold) {
    score += HEALTH_SCORE.REVIEWS.POOR.penalty;
  }
  
  // Photos
  if (businessData.gmb_photos_count >= HEALTH_SCORE.PHOTOS.EXCELLENT.threshold) {
    score += HEALTH_SCORE.PHOTOS.EXCELLENT.points;
  } else if (businessData.gmb_photos_count >= HEALTH_SCORE.PHOTOS.GOOD.threshold) {
    score += HEALTH_SCORE.PHOTOS.GOOD.points;
  } else if (businessData.gmb_photos_count >= HEALTH_SCORE.PHOTOS.FAIR.threshold) {
    score += HEALTH_SCORE.PHOTOS.FAIR.points;
  } else {
    score += HEALTH_SCORE.PHOTOS.POOR_PENALTY;
  }
  
  // Business hours
  score += businessData.gmb_has_hours ? HEALTH_SCORE.HAS_HOURS_POINTS : HEALTH_SCORE.NO_HOURS_PENALTY;
  
  // Website
  score += businessData.website ? HEALTH_SCORE.HAS_WEBSITE_POINTS : HEALTH_SCORE.NO_WEBSITE_PENALTY;
  
  // Phone
  if (!businessData.phone) score += HEALTH_SCORE.NO_PHONE_PENALTY;
  
  // Business types
  if (!businessData.gmb_types || businessData.gmb_types.length === 0) {
    score += HEALTH_SCORE.NO_TYPES_PENALTY;
  }
  
  // Cap between min and max
  return Math.max(HEALTH_SCORE.MIN, Math.min(HEALTH_SCORE.MAX, score));
}

/**
 * Generate critical issues based on business data
 */
export function generateCriticalIssues(businessData) {
  const issues = [];
  
  if (businessData.gmb_rating < 4.5) {
    issues.push(`⚠️ Rating at ${businessData.gmb_rating} - businesses above 4.7★ get 67% more clicks`);
  }
  
  if (businessData.gmb_reviews_count < 50) {
    issues.push(`📊 Only ${businessData.gmb_reviews_count} reviews detected - top competitors average 100+ (losing 58% visibility)`);
  }
  
  if (businessData.gmb_photos_count < 30) {
    issues.push(`📸 Critical photo gap: ${businessData.gmb_photos_count} photos vs. industry standard of 50+ (missing 73% more direction requests)`);
  }
  
  return issues;
}