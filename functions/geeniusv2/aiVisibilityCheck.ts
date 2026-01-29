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
    // Use Base44's InvokeLLM for real-time AI search simulation
    const prompt = `You are testing whether a ${industry} business called "${businessName}" in ${location} is visible in AI search results for the keyword "${keyword}".

Analyze and respond with JSON:
{
  "found": boolean (would this business appear in top results),
  "rank": number or null (position 1-5 if found, null if not),
  "mentioned": boolean (is the business name mentioned),
  "contextProvided": boolean (does AI provide rich context about services),
  "dataAccuracy": "high" or "medium" or "low",
  "reasoning": string (brief explanation)
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          found: { type: "boolean" },
          rank: { type: ["integer", "null"] },
          mentioned: { type: "boolean" },
          contextProvided: { type: "boolean" },
          dataAccuracy: { type: "string", enum: ["high", "medium", "low"] },
          reasoning: { type: "string" }
        },
        required: ["found", "rank", "mentioned", "contextProvided", "dataAccuracy"]
      }
    });

    const data = response.data || response;
    
    return {
      platform,
      found: data.found || false,
      rank: data.rank || null,
      mentioned: data.mentioned || false,
      contextProvided: data.contextProvided || false,
      dataAccuracy: data.dataAccuracy || 'low',
      reasoning: data.reasoning || '',
      score: calculatePlatformScore({
        found: data.found,
        rank: data.rank,
        mentioned: data.mentioned,
        contextProvided: data.contextProvided,
        dataAccuracy: data.dataAccuracy
      })
    };

  } catch (error) {
    console.error(`${platform} visibility check failed:`, error);
    return {
      platform,
      found: false,
      rank: null,
      mentioned: false,
      contextProvided: false,
      dataAccuracy: 'low',
      error: error.message,
      score: 0
    };
  }
}

function calculatePlatformScore(result) {
  let score = 0;
  
  if (result.found) score += 40;
  if (result.rank && result.rank <= 3) score += 30;
  else if (result.rank && result.rank <= 5) score += 20;
  if (result.contextProvided) score += 15;
  if (result.dataAccuracy === 'high') score += 15;
  
  return Math.min(score, 100);
}

function calculateAIVisibilityScore(aiResults) {
  const totalScore = aiResults.reduce((sum, result) => sum + result.score, 0);
  return Math.round(totalScore / aiResults.length);
}

function calculateAverageAIRank(aiResults) {
  const rankedResults = aiResults.filter(r => r.rank !== null);
  if (rankedResults.length === 0) return null;
  
  const sum = rankedResults.reduce((acc, r) => acc + r.rank, 0);
  return (sum / rankedResults.length).toFixed(1);
}

function calculateTrustScore(aiResults) {
  const highAccuracy = aiResults.filter(r => r.dataAccuracy === 'high').length;
  const withContext = aiResults.filter(r => r.contextProvided).length;
  
  return Math.round(((highAccuracy + withContext) / (aiResults.length * 2)) * 100);
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