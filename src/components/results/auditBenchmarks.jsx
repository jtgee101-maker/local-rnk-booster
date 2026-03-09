// Pure helper — no React dependency

export function getScoreBand(score) {
  if (score >= 80) return {
    label: 'Strong', colorClass: 'text-green-400', bgClass: 'bg-green-500/10', borderClass: 'border-green-500/30',
    interpretation: "You're competitive, but not yet dominating your local market.",
    urgency: 'low'
  };
  if (score >= 60) return {
    label: 'Underperforming', colorClass: 'text-yellow-400', bgClass: 'bg-yellow-500/10', borderClass: 'border-yellow-500/30',
    interpretation: "You're close, but key ranking signals are missing — competitors are pulling ahead.",
    urgency: 'medium'
  };
  if (score >= 40) return {
    label: 'At Risk', colorClass: 'text-orange-400', bgClass: 'bg-orange-500/10', borderClass: 'border-orange-500/30',
    interpretation: "Your business has significant local ranking gaps that are costing you leads.",
    urgency: 'high'
  };
  return {
    label: 'Critical', colorClass: 'text-red-400', bgClass: 'bg-red-500/10', borderClass: 'border-red-500/30',
    interpretation: "Your business has major visibility problems. You are nearly invisible in local search.",
    urgency: 'critical'
  };
}

export function getBenchmarkData(score) {
  return {
    yourScore: score,
    benchmarkScore: 62,  // local market average
    topScore: 87,        // estimated top local competitor
    gap: Math.max(0, 62 - score),
    topGap: Math.max(0, 87 - score)
  };
}

export function getOpportunityEstimate(score, category = 'other') {
  const monthlySearches = {
    home_services: 850, medical: 620, retail: 480, professional: 390, other: 500
  }[category] || 500;

  // Top 3 results capture ~58% of clicks; scale by current score
  const topShareRatio = 0.58;
  const currentShareRatio = (score / 100) * topShareRatio;
  const missedRatio = Math.max(0, topShareRatio - currentShareRatio);
  const missedClicks = Math.round(monthlySearches * missedRatio);

  const leadsLow = Math.max(5, Math.round(missedClicks * 0.05));
  const leadsHigh = Math.max(20, Math.round(missedClicks * 0.12));

  let urgencyLabel;
  if (score < 40) urgencyLabel = 'Critical Revenue Impact';
  else if (score < 60) urgencyLabel = 'Significant Monthly Losses';
  else if (score < 80) urgencyLabel = 'Notable Growth Gap';
  else urgencyLabel = 'Optimization Upside';

  return { leadsLow, leadsHigh, urgencyLabel, monthlySearches };
}

export function normalizeCriticalIssues(issues) {
  if (!Array.isArray(issues)) return [];

  const getSeverity = (text) => {
    const t = text.toLowerCase();
    if (t.includes('missing') || t.includes('no reviews') || t.includes('incomplete') ||
        t.includes('not verified') || t.includes('closed') || t.includes('suspended') ||
        t.includes('critical') || t.includes('no ')) return 'high';
    if (t.includes('few') || t.includes('low') || t.includes('outdated') ||
        t.includes('inconsistent') || t.includes('keyword') || t.includes('weak')) return 'medium';
    return 'low';
  };

  const getWhy = (text) => {
    const t = text.toLowerCase();
    if (t.includes('review')) return 'Reviews are the #1 trust factor in local map rankings';
    if (t.includes('photo')) return 'Photo-rich profiles get 42% more direction requests';
    if (t.includes('keyword')) return 'Missing keywords means missing search queries entirely';
    if (t.includes('hour')) return 'Incomplete profiles are penalized in local pack rankings';
    if (t.includes('website')) return 'No website link reduces click-through from your profile';
    if (t.includes('category')) return 'Categories determine which searches your profile surfaces for';
    if (t.includes('citation') || t.includes('nap')) return 'Inconsistent citations confuse Google and reduce authority';
    return 'This gap is directly lowering your local ranking position';
  };

  const getFix = (text) => {
    const t = text.toLowerCase();
    if (t.includes('review')) return 'Set up automated review requests via SMS';
    if (t.includes('photo')) return 'Upload 10 professional photos this week';
    if (t.includes('keyword')) return 'Rewrite business description with target service keywords';
    if (t.includes('hour')) return 'Add hours in Google Business Profile manager';
    if (t.includes('website')) return 'Link your website URL to your GMB profile';
    return 'Update directly in your Google Business Profile dashboard';
  };

  return issues.map(issue => {
    if (typeof issue === 'string') {
      return { title: issue, severity: getSeverity(issue), why: getWhy(issue), quickFix: getFix(issue) };
    }
    const title = issue.title || issue.name || issue.issue || String(issue);
    return {
      title,
      severity: issue.severity || 'medium',
      why: issue.why || issue.description || getWhy(title),
      quickFix: issue.quickFix || issue.fix || getFix(title)
    };
  });
}

export function getQuickWins(lead) {
  const wins = [];
  if (!lead?.gmb_has_hours)
    wins.push({ title: 'Set Business Hours', impact: 'High', description: 'Missing hours hides you in time-filtered searches and hurts trust' });
  if ((lead?.gmb_photos_count || 0) < 15)
    wins.push({ title: 'Upload 10+ Photos', impact: 'High', description: 'Photo-rich profiles earn significantly more calls and direction requests' });
  if ((lead?.gmb_reviews_count || 0) < 20)
    wins.push({ title: 'Start Review Velocity Campaign', impact: 'High', description: 'Systematic review requests can 3× your review count within weeks' });
  if (!lead?.website)
    wins.push({ title: 'Add Website Link', impact: 'Medium', description: 'Profiles with websites get 25–35% more clicks from search results' });
  wins.push({ title: 'Optimize Business Description', impact: 'Medium', description: 'Keyword-rich descriptions improve how Google matches your profile to searches' });
  if ((lead?.gmb_types?.length || 0) < 2)
    wins.push({ title: 'Expand Service Categories', impact: 'Medium', description: 'More categories expand which keyword searches your profile appears in' });
  return wins.slice(0, 5);
}