import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError, validateRequired } from '../utils/errorHandler';

/**
 * Competitor Analyzer
 * Extracts top 20 competitors and provides comprehensive competitive analysis
 * 
 * Features:
 * - Top 20 competitor extraction for any keyword+location
 * - Side-by-side comparison matrix
 * - Gap analysis (what they have that you don't)
 * - Opportunity scoring (0-100)
 */

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    validateRequired(payload, ['keyword', 'location']);
    const { 
      keyword, 
      location, 
      radius = 5000, 
      businessData = null,
      includeDetails = true 
    } = payload;

    // Get API key
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      throw new FunctionError('Google Maps API not configured', 500, 'API_NOT_CONFIGURED');
    }

    // Run competitor analysis
    const analysis = await runCompetitorAnalysis({
      keyword,
      location,
      radius,
      businessData,
      includeDetails,
      apiKey
    });

    return Response.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    });

  } catch (error) {
    console.error('Competitor analyzer error:', error);
    return Response.json({
      success: false,
      error: error.message,
      code: error instanceof FunctionError ? error.code : 'ANALYSIS_FAILED',
      timestamp: new Date().toISOString()
    }, { status: error instanceof FunctionError ? error.statusCode : 500 });
  }
}));

/**
 * Main competitor analysis function
 */
async function runCompetitorAnalysis(params) {
  const { keyword, location, radius, businessData, includeDetails, apiKey } = params;
  
  // Search for competitors using Google Places API
  const searchResults = await searchCompetitors(keyword, location, radius, apiKey);
  
  // Get detailed data for top competitors
  let competitors = searchResults.slice(0, 20);
  
  if (includeDetails) {
    competitors = await enrichCompetitorData(competitors, apiKey);
  } else {
    competitors = competitors.map(c => calculateBasicMetrics(c));
  }
  
  // Calculate scores for all competitors
  competitors = competitors.map(c => ({
    ...c,
    ...calculateCompetitorScore(c)
  }));
  
  // Sort by score (highest first)
  competitors.sort((a, b) => b.overallScore - a.overallScore);
  
  // Add ranking
  competitors = competitors.map((c, idx) => ({
    ...c,
    rank: idx + 1
  }));
  
  // Generate comparison matrix
  const comparisonMatrix = generateComparisonMatrix(competitors, businessData);
  
  // Perform gap analysis
  const gapAnalysis = performGapAnalysis(competitors, businessData);
  
  // Calculate opportunity score
  const opportunityScore = calculateOpportunityScore(competitors, businessData, gapAnalysis);
  
  // Generate strategic recommendations
  const recommendations = generateStrategicRecommendations(competitors, gapAnalysis, opportunityScore);
  
  // Calculate market positioning
  const marketPosition = calculateMarketPosition(competitors, businessData);
  
  return {
    summary: {
      totalCompetitors: competitors.length,
      analyzedAt: new Date().toISOString(),
      keyword,
      location,
      opportunityScore: opportunityScore.score,
      opportunityGrade: opportunityScore.grade,
      marketPosition: marketPosition.position,
      marketTier: marketPosition.tier
    },
    topCompetitors: competitors.slice(0, 10),
    allCompetitors: competitors,
    comparisonMatrix,
    gapAnalysis,
    opportunityScore,
    marketPosition,
    recommendations,
    competitiveLandscape: analyzeCompetitiveLandscape(competitors)
  };
}

/**
 * Search for competitors using Google Places API
 */
