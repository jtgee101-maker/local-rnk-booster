// Lightweight audit benchmark helper — all estimates are conservative and clearly labeled

export function getScoreInterpretation(score) {
  if (score <= 39) return {
    label: 'Your business has major ranking gaps',
    urgency: 'critical',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/40',
    bgColor: 'bg-red-500/10'
  };
  if (score <= 59) return {
    label: "You're underperforming — competitors are capturing your leads",
    urgency: 'high',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/40',
    bgColor: 'bg-orange-500/10'
  };
  if (score <= 79) return {
    label: "You're competitive, but not dominating your market",
    urgency: 'medium',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/40',
    bgColor: 'bg-yellow-500/10'
  };
  return {
    label: "Strong profile — focus on maintaining your lead",
    urgency: 'low',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/40',
    bgColor: 'bg-green-500/10'
  };
}

export function getBenchmarkComparison(score) {
  return {
    yourScore: score,
    marketBenchmark: 63,  // average well-maintained local business
    topPerformer: 88,     // top 10% estimate
    gap: Math.max(0, 63 - score)
  };
}

const INDUSTRY_DATA = {
  home_services: { searchRange: '1,200–4,500', leadsLow: 30, leadsHigh: 60 },
  medical:       { searchRange: '800–3,000',   leadsLow: 20, leadsHigh: 40 },
  retail:        { searchRange: '1,500–6,000', leadsLow: 40, leadsHigh: 75 },
  professional:  { searchRange: '600–2,000',   leadsLow: 15, leadsHigh: 35 },
  other:         { searchRange: '800–3,500',   leadsLow: 25, leadsHigh: 50 }
};

export function getOpportunityEstimate(score, businessCategory) {
  const data = INDUSTRY_DATA[businessCategory] || INDUSTRY_DATA.other;
  const loss = score >= 80 ? 0.12 : score >= 60 ? 0.30 : score >= 40 ? 0.55 : 0.75;
  return {
    missedLeadsLow: Math.round(data.leadsLow * loss),
    missedLeadsHigh: Math.round(data.leadsHigh * loss),
    monthlySearchRange: data.searchRange,
    captureRate: score >= 80 ? '65–80%' : score >= 60 ? '35–55%' : score >= 40 ? '12–28%' : '3–12%'
  };
}

// Issue severity detection from keyword matching
const SEVERITY_KEYWORDS = {
  high:   ['review', 'category', 'phone', 'hours', 'keyword', 'address', 'spam', 'duplicate', 'suspension'],
  medium: ['photo', 'website', 'citation', 'respond', 'description'],
};

const ISSUE_REASONS = {
  review:      "Reviews are Google's #1 local ranking signal",
  photo:       "Profiles with 50+ photos get 73% more direction requests",
  hours:       "Missing hours reduce your profile completeness score",
  website:     "No website link weakens your domain authority signal",
  category:    "Correct categories expand your keyword coverage significantly",
  keyword:     'Missing keywords = invisible for "near me" searches',
  citation:    "Inconsistent citations confuse Google about your location",
  phone:       "Missing phone number cuts your call conversion rate",
  address:     "Address issues cause Google to suppress your map listing",
  description: "A missing description loses 15% of keyword opportunities",
};

function detectSeverity(str) {
  const lower = str.toLowerCase();
  for (const k of SEVERITY_KEYWORDS.high)   if (lower.includes(k)) return 'high';
  for (const k of SEVERITY_KEYWORDS.medium) if (lower.includes(k)) return 'medium';
  return 'low';
}

function detectReason(str) {
  const lower = str.toLowerCase();
  for (const [key, reason] of Object.entries(ISSUE_REASONS)) {
    if (lower.includes(key)) return reason;
  }
  return 'Impacts local search ranking and click-through rate';
}

export function normalizeIssues(rawIssues) {
  if (!Array.isArray(rawIssues) || rawIssues.length === 0) return [];
  return rawIssues.map(issue => {
    if (typeof issue === 'string') {
      return { title: issue, severity: detectSeverity(issue), reason: detectReason(issue), fix: null };
    }
    if (issue && typeof issue === 'object') {
      const title = issue.title || issue.name || issue.issue || 'Profile Issue';
      return {
        title,
        severity: issue.severity || issue.priority || detectSeverity(title),
        reason: issue.description || issue.reason || detectReason(title),
        fix: issue.fix || issue.action || null
      };
    }
    return { title: String(issue), severity: 'medium', reason: 'Impacts local search ranking', fix: null };
  });
}

export function getQuickWins(lead) {
  const wins = [];
  if (!lead?.gmb_has_hours)
    wins.push({ title: 'Add complete business hours', impact: 'Boosts completeness score immediately' });
  if (!lead?.website)
    wins.push({ title: 'Link your website to your GMB profile', impact: 'Adds domain authority signal Google rewards' });
  if ((lead?.gmb_photos_count || 0) < 20)
    wins.push({ title: 'Upload 10+ professional photos', impact: '42% more direction requests on average' });
  if ((lead?.gmb_reviews_count || 0) < 25)
    wins.push({ title: 'Request reviews from recent customers', impact: 'Reviews are the #1 local ranking factor' });
  if ((lead?.gmb_types || []).length < 2)
    wins.push({ title: 'Add relevant service categories', impact: 'Expands your keyword reach by 3x' });
  wins.push({ title: 'Update description with local + service keywords', impact: 'Improves "near me" search visibility' });
  return wins.slice(0, 5);
}