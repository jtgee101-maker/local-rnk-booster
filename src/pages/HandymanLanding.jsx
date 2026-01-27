import React from 'react';
import { Helmet } from 'react-helmet';
import IndustryLandingTemplate from '@/components/landing/IndustryLandingTemplate';
import { Hammer, AlertCircle, DollarSign, MapPin, TrendingUp } from 'lucide-react';

export default function HandymanLanding() {
  const config = {
    industry: 'handyman',
    badgeIcon: Hammer,
    badgeText: 'HANDYMAN SEO',
    badgeBg: 'bg-amber-500/10',
    badgeBorder: 'border-amber-500/30',
    badgeColor: 'text-amber-400',
    accentGradient: 'from-amber-500/20 to-yellow-500/20',
    accentText: 'text-amber-400',
    
    headline: "Stop Fighting on Price With",
    headlineHighlight: "Unlicensed Competitors",
    subheadline: "81% of homeowners searching for 'handyman near me' call the first 3 results. If you're not visible, uninsured handymen are getting your $2K+ jobs.",
    
    ctaText: 'Get Free Handyman Audit',
    secondaryCTA: 'Check Your Ranking',
    
    monthlyLoss: '22',
    painPointsIntro: 'Legitimate handymen undercut themselves because they can't get found online',
    
    painPoints: [
      {
        icon: DollarSign,
        title: "Competing on Price, Not Quality",
        impact: "Can't justify premium rates when invisible",
        bgColor: 'bg-amber-500/5',
        borderColor: 'border-amber-500/30',
        iconColor: 'text-amber-400',
        textColor: 'text-amber-300'
      },
      {
        icon: AlertCircle,
        title: "Uninsured Competitors Rank Higher",
        impact: "Cheaper operations beat your legitimacy",
        bgColor: 'bg-amber-500/5',
        borderColor: 'border-amber-500/30',
        iconColor: 'text-amber-400',
        textColor: 'text-amber-300'
      },
      {
        icon: MapPin,
        title: "Low Online Credibility",
        impact: "Homeowners want to see reviews before hiring",
        bgColor: 'bg-amber-500/5',
        borderColor: 'border-amber-500/30',
        iconColor: 'text-amber-400',
        textColor: 'text-amber-300'
      },
      {
        icon: TrendingUp,
        title: "No Local Search Presence",
        impact: "Missing $1K+ jobs every month",
        bgColor: 'bg-amber-500/5',
        borderColor: 'border-amber-500/30',
        iconColor: 'text-amber-400',
        textColor: 'text-amber-300'
      }
    ],
    
    stats: [
      { value: '3.4x', label: 'More Quality Leads' },
      { value: '$8K', label: 'Monthly Revenue Increase' },
      { value: '$2.3K', label: 'Higher Average Job Value' }
    ],
    
    benefitsIntro: 'We show you how to position your licensed, insured business above competitors',
    benefits: [
      "Why homeowners pick cheaper, uninsured handymen (and how to beat that)",
      "Credibility positioning that gets you premium rates",
      "How to get 30+ verified reviews (builds trust vs. competitors)",
      "The exact keywords homeowners use when they WANT quality (not price)",
      "Service area strategy that dominates your neighborhood",
      "Insurance positioning that justifies your higher prices"
    ],
    
    testimonials: [
      {
        text: "Went from $1,200/week to $4,500. Now I'm the trusted option instead of fighting price wars.",
        author: "Tom Wilson",
        business: "Wilson Handyman Services, Chicago IL"
      },
      {
        text: "Being licensed and insured finally matters again. Customers seek me out now instead of me chasing them.",
        author: "Carlos Mendez",
        business: "Reliable Handyman, Houston TX"
      }
    ],
    
    finalCTAHeadline: "Charge Premium Rates Again",
    finalCTASubtext: "Free audit shows how to beat uninsured competitors + attract customers who value quality."
  };

  return (
    <>
      <Helmet>
        <title>Free GMB Audit for Handymen | LocalRank.ai</title>
        <meta name="description" content="Stop competing on price with uninsured handymen. Get found by quality-conscious homeowners. Free AI audit reveals how to charge premium rates." />
        <meta name="keywords" content="handyman marketing, handyman leads, google my business handyman, handyman seo" />
      </Helmet>
      <IndustryLandingTemplate config={config} />
    </>
  );
}