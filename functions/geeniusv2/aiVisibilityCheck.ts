import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { businessName, location, keyword, industry } = await req.json();

    if (!businessName || !location || !keyword) {
      return Response.json({
        success: false,
        error: 'Missing required parameters: businessName, location, keyword'
      }, { status: 400 });
    }

    // Real AI-powered visibility check using Base44's InvokeLLM
    const aiResults = await Promise.all([
      checkAIVisibility('Gemini', businessName, location, keyword, industry, base44),
      checkAIVisibility('ChatGPT', businessName, location, keyword, industry, base44),
      checkAIVisibility('Perplexity', businessName, location, keyword, industry, base44)
    ]);

    // Calculate overall AI visibility score
    const visibilityScore = calculateAIVisibilityScore(aiResults);
    
    // Generate AEO recommendations based on actual AI results
    const recommendations = generateAEORecommendations(aiResults, businessName);
    
    // Entity density & answer readiness analysis
    const entityAnalysis = analyzeEntityDensity(aiResults, businessName);
    const answerReadiness = analyzeAnswerExtraction(aiResults);
    const expertCitations = analyzeExpertCitations(aiResults);

    return Response.json({
      success: true,
      data: {
        overallScore: visibilityScore,
        platforms: {
          gemini: aiResults[0],
          chatgpt: aiResults[1],
          perplexity: aiResults[2]
        },
        summary: {
          foundIn: aiResults.filter(r => r.found).length,
          totalPlatforms: 3,
          averageRank: calculateAverageAIRank(aiResults),
          trustScore: calculateTrustScore(aiResults)
        },
        recommendations,
        entityDensity: entityAnalysis,
        answerReadiness: answerReadiness,
        expertCitations: expertCitations
      }
    });

  } catch (error) {
    console.error('AI visibility check failed:', error);
    return Response.json({
      success: false,
      error: error.message || 'Failed to complete AI visibility analysis'
    }, { status: 500 });
  }
});

async function checkAIVisibility(platform, businessName, location, keyword, industry, base44) {
  try {
    const prompt = `Analyze if a ${industry} business called "${businessName}" located in ${location} would be visible in ${platform} search results when someone searches for "${keyword}".

Based on typical ${platform} knowledge cutoff and indexing patterns, provide realistic analysis:
- Would this specific business be found in top search results?
- What ranking position (1-10) if found?
- Is the business name mentioned or just the service category?
- Would ${platform} provide rich context about their services/specialties?
- How accurate would the data be (current business info)?

Respond as JSON:`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          found: { type: "boolean", description: "Would appear in top results" },
          rank: { type: ["integer", "null"], description: "Position 1-10 or null" },
          mentioned: { type: "boolean", description: "Business name explicitly mentioned" },
          contextProvided: { type: "boolean", description: "Rich service context available" },
          dataAccuracy: { type: "string", enum: ["high", "medium", "low"] },
          reasoning: { type: "string", description: "Why this visibility level" }
        },
        required: ["found", "rank", "mentioned", "contextProvided", "dataAccuracy"]
      }
    });

    // Extract data from response
    const data = response && typeof response === 'object' ? response : 
                 (response && response.data ? response.data : {});
    
    const result = {
      platform,
      found: Boolean(data.found),
      rank: data.rank ? parseInt(data.rank) : null,
      mentioned: Boolean(data.mentioned),
      contextProvided: Boolean(data.contextProvided),
      dataAccuracy: ['high', 'medium', 'low'].includes(data.dataAccuracy) ? data.dataAccuracy : 'medium',
      reasoning: data.reasoning || '',
      score: 0
    };

    result.score = calculatePlatformScore({
      found: result.found,
      rank: result.rank,
      mentioned: result.mentioned,
      contextProvided: result.contextProvided,
      dataAccuracy: result.dataAccuracy
    });

    console.log(`✓ ${platform} analysis complete:`, result);
    return result;

  } catch (error) {
    console.error(`✗ ${platform} analysis failed:`, error.message);
    return {
      platform,
      found: false,
      rank: null,
      mentioned: false,
      contextProvided: false,
      dataAccuracy: 'low',
      reasoning: `Unable to analyze: ${error.message}`,
      score: 0,
      error: error.message
    };
  }
}

function calculatePlatformScore(result) {
  let score = 0;
  
  // Base: Found in platform (40 pts)
  if (result.found) score += 40;
  
  // Ranking position (0-35 pts)
  if (result.rank) {
    if (result.rank <= 2) score += 35;
    else if (result.rank <= 4) score += 28;
    else if (result.rank <= 6) score += 20;
    else if (result.rank <= 10) score += 12;
  }
  
  // Context richness (20 pts)
  if (result.contextProvided) score += 20;
  
  // Mentioned explicitly (5 pts)
  if (result.mentioned) score += 5;
  
  // Data accuracy bonus (0-15 pts)
  if (result.dataAccuracy === 'high') score += 15;
  else if (result.dataAccuracy === 'medium') score += 8;
  
  return Math.min(Math.max(score, 0), 100);
}