async function searchCompetitors(keyword, location, radius, apiKey) {
  const results = [];
  
  // Try different search variations to get comprehensive results
  const searchQueries = [
    `${keyword} in ${location}`,
    `${keyword} near ${location}`,
    `${keyword} ${location}`,
    `best ${keyword} ${location}`
  ];
  
  for (const query of searchQueries) {
    try {
      const searchUrl = 'https://places.googleapis.com/v1/places:searchText';
      
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types,places.location,places.primaryType,places.websiteUri,places.nationalPhoneNumber,places.regularOpeningHours,places.photos,places.editorialSummary'
        },
        body: JSON.stringify({
          textQuery: query,
          maxResultCount: 20
        })
      });
      
      if (!response.ok) {
        console.warn(`Search failed for query "${query}": ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (data.places) {
        results.push(...data.places);
      }
    } catch (error) {
      console.error(`Error searching for "${query}":`, error);
    }
  }
  
  // Remove duplicates by place_id
  const uniqueResults = [];
  const seen = new Set();
  
  for (const place of results) {
    if (!seen.has(place.id)) {
      seen.add(place.id);
      uniqueResults.push(place);
    }
  }
  
  return uniqueResults;
}

/**
 * Enrich competitor data with detailed metrics
 */
async function enrichCompetitorData(competitors, apiKey) {
  // Process in batches to avoid rate limits
  const batchSize = 5;
  const enriched = [];
  
  for (let i = 0; i < competitors.length; i += batchSize) {
    const batch = competitors.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(async (competitor) => {
        try {
          // Get detailed place data
          const detailsUrl = `https://places.googleapis.com/v1/places/${competitor.id}`;
          
          const response = await fetch(detailsUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': 'displayName,formattedAddress,nationalPhoneNumber,websiteUri,rating,userRatingCount,reviews,photos,regularOpeningHours,types,location,editorialSummary,businessStatus,primaryType,priceLevel'
            }
          });
          
          if (!response.ok) {
            return calculateBasicMetrics(competitor);
          }
          
          const details = await response.json();
          
          return {
            placeId: competitor.id,
            name: details.displayName?.text || details.displayName || competitor.displayName?.text,
            address: details.formattedAddress || competitor.formattedAddress,
            phone: details.nationalPhoneNumber,
            website: details.websiteUri,
            rating: details.rating || competitor.rating || 0,
            reviewCount: details.userRatingCount || competitor.userRatingCount || 0,
            photos: details.photos || [],
            photoCount: details.photos?.length || 0,
            types: details.types || competitor.types || [],
            primaryType: details.primaryType || competitor.primaryType,
            hours: details.regularOpeningHours,
            hasHours: !!details.regularOpeningHours,
            description: details.editorialSummary?.text,
            hasDescription: !!details.editorialSummary?.text,
            businessStatus: details.businessStatus,
            priceLevel: details.priceLevel,
            location: details.location || competitor.location,
            reviews: details.reviews || []
          };
        } catch (error) {
          console.error(`Error enriching ${competitor.id}:`, error);
          return calculateBasicMetrics(competitor);
        }
      })
    );
    
    enriched.push(...batchResults);
    
    // Rate limiting delay
    if (i + batchSize < competitors.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return enriched;
}

/**
 * Calculate basic metrics from limited data
 */
function calculateBasicMetrics(place) {
  return {
    placeId: place.id,
    name: place.displayName?.text || place.displayName,
    address: place.formattedAddress,
    rating: place.rating || 0,
    reviewCount: place.userRatingCount || 0,
    types: place.types || [],
    primaryType: place.primaryType,
    location: place.location,
    photoCount: place.photos?.length || 0,
    hasHours: false,
    hasDescription: false,
    website: null,
    phone: null
  };
}

/**
 * Calculate comprehensive competitor score
 */
function calculateCompetitorScore(competitor) {
  // Relevance Score (25%)
  const relevanceScore = calculateRelevanceScore(competitor);
  
  // Prominence Score (30%)
  const prominenceScore = calculateProminenceScore(competitor);
  
  // Engagement Score (20%)
  const engagementScore = calculateEngagementScore(competitor);
  
  // Completeness Score (15%)
  const completenessScore = calculateCompletenessScore(competitor);
  
  // Activity Score (10%)
  const activityScore = calculateActivityScore(competitor);
  
  // Weighted total
  const overallScore = Math.round(
    relevanceScore * 0.25 +
    prominenceScore * 0.30 +
    engagementScore * 0.20 +
    completenessScore * 0.15 +
    activityScore * 0.10
  );
  
  return {
    overallScore,
    scores: {
      relevance: relevanceScore,
      prominence: prominenceScore,
      engagement: engagementScore,
      completeness: completenessScore,
      activity: activityScore
    }
  };
}

function calculateRelevanceScore(competitor) {
  let score = 40;
  
  // Category relevance
  if (competitor.types?.length >= 1) score += 20;
  if (competitor.types?.length >= 3) score += 10;
  if (competitor.primaryType) score += 15;
  
  // Description quality
  const descLength = competitor.description?.length || 0;
  if (descLength >= 100) score += 10;
  if (descLength >= 200) score += 5;
  
  return Math.min(100, score);
}

