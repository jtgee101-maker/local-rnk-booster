import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function ProductionAuditV2() {
  const [expandedCategory, setExpandedCategory] = useState(null);

  const audit = {
    criticalIssues: [
      {
        category: "Mobile Responsiveness",
        severity: "high",
        items: [
          { issue: "FoxyAuditLanding - Hero headline text too small on mobile (<360px)", status: "pending", file: "pages/FoxyAuditLanding.js", line: 209 },
          { issue: "Industry cards grid breaks on small screens", status: "pending", file: "pages/FoxyAuditLanding.js", line: 338 },
          { issue: "CTA buttons not properly sized for mobile tap targets (min 44px)", status: "pending", file: "pages/FoxyAuditLanding.js", line: 222 },
          { issue: "QuizGeeniusV2 - Audit summary cards not stacking properly on mobile", status: "pending", file: "pages/QuizGeeniusV2.js", line: 381 },
          { issue: "Expandable sections have horizontal overflow on small devices", status: "pending", file: "components/foxyv2/ExpandableAuditSection.js" },
          { issue: "GeoHeatmapDisplay map container not responsive", status: "pending", file: "components/foxyv2/GeoHeatmapDisplay.js" },
        ]
      },
      {
        category: "Performance & Loading",
        severity: "high",
        items: [
          { issue: "Multiple large Foxy mascot images not optimized (same image loaded multiple times)", status: "pending", file: "Multiple files" },
          { issue: "No lazy loading on industry mascot images (8 images)", status: "pending", file: "pages/FoxyAuditLanding.js", line: 396 },
          { issue: "Animated background effects running continuously (high CPU usage)", status: "pending", file: "pages/QuizGeeniusV2.js", line: 248 },
          { issue: "No loading states for audit function calls", status: "pending", file: "pages/QuizGeeniusV2.js", line: 92 },
          { issue: "Missing error boundaries for audit sections", status: "partial", file: "pages/QuizGeeniusV2.js" },
        ]
      },
      {
        category: "User Experience",
        severity: "medium",
        items: [
          { issue: "No 'Back' button in audit results to restart quiz", status: "pending", file: "pages/QuizGeeniusV2.js" },
          { issue: "Missing 'Download PDF Report' functionality mentioned in CTA", status: "pending", file: "pages/QuizGeeniusV2.js" },
          { issue: "No email capture before showing full audit results", status: "pending", file: "pages/QuizGeeniusV2.js" },
          { issue: "Testimonial carousel auto-advances without pause on hover", status: "pending", file: "pages/FoxyAuditLanding.js", line: 26 },
          { issue: "No skip/fast-forward for processing animation", status: "pending", file: "components/quiz/ProcessingStepEnhanced.js" },
          { issue: "Sticky header viewers count updates too frequently (jarring)", status: "pending", file: "pages/FoxyAuditLanding.js", line: 20 },
        ]
      },
      {
        category: "Conversion Optimization",
        severity: "high",
        items: [
          { issue: "No exit-intent popup to capture abandoning users", status: "pending", file: "pages/FoxyAuditLanding.js" },
          { issue: "Missing A/B test tracking for CTA buttons", status: "pending", file: "Both pages" },
          { issue: "No social proof notifications (X just completed audit)", status: "pending", file: "Both pages" },
          { issue: "Final CTA has no urgency mechanism (scarcity, countdown)", status: "pending", file: "pages/QuizGeeniusV2.js", line: 579 },
          { issue: "No retargeting pixel integration", status: "pending", file: "Both pages" },
          { issue: "Missing price anchoring (was $997, now $497)", status: "pending", file: "pages/QuizGeeniusV2.js", line: 584 },
        ]
      },
      {
        category: "SEO & Metadata",
        severity: "medium",
        items: [
          { issue: "No meta title, description, OG tags", status: "pending", file: "Both pages" },
          { issue: "Missing structured data (LocalBusiness schema)", status: "pending", file: "Both pages" },
          { issue: "No canonical URLs set", status: "pending", file: "Both pages" },
          { issue: "Images missing alt text for accessibility", status: "pending", file: "Multiple files" },
          { issue: "No robots meta tag", status: "pending", file: "Both pages" },
        ]
      },
      {
        category: "Analytics & Tracking",
        severity: "medium",
        items: [
          { issue: "Quiz abandonment tracking incomplete", status: "partial", file: "pages/QuizGeeniusV2.js" },
          { issue: "No scroll depth tracking on landing page", status: "pending", file: "pages/FoxyAuditLanding.js" },
          { issue: "CTA click events not fully tracked", status: "pending", file: "Both pages" },
          { issue: "Time on audit results not tracked", status: "pending", file: "pages/QuizGeeniusV2.js" },
          { issue: "Section expansion events not tracked", status: "pending", file: "pages/QuizGeeniusV2.js" },
          { issue: "Error rates not logged to admin", status: "pending", file: "pages/QuizGeeniusV2.js" },
        ]
      },
      {
        category: "Error Handling",
        severity: "high",
        items: [
          { issue: "API failures show generic alert() instead of UI feedback", status: "pending", file: "pages/QuizGeeniusV2.js", line: 88 },
          { issue: "No retry mechanism for failed audit sections", status: "partial", file: "pages/QuizGeeniusV2.js", line: 408 },
          { issue: "User loses all data if they refresh during audit", status: "pending", file: "pages/QuizGeeniusV2.js" },
          { issue: "No graceful degradation if 1+ audit sections fail", status: "partial", file: "pages/QuizGeeniusV2.js" },
          { issue: "Missing timeout handling for slow API calls", status: "pending", file: "pages/QuizGeeniusV2.js" },
        ]
      },
      {
        category: "Accessibility",
        severity: "medium",
        items: [
          { issue: "Interactive elements missing ARIA labels", status: "pending", file: "Both pages" },
          { issue: "No focus indicators on buttons for keyboard navigation", status: "pending", file: "Both pages" },
          { issue: "Color contrast issues (lime green on white)", status: "pending", file: "Multiple components" },
          { issue: "No screen reader announcements for dynamic content", status: "pending", file: "pages/QuizGeeniusV2.js" },
          { issue: "Animations not respecting prefers-reduced-motion", status: "pending", file: "Both pages" },
        ]
      },
      {
        category: "Content & Copy",
        severity: "low",
        items: [
          { issue: "No FAQ section on FoxyAuditLanding", status: "pending", file: "pages/FoxyAuditLanding.js" },
          { issue: "Missing testimonial video embeds", status: "pending", file: "pages/FoxyAuditLanding.js" },
          { issue: "No case study proof (before/after screenshots)", status: "pending", file: "pages/FoxyAuditLanding.js" },
          { issue: "Pricing not clearly communicated upfront", status: "pending", file: "pages/FoxyAuditLanding.js" },
          { issue: "No guarantee/refund policy visible", status: "pending", file: "Both pages" },
        ]
      },
      {
        category: "Technical Debt",
        severity: "low",
        items: [
          { issue: "Hardcoded competitor data instead of real API", status: "pending", file: "pages/QuizGeeniusV2.js", line: 486 },
          { issue: "console.log statements left in production code", status: "pending", file: "pages/QuizGeeniusV2.js", line: 97 },
          { issue: "Session storage not cleared after completion", status: "pending", file: "Multiple components" },
          { issue: "No rate limiting on quiz submission", status: "pending", file: "Backend" },
          { issue: "Duplicate Foxy mascot image URLs (not centralized)", status: "pending", file: "Multiple files" },
        ]
      }
    ],
    successfulImplementations: [
      { item: "Error boundary implemented for quiz flow", file: "components/geenius/GeeniusErrorBoundary.js" },
      { item: "Cookie consent tracking in place", file: "components/tracking/CookieConsentTracker.js" },
      { item: "Progressive audit stages with loading indicators", file: "pages/QuizGeeniusV2.js" },
      { item: "Framer Motion animations for smooth transitions", file: "Both pages" },
      { item: "Dark theme with lime-green accents for brand consistency", file: "Both pages" },
      { item: "Expandable audit sections to reduce overwhelm", file: "pages/QuizGeeniusV2.js" },
    ]
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-500/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      case 'low': return 'border-blue-500 bg-blue-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'medium': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'low': return <AlertTriangle className="w-5 h-5 text-blue-400" />;
      default: return null;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'fixed':
        return <Badge className="bg-green-500 text-white">Fixed</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500 text-black">Partial</Badge>;
      case 'pending':
        return <Badge className="bg-gray-600 text-white">Pending</Badge>;
      default:
        return null;
    }
  };

  const totalIssues = audit.criticalIssues.reduce((sum, cat) => sum + cat.items.length, 0);
  const fixedIssues = audit.criticalIssues.reduce(
    (sum, cat) => sum + cat.items.filter(i => i.status === 'fixed').length, 
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-black mb-4">
            🚀 Production Readiness Audit
          </h1>
          <p className="text-gray-400 text-lg mb-6">
            FoxyAuditLanding + QuizGeeniusV2 Flow
          </p>
          
          {/* Progress Overview */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <Card className="bg-gray-900 border-2 border-gray-800 p-6">
              <div className="text-4xl font-black text-red-400 mb-2">{totalIssues}</div>
              <div className="text-gray-400 text-sm">Total Issues</div>
            </Card>
            <Card className="bg-gray-900 border-2 border-gray-800 p-6">
              <div className="text-4xl font-black text-green-400 mb-2">{fixedIssues}</div>
              <div className="text-gray-400 text-sm">Fixed</div>
            </Card>
            <Card className="bg-gray-900 border-2 border-gray-800 p-6">
              <div className="text-4xl font-black text-yellow-400 mb-2">
                {Math.round((fixedIssues / totalIssues) * 100)}%
              </div>
              <div className="text-gray-400 text-sm">Complete</div>
            </Card>
          </div>
        </div>

        {/* Critical Issues by Category */}
        <div className="space-y-4 mb-12">
          {audit.criticalIssues.map((category, idx) => (
            <Card key={idx} className={`border-2 ${getSeverityColor(category.severity)} p-6`}>
              <button
                onClick={() => setExpandedCategory(expandedCategory === idx ? null : idx)}
                className="w-full flex items-center justify-between mb-4"
              >
                <div className="flex items-center gap-3">
                  {getSeverityIcon(category.severity)}
                  <h3 className="text-xl font-bold text-white">{category.category}</h3>
                  <Badge className="bg-gray-800 text-white">
                    {category.items.length} issues
                  </Badge>
                </div>
                {expandedCategory === idx ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {expandedCategory === idx && (
                <div className="space-y-3">
                  {category.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <p className="text-gray-200 flex-1">{item.issue}</p>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {item.file} {item.line && `(line ${item.line})`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Successful Implementations */}
        <Card className="bg-gradient-to-r from-green-900/20 to-gray-900 border-2 border-green-500/30 p-6 mb-8">
          <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            Successfully Implemented
          </h3>
          <div className="space-y-2">
            {audit.successfulImplementations.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <span>{item.item}</span>
                  <span className="text-xs text-gray-500 ml-2">({item.file})</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Priority Roadmap */}
        <Card className="bg-gray-900 border-2 border-[#c8ff00]/30 p-8">
          <h3 className="text-2xl font-bold text-white mb-6">
            📋 Recommended Fix Order
          </h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-bold text-red-400 mb-3">🔥 Phase 1: Critical (Next 2 days)</h4>
              <ul className="space-y-2 text-gray-300 ml-6">
                <li>• Fix all mobile responsiveness issues (touch targets, overflow, text sizing)</li>
                <li>• Optimize image loading (lazy load, compress, dedupe URLs)</li>
                <li>• Implement proper error handling with UI feedback (no alert())</li>
                <li>• Add exit-intent popup for lead capture</li>
                <li>• Add meta tags and SEO basics</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold text-yellow-400 mb-3">⚡ Phase 2: Conversion (Week 1)</h4>
              <ul className="space-y-2 text-gray-300 ml-6">
                <li>• Add social proof notifications and urgency elements</li>
                <li>• Implement A/B test tracking framework</li>
                <li>• Add download PDF report feature</li>
                <li>• Improve CTA copy and price anchoring</li>
                <li>• Add FAQ section to landing page</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold text-blue-400 mb-3">🎯 Phase 3: Polish (Week 2)</h4>
              <ul className="space-y-2 text-gray-300 ml-6">
                <li>• Complete analytics and tracking</li>
                <li>• Accessibility improvements (ARIA, keyboard nav, contrast)</li>
                <li>• Performance optimization (reduce animations, lazy components)</li>
                <li>• Add back navigation and audit retry options</li>
                <li>• Clean up technical debt (console.logs, hardcoded data)</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Action Button */}
        <div className="mt-12 text-center">
          <Button
            size="lg"
            className="bg-[#c8ff00] hover:bg-[#b8ef00] text-gray-900 font-black text-xl px-12 py-8"
          >
            Start Phase 1 Fixes
          </Button>
          <p className="text-gray-500 text-sm mt-4">
            Estimated time to production: 5-7 days with focused execution
          </p>
        </div>
      </div>
    </div>
  );
}