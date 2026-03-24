import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { keyword, location, currentRank, avgOrderValue } = await req.json();

    // Revenue Opportunity Algorithm
    // MSV × CTR_gain × CR × AOV = Monthly Opportunity
    
    const msv = await estimateMonthlySearchVolume(keyword, location);
    const currentCTR = getCTRByRank(currentRank);
    const targetCTR = getCTRByRank(1); // Target rank #1
    const ctrGain = targetCTR - currentCTR;
    const conversionRate = 0.08; // 8% industry standard for local services
    const aov = avgOrderValue || 300;

    const monthlyOpportunity = msv * ctrGain * conversionRate * aov;
    const annualOpportunity = monthlyOpportunity * 12;

    // Breakdown by rank improvement
    const rankBreakdown = [];
    for (let rank = currentRank - 1; rank >= 1; rank--) {
      const rankCTR = getCTRByRank(rank);
      const rankGain = rankCTR - currentCTR;
      const rankRevenue = msv * rankGain * conversionRate * aov;
      
      rankBreakdown.push({
        rank,
        ctr: (rankCTR * 100).toFixed(1),
        monthlyRevenue: Math.round(rankRevenue),
        annualRevenue: Math.round(rankRevenue * 12)
      });
    }

    return Response.json({
      success: true,
      data: {
        monthlySearchVolume: msv,
        currentRank,
        currentCTR: (currentCTR * 100).toFixed(1),
        targetRank: 1,
        targetCTR: (targetCTR * 100).toFixed(1),
        conversionRate: (conversionRate * 100).toFixed(1),
        avgOrderValue: aov,
        monthlyOpportunity: Math.round(monthlyOpportunity),
        annualOpportunity: Math.round(annualOpportunity),
        rankBreakdown,
        breakEvenMonths: calculateBreakEven(monthlyOpportunity)
      }
    });

  } catch (error) {
    console.error('Revenue opportunity calculation failed:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});

function getCTRByRank(rank) {
  // 2026 CTR data for Google Maps Pack
  const ctrMap = {
    1: 0.30,   // 30% CTR
    2: 0.15,   // 15% CTR
    3: 0.10,   // 10% CTR
    4: 0.06,
    5: 0.04,
    6: 0.03,
    7: 0.02,
    8: 0.015,
    9: 0.01,
    10: 0.008
  };
  
  return ctrMap[rank] || 0.005;
}

async function estimateMonthlySearchVolume(keyword, location) {
  // Estimate MSV based on industry benchmarks
  // In production, this would integrate with Google Keyword Planner API
  
  const industryMSV = {
    'junk removal': 3200,
    'plumber': 4500,
    'electrician': 3800,
    'hvac': 3500,
    'contractor': 2800,
    'roofer': 2200,
    'chiropractor': 1900,
    'dentist': 4200,
    'auto repair': 3600,
    'landscaping': 2400,
    'attorney': 3100
  };

  // Population modifier for location
  const populationModifier = getPopulationModifier(location);
  
  // Find matching industry
  const baseVolume = Object.keys(industryMSV).find(k => 
    keyword.toLowerCase().includes(k)
  );
  
  const msv = (industryMSV[baseVolume] || 2000) * populationModifier;
  
  return Math.round(msv);
}

function getPopulationModifier(location) {
  // Simplified population-based multiplier
  // Major metros: 1.5-2.0x
  // Mid-size cities: 1.0x
  // Small towns: 0.6x
  
  const majorMetros = ['new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio', 'san diego', 'dallas', 'miami'];
  const locationLower = location.toLowerCase();
  
  if (majorMetros.some(m => locationLower.includes(m))) {
    return 1.8;
  }
  
  return 1.0; // Default modifier
}

function calculateBreakEven(monthlyRevenue) {
  // Assuming $500-1500/month optimization cost
  const avgCost = 1000;
  return Math.ceil(avgCost / monthlyRevenue);
}