function calculateProminenceScore(competitor) {
  let score = 20;
  
  // Rating impact
  const rating = competitor.rating || 0;
  if (rating > 0) {
    score += (rating / 5) * 25;
  }
  
  // Review count impact (logarithmic)
  const reviewCount = competitor.reviewCount || 0;
  if (reviewCount > 0) {
    score += Math.min(35, Math.log10(reviewCount + 1) * 10);
  }
  
  // Website presence
  if (competitor.website) score += 10;
  
  // Photo volume
  const photoCount = competitor.photoCount || 0;
  score += Math.min(10, photoCount * 0.2);
  
  return Math.min(100, score);
}

function calculateEngagementScore(competitor) {
  let score = 30;
  
  // Review engagement (quality indicators)
  const reviews = competitor.reviews || [];
  if (reviews.length > 0) {
    const ownerResponses = reviews.filter(r => r.ownerResponse || r.reply).length;
    const responseRate = ownerResponses / reviews.length;
    score += responseRate * 30;
  }
  
  // Photo engagement
  const photoCount = competitor.photoCount || 0;
  score += Math.min(20, photoCount * 0.4);
  
  // Information completeness encourages engagement
  if (competitor.hasHours) score += 10;
  if (competitor.phone) score += 10;
  
  return Math.min(100, score);
}

function calculateCompletenessScore(competitor) {
  let score = 0;
  
  if (competitor.name) score += 15;
  if (competitor.address) score += 15;
  if (competitor.phone) score += 15;
  if (competitor.website) score += 15;
  if (competitor.hasHours) score += 15;
  if (competitor.hasDescription) score += 15;
  if (competitor.photoCount >= 5) score += 10;
  
  return Math.min(100, score);
}

function calculateActivityScore(competitor) {
  let score = 30;
  
  // Recent reviews indicate activity
  const reviews = competitor.reviews || [];
  const recentReviews = reviews.filter(r => {
    const reviewTime = r.time ? r.time * 1000 : new Date(r.createdAt || 0).getTime();
    return (Date.now() - reviewTime) < (90 * 24 * 60 * 60 * 1000); // 90 days
  });
  
  if (recentReviews.length >= 5) score += 30;
  else if (recentReviews.length >= 2) score += 20;
  else if (recentReviews.length >= 1) score += 10;
  
  // Photo updates
  const photoCount = competitor.photoCount || 0;
  if (photoCount >= 20) score += 20;
  else if (photoCount >= 10) score += 10;
  
  // Business status
  if (competitor.businessStatus === 'OPERATIONAL') score += 20;
  
  return Math.min(100, score);
}

/**
 * Generate comparison matrix
 */
function generateComparisonMatrix(competitors, businessData) {
  if (!businessData) return null;
  
  const metrics = [
    { key: 'rating', label: 'Rating', format: 'decimal', max: 5 },
    { key: 'reviewCount', label: 'Reviews', format: 'number', max: 500 },
    { key: 'photoCount', label: 'Photos', format: 'number', max: 100 },
    { key: 'overallScore', label: 'Health Score', format: 'number', max: 100 },
    { key: 'hasHours', label: 'Hours Listed', format: 'boolean' },
    { key: 'hasDescription', label: 'Description', format: 'boolean' },
    { key: 'website', label: 'Website', format: 'boolean' }
  ];
  
  // Calculate your stats
  const yourStats = calculateYourStats(businessData);
  
  // Calculate averages
  const averages = {};
  metrics.forEach(metric => {
    if (metric.format === 'boolean') {
      const count = competitors.filter(c => c[metric.key]).length;
      averages[metric.key] = Math.round((count / competitors.length) * 100);
    } else {
      const values = competitors.map(c => c[metric.key] || 0);
      averages[metric.key] = values.reduce((a, b) => a + b, 0) / values.length;
    }
  });
  
  // Calculate best in class
  const bestInClass = {};
  metrics.forEach(metric => {
    if (metric.format === 'boolean') {
      bestInClass[metric.key] = 100;
    } else {
      const values = competitors.map(c => c[metric.key] || 0);
      bestInClass[metric.key] = Math.max(...values, yourStats[metric.key] || 0);
    }
  });
  
  // Calculate your rank for each metric
  const yourRanks = {};
  metrics.forEach(metric => {
    if (metric.format !== 'boolean') {
      const allValues = [...competitors.map(c => c[metric.key] || 0), yourStats[metric.key] || 0];
      allValues.sort((a, b) => b - a);
      yourRanks[metric.key] = allValues.indexOf(yourStats[metric.key] || 0) + 1;
    }
  });
  
  return {
    metrics,
    yourStats,
    yourRanks,
    averages,
    bestInClass,
    vsAverage: metrics.map(metric => ({
      metric: metric.label,
      you: yourStats[metric.key],
      average: averages[metric.key],
      difference: calculateDifference(yourStats[metric.key], averages[metric.key], metric.format),
      percentile: calculatePercentile(yourStats[metric.key], competitors.map(c => c[metric.key]), metric.format)
    }))
  };
}

