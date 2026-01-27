import React from 'react';
import { Helmet } from 'react-helmet';
import IndustryLandingTemplate from '@/components/landing/IndustryLandingTemplate';
import { Droplets, AlertCircle, DollarSign, MapPin, TrendingUp } from 'lucide-react';

export default function PowerWashingLanding() {
  const config = {
    industry: 'power_washing',
    badgeIcon: Droplets,
    badgeText: 'POWER WASHING SEO',
    badgeBg: 'bg-blue-500/10',
    badgeBorder: 'border-blue-500/30',
    badgeColor: 'text-blue-400',
    accentGradient: 'from-blue-500/20 to-cyan-500/20',
    accentText: 'text-blue-400',
    
    headline: "Stop Leaving",
    headlineHighlight: "$30K+/Month on the Table",
    subheadline: "82% of homeowners searching for 'power washing near me' call the first company they see. If you're not on page 1, you're invisible to $5K+ jobs.",
    
    ctaText: 'Get Free Power Washing Audit',
    secondaryCTA: 'See Where You Rank',
    
    monthlyLoss: '30',
    painPointsIntro: 'Power washing businesses lose six figures annually while competitors steal local jobs',
    
    painPoints: [
      {
        icon: DollarSign,
        title: "Not Showing for Local Searches",
        impact: "Competitors 10 miles away rank above you",
        bgColor: 'bg-blue-500/5',
        borderColor: 'border-blue-500/30',
        iconColor: 'text-blue-400',
        textColor: 'text-blue-300'
      },
      {
        icon: AlertCircle,
        title: "Homeowners Choose First Results",
        impact: "They don't scroll past page 1 of Google",
        bgColor: 'bg-blue-500/5',
        borderColor: 'border-blue-500/30',
        iconColor: 'text-blue-400',
        textColor: 'text-blue-300'
      },
      {
        icon: MapPin,
        title: "Lost to Seasonal Competition",
        impact: "New companies outrank you in spring/summer",
        bgColor: 'bg-blue-500/5',
        borderColor: 'border-blue-500/30',
        iconColor: 'text-blue-400',
        textColor: 'text-blue-300'
      },
      {
        icon: TrendingUp,
        title: "Expensive Ad Spend",
        impact: "Paying $15-30 per Google Ads click",
        bgColor: 'bg-blue-500/5',
        borderColor: 'border-blue-500/30',
        iconColor: 'text-blue-400',
        textColor: 'text-blue-300'
      }
    ],
    
    stats: [
      { value: '3.2x', label: 'More Service Requests' },
      { value: '$24K', label: 'Monthly Revenue Increase' },
      { value: '92%', label: 'Cheaper Than Google Ads' }
    ],
    
    benefitsIntro: 'We analyze your actual Google My Business profile and map dominance strategy',
    benefits: [
      "Why you're not showing for high-value service area searches",
      "Which keywords profitable customers are using (that you're missing)",
      "Exact gaps in your profile vs. top-ranked competitors",
      "Your GMB Health Score vs. top power washing companies",
      "Proven review strategy to get 50+ 5-stars in 90 days",
      "How to rank for power washing near me without paid ads"
    ],
    
    testimonials: [
      {
        text: "We went from 8-10 jobs per week to 32 in our first month. Dominating local search, barely any ad spend now.",
        author: "David Thompson",
        business: "Thompson Power Washing, Phoenix AZ"
      },
      {
        text: "Your audit showed I was missing 'pressure washing' keywords completely. Fixed it, now I'm #1 in my area.",
        author: "Lisa Martinez",
        business: "Crystal Clean Services, Denver CO"
      }
    ],
    
    finalCTAHeadline: "Get More High-Ticket Power Washing Jobs",
    finalCTASubtext: "Takes 90 seconds. See exactly why homeowners pick your competitors instead of you."
  };

  return (
    <>
      <Helmet>
        <title>Free GMB Audit for Power Washing Companies | LocalRank.ai</title>
        <meta name="description" content="Stop losing $30K/month to local competitors. Get found first by homeowners searching for power washing. Free AI audit reveals ranking gaps." />
        <meta name="keywords" content="power washing marketing, pressure washing leads, google my business power washing, power washing seo" />
      </Helmet>
      <IndustryLandingTemplate config={config} />
    </>
  );
}