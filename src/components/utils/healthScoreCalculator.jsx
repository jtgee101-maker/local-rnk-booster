/**
 * Calculate GMB health score using the normalized formula
 * Formula: S = 25 (baseline) + R (Review Strength, max 25) + V (Visual Authority, max 20) + O (Optimization, max 30)
 * Total max: 100 points
 */
export function calculateHealthScore(businessData) {
  const rating = businessData.gmb_rating || 0;
  const reviewCount = businessData.gmb_reviews_count || 0;
  const photosCount = businessData.gmb_photos_count || 0;
  
  // Review Strength (R) - Max 25 pts
  // Formula: R = min(25, ((Rating * log10(Count + 1)) / (5 * log10(201))) * 25)
  const rScore = Math.min(25, ((rating * Math.log10(reviewCount + 1)) / (5 * Math.log10(201))) * 25);
  
  // Visual Authority (V) - Max 20 pts
  // Formula: V = (photos / 10) * 20 (capped at 20 for 10+ photos)
  const vScore = Math.min(20, (photosCount / 10) * 20);
  
  // Optimization (O) - Max 30 pts (10 pts each for website, phone, hours)
  let oScore = 0;
  if (businessData.website) oScore += 10;
  if (businessData.phone) oScore += 10;
  if (businessData.gmb_has_hours) oScore += 10;
  
  // Final Score = 25 (baseline) + R + V + O
  const finalScore = Math.round(25 + rScore + vScore + oScore);
  
  // Cap between 10-100 (though formula naturally caps at 100)
  return Math.max(10, Math.min(100, finalScore));
}

/**
 * Generate critical issues based on business data
 */
export function generateCriticalIssues(businessData) {
  const issues = [];
  
  if (businessData.gmb_rating < 4.5) {
    issues.push(`⚠️ Rating at ${businessData.gmb_rating}★ - Businesses above 4.7★ get 67% more clicks`);
  }
  
  if (businessData.gmb_reviews_count < 50) {
    issues.push(`📊 Only ${businessData.gmb_reviews_count} reviews detected - Top competitors average 100+ (losing 58% visibility)`);
  }
  
  if (businessData.gmb_photos_count < 30) {
    issues.push(`📸 Critical photo gap: ${businessData.gmb_photos_count} photos vs industry standard 50+ (missing 73% more direction requests)`);
  }
  
  if (!businessData.gmb_has_hours) {
    issues.push('🕐 Missing business hours - Invisible in 40% of searches');
  }
  
  if (!businessData.phone) {
    issues.push('📞 No phone number - Blocking 89% of mobile users from calling');
  }
  
  if (!businessData.website) {
    issues.push('🌐 No website linked - Missing 52% more web traffic from Maps');
  }
  
  if (!businessData.gmb_types || businessData.gmb_types.length < 2) {
    issues.push('🏷️ Incomplete categories - 2.3x lower ranking in related searches');
  }
  
  return issues;
}

/**
 * Calculate revenue impact using the "Lead-Theft" algorithm
 * Shows monthly lost revenue based on visibility gap
 */
export function calculateRevenueImpact(healthScore, industryData = {}) {
  const {
    monthlySearchVolume = 1000,
    avgLeadValue = 150,
    conversionRate = 0.10,
    currentRank = 7
  } = industryData;
  
  // Map Pack Top 3 capture 70% of clicks
  const mapPackCaptureRate = 0.70;
  
  // Calculate visibility gap (100 - health score = % of potential lost)
  const visibilityGap = (100 - healthScore) / 100;
  
  // Lost revenue per month
  const lostRevenue = (monthlySearchVolume * mapPackCaptureRate) * avgLeadValue * conversionRate * visibilityGap;
  
  return {
    monthlyLost: Math.round(lostRevenue),
    annualLost: Math.round(lostRevenue * 12),
    visibilityGapPercent: Math.round(visibilityGap * 100),
    recoveryPotential: Math.round(lostRevenue * 0.80) // 80% recovery is realistic
  };
}