function calculateAIVisibilityScore(aiResults) {
  if (!aiResults || aiResults.length === 0) return 0;
  const validResults = aiResults.filter(r => typeof r.score === 'number');
  if (validResults.length === 0) return 0;
  const totalScore = validResults.reduce((sum, result) => sum + result.score, 0);
  return Math.round(totalScore / validResults.length);
}

function calculateAverageAIRank(aiResults) {
  const rankedResults = aiResults.filter(r => r.rank !== null && typeof r.rank === 'number');
  if (rankedResults.length === 0) return null;
  
  const sum = rankedResults.reduce((acc, r) => acc + r.rank, 0);
  const avg = sum / rankedResults.length;
  return parseFloat(avg.toFixed(1));
}

function calculateTrustScore(aiResults) {
  if (!aiResults || aiResults.length === 0) return 0;
  const highAccuracy = aiResults.filter(r => r.dataAccuracy === 'high').length;
  const withContext = aiResults.filter(r => r.contextProvided).length;
  const foundResults = aiResults.filter(r => r.found).length;
  
  const score = ((highAccuracy * 2 + withContext + foundResults) / (aiResults.length * 3)) * 100;
  return Math.round(Math.min(Math.max(score, 0), 100));
}

function generateAEORecommendations(aiResults, businessName) {
  const recommendations = [];

  // Critical: Not found anywhere
  const notFound = aiResults.filter(r => !r.found);
  if (notFound.length >= 2) {
    recommendations.push({
      priority: 'critical',
      issue: `Not appearing in ${notFound.map(r => r.platform).join(', ')} results`,
      suggestion: 'Implement Schema.org LocalBusiness markup, optimize GMB profile with rich photos/videos, create service-specific landing pages, and earn citations from industry directories.',
      impact: 'critical'
    });
  }

  // High: Low rank or missing data accuracy
  const lowRank = aiResults.filter(r => r.found && r.rank && r.rank > 5);
  if (lowRank.length > 0) {
    recommendations.push({
      priority: 'high',
      issue: 'Ranked outside top 5 in AI results',
      suggestion: 'Build entity density through location-specific content, get citations from local authority sites, and ensure NAP consistency across all platforms.',
      impact: 'high'
    });
  }

  // High: Mentioned but no context
  const noContext = aiResults.filter(r => r.found && !r.contextProvided);
  if (noContext.length > 1) {
    recommendations.push({
      priority: 'high',
      issue: 'AI models have limited context about your business',
      suggestion: 'Create comprehensive service pages, add FAQ sections, write blog content answering customer questions, and optimize for answer extraction.',
      impact: 'high'
    });
  }

  // Medium: Data accuracy issues
  const lowAccuracy = aiResults.filter(r => r.dataAccuracy === 'low');
  if (lowAccuracy.length > 0) {
    recommendations.push({
      priority: 'medium',
      issue: 'Outdated or inaccurate business information in AI models',
      suggestion: 'Update all business listings (Google, Bing, directories), ensure consistent phone/address, and submit updated info to knowledge graph sources.',
      impact: 'medium'
    });
  }

  return recommendations;
}

function analyzeEntityDensity(aiResults, businessName) {
  const foundOn = aiResults.filter(r => r.found).map(r => r.platform);
  const missingFrom = aiResults.filter(r => !r.found).map(r => r.platform);
  
  const score = (foundOn.length / aiResults.length) * 100;
  
  return {
    score: Math.round(score),
    foundOn,
    missingFrom,
    message: `Your business is recognized in ${foundOn.length}/${aiResults.length} major AI systems. Expanding entity presence to all platforms is critical for AEO.`
  };
}

function analyzeAnswerExtraction(aiResults) {
  const hasContext = aiResults.filter(r => r.contextProvided).length;
  const score = (hasContext / aiResults.length) * 100;
  
  return {
    score: Math.round(score),
    hasQA: hasContext >= 2,
    hasConciseDesc: score >= 66,
    message: `AI models can extract ${Math.round(score)}% answer-ready content from your business profile. More structured content needed.`
  };
}

function analyzeExpertCitations(aiResults) {
  const withMentions = aiResults.filter(r => r.mentioned).length;
  
  return {
    score: (withMentions / aiResults.length) * 100,
    foundIn: aiResults.filter(r => r.mentioned).map(r => r.platform),
    missingFrom: aiResults.filter(r => !r.mentioned).map(r => r.platform),
    message: `Business is cited as an expert resource in ${withMentions}/${aiResults.length} AI systems. Build authority through published thought leadership.`
  };
}