function calculateYourStats(businessData) {
  return {
    rating: businessData.gmb_rating || businessData.rating || 0,
    reviewCount: businessData.gmb_reviews_count || businessData.reviewCount || 0,
    photoCount: businessData.gmb_photos_count || businessData.photoCount || 0,
    overallScore: businessData.health_score || 50,
    hasHours: businessData.gmb_has_hours || businessData.hasHours || false,
    hasDescription: businessData.has_description || businessData.hasDescription || false,
    website: !!(businessData.website || businessData.websiteUri)
  };
}

function calculateDifference(yourValue, average, format) {
  if (format === 'boolean') {
    return yourValue ? (yourValue > average ? 'above' : 'equal') : 'below';
  }
  const diff = (yourValue || 0) - average;
  return diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
}

function calculatePercentile(yourValue, allValues, format) {
  if (format === 'boolean') return yourValue ? 100 : 0;
  
  const sorted = [...allValues, yourValue || 0].sort((a, b) => b - a);
  const rank = sorted.indexOf(yourValue || 0);
  return Math.round(((sorted.length - rank) / sorted.length) * 100);
}

/**
 * Perform gap analysis
 */
function performGapAnalysis(competitors, businessData) {
  if (!businessData) {
    return {
      gaps: [],
      competitiveAdvantages: [],
      opportunities: []
    };
  }
  
  const yourStats = calculateYourStats(businessData);
  const gaps = [];
  const advantages = [];
  const opportunities = [];
  
  // Analyze each metric
  const metrics = [
    { key: 'reviewCount', threshold: 0.7, label: 'Review Count' },
    { key: 'rating', threshold: 0.9, label: 'Rating' },
    { key: 'photoCount', threshold: 0.6, label: 'Photo Count' },
    { key: 'hasDescription', threshold: 1, label: 'Business Description' },
    { key: 'website', threshold: 1, label: 'Website' },
    { key: 'hasHours', threshold: 1, label: 'Business Hours' }
  ];
  
  metrics.forEach(metric => {
    const competitorAvg = competitors.reduce((sum, c) => sum + (c[metric.key] || 0), 0) / competitors.length;
    const yourValue = yourStats[metric.key] || 0;
    const ratio = competitorAvg > 0 ? yourValue / competitorAvg : 0;
    
    if (ratio < metric.threshold) {
      const gap = {
        metric: metric.label,
        yourValue,
        competitorAvg: Math.round(competitorAvg * 10) / 10,
        gap: Math.round((competitorAvg - yourValue) * 10) / 10,
        priority: ratio < 0.5 ? 'critical' : ratio < 0.8 ? 'high' : 'medium',
        impact: estimateImpact(metric.key, competitorAvg - yourValue)
      };
      gaps.push(gap);
      
      opportunities.push({
        area: metric.label,
        current: yourValue,
        target: Math.ceil(competitorAvg * 1.2),
        potentialImprovement: Math.round(gap.impact * 10) / 10,
        timeline: estimateTimeline(metric.key, Math.ceil(competitorAvg * 1.2 - yourValue))
      });
    } else if (ratio > 1.2) {
      advantages.push({
        metric: metric.label,
        yourValue,
        competitorAvg: Math.round(competitorAvg * 10) / 10,
        lead: Math.round((yourValue - competitorAvg) * 10) / 10,
        strength: ratio > 1.5 ? 'major' : 'moderate'
      });
    }
  });
  
  // Sort by impact
  gaps.sort((a, b) => b.impact - a.impact);
  opportunities.sort((a, b) => b.potentialImprovement - a.potentialImprovement);
  
  return {
    gaps: gaps.slice(0, 10),
    competitiveAdvantages: advantages,
    opportunities: opportunities.slice(0, 8),
    totalGapImpact: gaps.reduce((sum, g) => sum + g.impact, 0)
  };
}

