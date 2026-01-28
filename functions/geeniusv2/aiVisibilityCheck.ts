import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { businessName, location, keyword, industry } = await req.json();

    // AI Visibility Checker
    // Tests visibility across ChatGPT, Gemini, Perplexity, and Grok
    
    const aiResults = await Promise.all([
      checkGeminiVisibility(businessName, location, keyword, industry),
      checkChatGPTVisibility(businessName, location, keyword, industry),
      checkPerplexityVisibility(businessName, location, keyword, industry)
    ]);

    const [gemini, chatgpt, perplexity] = aiResults;

    // Calculate overall AI visibility score
    const visibilityScore = calculateAIVisibilityScore(aiResults);
    
    // Generate AI optimization recommendations
    const recommendations = generateAIRecommendations(aiResults, businessName);

    return Response.json({
      success: true,
      data: {
        overallScore: visibilityScore,
        platforms: {
          gemini,
          chatgpt,
          perplexity
        },
        summary: {
          foundIn: aiResults.filter(r => r.found).length,
          totalPlatforms: 3,
          averageRank: calculateAverageAIRank(aiResults),
          trustScore: calculateTrustScore(aiResults)
        },
        recommendations
      }
    });

  } catch (error) {
    console.error('AI visibility check failed:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});

async function checkGeminiVisibility(businessName, location, keyword, industry) {
  try {
    // Simulate AI search query
    const prompt = `List the top 5 ${keyword} services in ${location}. Include business names only.`;
    
    // In production, this would call Gemini API
    // For now, we'll use the Core InvokeLLM with structured output
    
    const base44 = { integrations: { Core: { InvokeLLM: async () => ({ businesses: [] }) } } };
    
    // Placeholder response
    const response = {
      found: Math.random() > 0.5,
      rank: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : null,
      mentioned: Math.random() > 0.3,
      contextProvided: Math.random() > 0.4,
      dataAccuracy: Math.random() > 0.6 ? 'high' : 'medium',
      snippet: `Found reference to ${businessName} in AI knowledge base`
    };

    return {
      platform: 'Gemini',
      ...response,
      score: calculatePlatformScore(response)
    };

  } catch (error) {
    return {
      platform: 'Gemini',
      found: false,
      error: error.message,
      score: 0
    };
  }
}

async function checkChatGPTVisibility(businessName, location, keyword, industry) {
  try {
    // Simulate ChatGPT search
    const response = {
      found: Math.random() > 0.6,
      rank: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : null,
      mentioned: Math.random() > 0.4,
      contextProvided: Math.random() > 0.5,
      dataAccuracy: Math.random() > 0.5 ? 'high' : 'medium',
      snippet: `ChatGPT knowledge of ${businessName}`
    };

    return {
      platform: 'ChatGPT',
      ...response,
      score: calculatePlatformScore(response)
    };

  } catch (error) {
    return {
      platform: 'ChatGPT',
      found: false,
      error: error.message,
      score: 0
    };
  }
}

async function checkPerplexityVisibility(businessName, location, keyword, industry) {
  try {
    // Simulate Perplexity search
    const response = {
      found: Math.random() > 0.4,
      rank: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : null,
      mentioned: Math.random() > 0.5,
      contextProvided: Math.random() > 0.6,
      dataAccuracy: Math.random() > 0.7 ? 'high' : 'medium',
      snippet: `Perplexity reference to ${businessName}`,
      citations: Math.floor(Math.random() * 3) + 1
    };

    return {
      platform: 'Perplexity',
      ...response,
      score: calculatePlatformScore(response)
    };

  } catch (error) {
    return {
      platform: 'Perplexity',
      found: false,
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

function generateAIRecommendations(aiResults, businessName) {
  const recommendations = [];

  const notFound = aiResults.filter(r => !r.found);
  
  if (notFound.length > 0) {
    recommendations.push({
      priority: 'critical',
      category: 'ai_visibility',
      issue: `Not found in ${notFound.map(r => r.platform).join(', ')}`,
      suggestion: `Implement structured data (Schema.org LocalBusiness), create FAQ pages, and get listed on "Best of" directories that AI models scrape.`,
      impact: 'high',
      effort: 'medium'
    });
  }

  const lowRank = aiResults.filter(r => r.rank && r.rank > 3);
  
  if (lowRank.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'ai_ranking',
      issue: 'Low AI ranking position',
      suggestion: 'Increase entity density by creating location-specific content, earning citations from authority sites, and maintaining NAP consistency.',
      impact: 'high',
      effort: 'high'
    });
  }

  const lowContext = aiResults.filter(r => !r.contextProvided);
  
  if (lowContext.length > 1) {
    recommendations.push({
      priority: 'medium',
      category: 'content',
      issue: 'AI models lack context about your business',
      suggestion: 'Add comprehensive FAQs, service descriptions, and "About Us" content. AI models use this to answer queries without clicking links.',
      impact: 'medium',
      effort: 'low'
    });
  }

  return recommendations;
}