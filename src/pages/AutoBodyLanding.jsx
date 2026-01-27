import React from 'react';
import { Helmet } from 'react-helmet';
import IndustryLandingTemplate from '@/components/landing/IndustryLandingTemplate';
import { Wrench, AlertCircle, DollarSign, MapPin, TrendingUp } from 'lucide-react';

export default function AutoBodyLanding() {
  const config = {
    industry: 'auto_body',
    badgeIcon: Wrench,
    badgeText: 'AUTO BODY SHOP SEO',
    badgeBg: 'bg-orange-500/10',
    badgeBorder: 'border-orange-500/30',
    badgeColor: 'text-orange-400',
    accentGradient: 'from-orange-500/20 to-red-500/20',
    accentText: 'text-orange-400',
    
    headline: "Stop Losing Collision Repairs to",
    headlineHighlight: "Insurance-Referred Competitors",
    subheadline: "85% of accident victims search 'auto body near me' on their phone right after the crash. If you're not there, insurance companies & dealerships are getting your $8K+ repairs.",
    
    ctaText: 'Get Free Auto Body Audit',
    secondaryCTA: 'See Your Ranking Now',
    
    monthlyLoss: '45',
    painPointsIntro: 'Independent auto body shops lose hundreds of thousands every year to insurance networks and dealerships',
    
    painPoints: [
      {
        icon: DollarSign,
        title: "Insurance Steering You Out",
        impact: "Getting 1-2 referrals vs. thousands you could get",
        bgColor: 'bg-orange-500/5',
        borderColor: 'border-orange-500/30',
        iconColor: 'text-orange-400',
        textColor: 'text-orange-300'
      },
      {
        icon: AlertCircle,
        title: "Accident Victims Find Dealerships First",
        impact: "They're ranking higher for accident-related searches",
        bgColor: 'bg-orange-500/5',
        borderColor: 'border-orange-500/30',
        iconColor: 'text-orange-400',
        textColor: 'text-orange-300'
      },
      {
        icon: MapPin,
        title: "Low Review Score",
        impact: "Customers see your 3.8 stars vs. competitors' 4.7+",
        bgColor: 'bg-orange-500/5',
        borderColor: 'border-orange-500/30',
        iconColor: 'text-orange-400',
        textColor: 'text-orange-300'
      },
      {
        icon: TrendingUp,
        title: "Missing Local Search Traffic",
        impact: "Losing $200K+ annually in direct Google leads",
        bgColor: 'bg-orange-500/5',
        borderColor: 'border-orange-500/30',
        iconColor: 'text-orange-400',
        textColor: 'text-orange-300'
      }
    ],
    
    stats: [
      { value: '4.1x', label: 'More Collision Leads' },
      { value: '$52K', label: 'Monthly Revenue Increase' },
      { value: '3.8x', label: 'Higher Booking Rate' }
    ],
    
    benefitsIntro: 'We analyze your Google My Business against local competitors and insurance networks',
    benefits: [
      "Why accident victims don't see your shop (even when they're searching nearby)",
      'The 4 critical GMB gaps dealerships are exploiting',
      'Review strategy that got top shops from 3.8 → 4.7 stars in 90 days',
      'Insurance network keywords you should be ranking for',
      'How to beat dealership financing offers in local search',
      'Exact positioning to win direct Google/Maps leads (no insurance middleman)'
    ],
    
    testimonials: [
      {
        text: "We were doing 8-10 jobs a month. Now we're at 28, mostly direct from Google. Insurance referrals are bonus now.",
        author: "James Rodriguez",
        business: "Rodriguez Auto Body, Los Angeles CA"
      },
      {
        text: "Your audit showed we were invisible for 'auto body collision' searches. Fixed our GMB in one week, started getting calls immediately.",
        author: "Sarah Bennett",
        business: "Premium Auto Repair, Miami FL"
      }
    ],
    
    finalCTAHeadline: "Own Your Local Collision Market",
    finalCTASubtext: "Free audit shows why dealerships are getting your accident victims + exactly how to beat them."
  };

  return (
    <>
      <Helmet>
        <title>Free GMB Audit for Auto Body Shops | LocalRank.ai</title>
        <meta name="description" content="Stop losing collision repair jobs to dealerships. Get found by accident victims searching for auto body shops. Free AI audit reveals why you're invisible." />
        <meta name="keywords" content="auto body marketing, collision repair leads, auto body shop seo, local seo auto body" />
      </Helmet>
      <IndustryLandingTemplate config={config} />
    </>
  );
}