function estimateImpact(metric, gap) {
  const impactWeights = {
    reviewCount: 0.15,
    rating: 0.20,
    photoCount: 0.08,
    hasDescription: 0.05,
    website: 0.10,
    hasHours: 0.12
  };
  
  return Math.abs(gap) * (impactWeights[metric] || 0.05) * 100;
}

function estimateTimeline(metric, amount) {
  if (metric === 'reviewCount') {
    if (amount <= 10) return '2-4 weeks';
    if (amount <= 25) return '1-2 months';
    return '2-3 months';
  }
  if (metric === 'photoCount') return '1-2 weeks';
  if (metric === 'hasDescription' || metric === 'website' || metric === 'hasHours') return 'Immediate';
  return '1-4 weeks';
}

/**
 * Calculate opportunity score
 */
function calculateOpportunityScore(competitors, businessData, gapAnalysis) {
  if (!businessData) {
    return {
      score: 0,
      grade: { letter: 'N/A', label: 'No Data' },
      explanation: 'No business data provided for comparison'
    };
  }
  
  const yourStats = calculateYourStats(businessData);
  const topCompetitor = competitors[0];
  
  // Calculate opportunity factors
  const factors = {
    scoreGap: topCompetitor ? (100 - yourStats.overallScore) / 100 : 0.5,
    marketFragmentation: calculateMarketFragmentation(competitors),
    gapSeverity: Math.min(1, gapAnalysis.gaps.length / 10),
    quickWins: gapAnalysis.opportunities.filter(o => o.timeline.includes('Immediate') || o.timeline.includes('week')).length / 5
  };
  
  // Calculate opportunity score (higher = more opportunity)
  // Score is based on: how far behind you are, how fragmented the market is, and how many quick wins are available
  let score = Math.round(
    (factors.scoreGap * 30) +
    (factors.marketFragmentation * 25) +
    (factors.gapSeverity * 25) +
    (Math.min(1, factors.quickWins) * 20)
  );
  
  // Adjust for already strong businesses
  if (yourStats.overallScore >= 80) {
    score = Math.max(20, score - 30); // Less opportunity if already strong
  }
  
  score = Math.min(100, Math.max(0, score));
  
  let grade;
  if (score >= 75) grade = { letter: 'A', label: 'Excellent Opportunity', color: 'green' };
  else if (score >= 60) grade = { letter: 'B', label: 'Good Opportunity', color: 'blue' };
  else if (score >= 45) grade = { letter: 'C', label: 'Moderate Opportunity', color: 'yellow' };
  else if (score >= 30) grade = { letter: 'D', label: 'Limited Opportunity', color: 'orange' };
  else grade = { letter: 'F', label: 'Minimal Opportunity', color: 'red' };
  
  return {
    score,
    grade,
    factors,
    explanation: generateOpportunityExplanation(score, factors, yourStats, topCompetitor)
  };
}

function calculateMarketFragmentation(competitors) {
  // Calculate how spread out the competition is
  if (competitors.length < 5) return 0.3;
  
  const scores = competitors.slice(0, 10).map(c => c.overallScore);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
  
  // Higher variance = more fragmented = more opportunity
  return Math.min(1, variance / 500);
}

function generateOpportunityExplanation(score, factors, yourStats, topCompetitor) {
  if (score >= 75) {
    return `Significant opportunity to dominate this market. ${factors.quickWins > 0.5 ? 'Multiple quick wins available.' : 'Focus on core improvements.'}`;
  } else if (score >= 60) {
    return 'Good opportunity for improvement with focused effort on key gaps.';
  } else if (score >= 45) {
    return 'Moderate opportunity. Market is competitive but improvements are possible.';
  } else if (score >= 30) {
    return yourStats.overallScore >= 70 
      ? 'You\'re already performing well. Focus on maintaining position.'
      : 'Limited opportunity due to strong competition or market constraints.';
  } else {
    return yourStats.overallScore >= 80
      ? 'You\'re a market leader. Focus on defense and incremental gains.'
      : 'Market is highly competitive or saturated. Consider niche positioning.';
  }
}

