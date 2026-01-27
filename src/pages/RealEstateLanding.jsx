import React from 'react';
import { Helmet } from 'react-helmet';
import IndustryLandingTemplate from '@/components/landing/IndustryLandingTemplate';
import { Home, AlertCircle, DollarSign, MapPin, TrendingUp } from 'lucide-react';

export default function RealEstateLanding() {

  const config = {
    industry: 'real_estate',
    badgeIcon: Home,
    badgeText: 'REAL ESTATE SEO',
    badgeBg: 'bg-purple-500/10',
    badgeBorder: 'border-purple-500/30',
    badgeColor: 'text-purple-400',
    accentGradient: 'from-purple-500/20 to-pink-500/20',
    accentText: 'text-purple-400',
    
    headline: "Stop Losing Listings to",
    headlineHighlight: "Zillow & Big Brokerages",
    subheadline: "82% of buyers & sellers search for local agents on Google. If you're not on page 1, you're invisible to motivated clients who could be closing $5K+ commissions.",
    
    ctaText: 'Get Free Agent Audit',
    secondaryCTA: 'See Where You Rank',
    
    monthlyLoss: '18',
    painPointsIntro: 'Real estate agents leave $240K+ annually in commissions to brokerages that dominate local search',
    
    painPoints: [
      {
        icon: AlertCircle,
        title: "Not Showing for Local Searches",
        impact: "Lost to Zillow and Redfin",
        bgColor: 'bg-red-500/5',
        borderColor: 'border-red-500/30',
        iconColor: 'text-red-400',
        textColor: 'text-red-300'
      },
      {
        icon: MapPin,
        title: "Buried Below Mega-Brokerages",
        impact: "Missing buyer and seller leads",
        bgColor: 'bg-red-500/5',
        borderColor: 'border-red-500/30',
        iconColor: 'text-red-400',
        textColor: 'text-red-300'
      },
      {
        icon: AlertCircle,
        title: "Low Online Presence",
        impact: "Sellers pick competitors instead",
        bgColor: 'bg-red-500/5',
        borderColor: 'border-red-500/30',
        iconColor: 'text-red-400',
        textColor: 'text-red-300'
      },
      {
        icon: TrendingUp,
        title: "Few Reviews vs. Top Agents",
        impact: "Customers lose credibility in you",
        bgColor: 'bg-red-500/5',
        borderColor: 'border-red-500/30',
        iconColor: 'text-red-400',
        textColor: 'text-red-300'
      }
    ],
    
    stats: [
      { value: '285%', label: 'More Qualified Leads' },
      { value: '$240K', label: 'Avg Annual Commission Increase' },
      { value: '4.2x', label: 'More Listing Appointments' }
    ],
    
    benefitsIntro: 'We show you how to dominate local real estate searches in your farm area',
    benefits: [
      "Rank #1 for '[neighborhood] real estate agent' searches",
      "Dominate local Map Pack in your farm area",
      "Get more qualified buyer & seller leads",
      "Build trust with verified client testimonials",
      "Optimize for mobile (80% of homebuyers search mobile)",
      "Stand out from 100+ competing agents in your area"
    ],
    
    testimonials: [
      {
        text: "I went from 2-3 listings a month to 12+. Now I'm the first agent homeowners see when they search for help in our neighborhood.",
        author: "Jennifer Martinez",
        business: "Top Producer, Keller Williams, Austin TX"
      },
      {
        text: "Went from getting 1 listing a week to 3-4. Buyers and sellers find me directly through Google now.",
        author: "Robert Chen",
        business: "RE/MAX, San Francisco CA"
      }
    ],
    
    finalCTAHeadline: "Own Your Local Real Estate Market",
    finalCTASubtext: "Free audit shows exactly where you're invisible + how to dominate your area for listings & buyers."
  };

  return (
    <>
      <Helmet>
        <title>Free GMB Audit for Real Estate Agents | LocalRank.ai</title>
        <meta name="description" content="Stop losing listings to Zillow and big brokerages. Get found first by buyers and sellers. Free AI audit reveals your ranking gaps." />
        <meta name="keywords" content="real estate marketing, real estate seo, real estate leads, google my business realtors" />
      </Helmet>
      <IndustryLandingTemplate config={config} />
}