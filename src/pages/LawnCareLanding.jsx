import React from 'react';
import { Helmet } from 'react-helmet';
import IndustryLandingTemplate from '@/components/landing/IndustryLandingTemplate';
import { Leaf, AlertCircle, DollarSign, MapPin, TrendingUp } from 'lucide-react';

export default function LawnCareLanding() {
  const config = {
    industry: 'lawn_care',
    badgeIcon: Leaf,
    badgeText: 'LAWN CARE SEO',
    badgeBg: 'bg-green-500/10',
    badgeBorder: 'border-green-500/30',
    badgeColor: 'text-green-400',
    accentGradient: 'from-green-500/20 to-emerald-500/20',
    accentText: 'text-green-400',
    
    headline: "Stop Losing Seasonal Revenue to",
    headlineHighlight: "National Lawn Care Franchises",
    subheadline: "78% of homeowners searching for 'lawn care near me' in spring call the first company they see. If you're not ranking, TruGreen and LandCare are eating your $15K+ annual accounts.",
    
    ctaText: 'Get Free Lawn Care Audit',
    secondaryCTA: 'View Your Rank',
    
    monthlyLoss: '18',
    painPointsIntro: 'Independent lawn care companies leave $200K+ on the table annually to national chains',
    
    painPoints: [
      {
        icon: DollarSign,
        title: "National Chains Outrank You",
        impact: "TruGreen and LandCare monopolize local searches",
        bgColor: 'bg-green-500/5',
        borderColor: 'border-green-500/30',
        iconColor: 'text-green-400',
        textColor: 'text-green-300'
      },
      {
        icon: AlertCircle,
        title: "Spring/Summer Rush Kills You",
        impact: "Seasonal surge = lost opportunities in peak season",
        bgColor: 'bg-green-500/5',
        borderColor: 'border-green-500/30',
        iconColor: 'text-green-400',
        textColor: 'text-green-300'
      },
      {
        icon: MapPin,
        title: "Customers Don't Find You",
        impact: "Low GMB visibility = low booking rate",
        bgColor: 'bg-green-500/5',
        borderColor: 'border-green-500/30',
        iconColor: 'text-green-400',
        textColor: 'text-green-300'
      },
      {
        icon: TrendingUp,
        title: "Poor Review Profile",
        impact: "New businesses have low review counts",
        bgColor: 'bg-green-500/5',
        borderColor: 'border-green-500/30',
        iconColor: 'text-green-400',
        textColor: 'text-green-300'
      }
    ],
    
    stats: [
      { value: '2.9x', label: 'More Lawn Care Jobs' },
      { value: '$16K', label: 'Seasonal Revenue Increase' },
      { value: '87%', label: 'Cheaper Than Franchises' }
    ],
    
    benefitsIntro: 'We show you exactly how to compete with and beat national franchises in local search',
    benefits: [
      "Why homeowners call TruGreen instead of you (and how to fix it)",
      "Critical GMB optimization that franchises miss",
      "Review generation strategy: 40+ 5-stars in 60 days",
      "Seasonal keywords competitors are bidding $30 CPM for (you can rank free)",
      "Service package positioning that gets $15K+ annual contracts",
      "Local dominance strategy that works spring, summer, fall and winter"
    ],
    
    testimonials: [
      {
        text: "We went from 2-3 signups per week to 12+. No longer fighting on price because we're showing up first.",
        author: "Michael Parks",
        business: "Parks Landscaping, Austin TX"
      },
      {
        text: "The franchise strategy was killing us. After the audit, we repositioned and now get $1,200/month accounts instead of $300.",
        author: "Jennifer Lee",
        business: "Sunrise Lawn Care, Portland OR"
      }
    ],
    
    finalCTAHeadline: "Get More High-Value Lawn Care Accounts",
    finalCTASubtext: "Free audit shows how to beat national franchises + capture seasonal revenue."
  };

  return (
    <>
      <Helmet>
        <title>Free GMB Audit for Lawn Care Companies | LocalRank.ai</title>
        <meta name="description" content="Stop losing seasonal revenue to national chains. Get found by homeowners searching for lawn care. Free AI audit shows how to beat franchises." />
        <meta name="keywords" content="lawn care marketing, landscaping leads, google my business lawn care, lawn care seo" />
      </Helmet>
      <IndustryLandingTemplate config={config} />
    </>
  );
}