/**
 * Generate strategic recommendations
 */
function generateStrategicRecommendations(competitors, gapAnalysis, opportunityScore) {
  const recommendations = [];
  
  // Priority 1: Critical gaps
  const criticalGaps = gapAnalysis.gaps.filter(g => g.priority === 'critical');
  if (criticalGaps.length > 0) {
    recommendations.push({
      priority: 'critical',
      category: 'Quick Wins',
      title: 'Address Critical Gaps',
      description: `Fix ${criticalGaps.length} critical gaps to see immediate improvement`,
      actions: criticalGaps.slice(0, 3).map(g => ({
        action: `Improve ${g.metric}`,
        current: g.yourValue,
        target: Math.ceil(g.competitorAvg * 1.1),
        timeline: estimateTimelineFromMetric(g.metric)
      })),
      expectedImpact: '15-25% visibility improvement',
      timeline: '2-4 weeks'
    });
  }
  
  // Priority 2: Top competitor analysis
  const top3 = competitors.slice(0, 3);
  const commonStrengths = findCommonStrengths(top3);
  
  if (commonStrengths.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'Competitive Intelligence',
      title: 'Adopt Top Competitor Strategies',
      description: 'Top performers share these strengths that you can replicate',
      actions: commonStrengths.slice(0, 3).map(s => ({
        action: s.action,
        example: s.example,
        expectedImpact: s.impact
      })),
      expectedImpact: '10-20% ranking improvement',
      timeline: '4-8 weeks'
    });
  }
  
  // Priority 3: Differentiation opportunities
  const differentiationOpps = findDifferentiationOpportunities(competitors, gapAnalysis);
  if (differentiationOpps.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'Differentiation',
      title: 'Stand Out from Competition',
      description: 'Areas where you can differentiate and capture market share',
      actions: differentiationOpps.slice(0, 3),
      expectedImpact: 'Unique positioning advantage',
      timeline: '6-12 weeks'
    });
  }
  
  // Priority 4: Long-term strategy
  if (opportunityScore.score >= 50) {
    recommendations.push({
      priority: 'medium',
      category: 'Long-term Growth',
      title: 'Market Leadership Strategy',
      description: 'Path to becoming the dominant player in this market',
      actions: [
        { action: 'Consistently publish Google Posts (2-3x weekly)', timeline: 'Ongoing' },
        { action: 'Build review generation system for steady growth', timeline: '30-60 days' },
        { action: 'Create FAQ section to capture more searches', timeline: '2-3 weeks' },
        { action: 'Develop local content strategy', timeline: '60-90 days' }
      ],
      expectedImpact: 'Market leader position within 6-12 months',
      timeline: '6-12 months'
    });
  }
  
  return recommendations;
}

function findCommonStrengths(topCompetitors) {
  const strengths = [];
  
  // Check for common patterns among top performers
  const avgRating = topCompetitors.reduce((sum, c) => sum + (c.rating || 0), 0) / topCompetitors.length;
  const avgReviews = topCompetitors.reduce((sum, c) => sum + (c.reviewCount || 0), 0) / topCompetitors.length;
  const avgPhotos = topCompetitors.reduce((sum, c) => sum + (c.photoCount || 0), 0) / topCompetitors.length;
  
  if (avgRating >= 4.5) {
    strengths.push({
      action: 'Maintain rating above 4.5 stars',
      example: `Top performers average ${avgRating.toFixed(1)} stars`,
      impact: 'Direct ranking factor'
    });
  }
  
  if (avgReviews >= 50) {
    strengths.push({
      action: 'Build review volume to 50+',
      example: `Top performers average ${Math.round(avgReviews)} reviews`,
      impact: 'Prominence signal'
    });
  }
  
  if (avgPhotos >= 20) {
    strengths.push({
      action: 'Maintain rich photo gallery (20+ photos)',
      example: `Top performers average ${Math.round(avgPhotos)} photos`,
      impact: 'Engagement & trust'
    });
  }
  
  return strengths;
}

function findDifferentiationOpportunities(competitors, gapAnalysis) {
  const opportunities = [];
  
  // Look for underserved areas
  const categories = {};
  competitors.forEach(c => {
    (c.types || []).forEach(type => {
      categories[type] = (categories[type] || 0) + 1;
    });
  });
  
  // If most competitors use the same category, suggest alternatives
  const categoryEntries = Object.entries(categories);
  if (categoryEntries.length > 0) {
    const mostCommon = categoryEntries.sort((a, b) => b[1] - a[1])[0];
    if (mostCommon[1] > competitors.length * 0.7) {
      opportunities.push(`Consider secondary category differentiation (most use: ${mostCommon[0]})`);
    }
  }
  
  // Check for missing attributes
  const withWebsite = competitors.filter(c => c.website).length;
  if (withWebsite < competitors.length * 0.8) {
    opportunities.push('Strong website presence can differentiate you');
  }
  
  return opportunities;
}

function estimateTimelineFromMetric(metric) {
  const timelines = {
    'Review Count': '4-8 weeks',
    'Rating': 'Ongoing',
    'Photo Count': '1-2 weeks',
    'Business Description': 'Immediate',
    'Website': '1-2 weeks',
    'Business Hours': 'Immediate'
  };
  return timelines[metric] || '2-4 weeks';
}

/**
 * Calculate market position
 */
function calculateMarketPosition(competitors, businessData) {
  if (!businessData) {
    return {
      position: 'unknown',
      tier: 'unknown',
      percentile: 0
    };
  }
  
  const yourScore = businessData.health_score || 50;
  const allScores = [...competitors.map(c => c.overallScore), yourScore].sort((a, b) => b - a);
  const yourRank = allScores.indexOf(yourScore) + 1;
  const percentile = Math.round(((allScores.length - yourRank + 1) / allScores.length) * 100);
  
  let tier;
  if (percentile >= 90) tier = 'Leader';
  else if (percentile >= 75) tier = 'Strong Competitor';
  else if (percentile >= 50) tier = 'Mid-tier';
  else if (percentile >= 25) tier = 'Challenger';
  else tier = 'New Entrant';
  
  return {
    position: yourRank,
    totalInMarket: allScores.length,
    tier,
    percentile,
    vsLeader: competitors[0] ? competitors[0].overallScore - yourScore : 0,
    vsAverage: Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) - yourScore
  };
}

/**
 * Analyze competitive landscape
 */
function analyzeCompetitiveLandscape(competitors) {
  const scores = competitors.map(c => c.overallScore);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  // Calculate competition intensity
  let intensity;
  if (avgScore >= 75) intensity = 'Very High - Established market with strong players';
  else if (avgScore >= 60) intensity = 'High - Active competition';
  else if (avgScore >= 45) intensity = 'Moderate - Room for growth';
  else intensity = 'Low - Emerging market';
  
  // Identify market leaders
  const leaders = competitors.filter(c => c.overallScore >= 80).slice(0, 3);
  
  // Calculate entry barriers
  const barriers = [];
  const avgReviews = competitors.reduce((sum, c) => sum + (c.reviewCount || 0), 0) / competitors.length;
  const avgRating = competitors.reduce((sum, c) => sum + (c.rating || 0), 0) / competitors.length;
  
  if (avgReviews >= 100) barriers.push('High review count expectations');
  if (avgRating >= 4.5) barriers.push('High quality standards');
  if (competitors.length >= 15) barriers.push('Saturated market');
  if (leaders.length >= 3) barriers.push('Established leaders');
  
  return {
    competitionIntensity: intensity,
    averageCompetitorScore: Math.round(avgScore),
    marketLeaders: leaders.map(l => ({
      name: l.name,
      score: l.overallScore,
      reviewCount: l.reviewCount
    })),
    entryBarriers: barriers.length > 0 ? barriers : ['Low barriers - Good time to enter'],
    marketMaturity: avgScore >= 70 ? 'Mature' : avgScore >= 50 ? 'Growing' : 'Emerging',
    consolidationPotential: competitors.length > 15 && avgScore > 60 ? 'High' : 'Moderate'
  };
}
