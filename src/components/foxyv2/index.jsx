import React, { lazy, Suspense } from 'react';

// Loading fallback for audit sections
const SectionLoader = () => (
  <div className="flex items-center justify-center h-[200px] w-full">
    <div className="w-6 h-6 border-4 border-slate-700 border-t-[#c8ff00] rounded-full animate-spin"></div>
  </div>
);

// Lazy load heavy audit components
const FoxyHealthScoreLazy = lazy(() => import('./FoxyHealthScore'));
const RevenueLeakCalculatorLazy = lazy(() => import('./RevenueLeakCalculator'));
const GeoHeatmapDisplayLazy = lazy(() => import('./GeoHeatmapDisplay'));
const AIVisibilityReportLazy = lazy(() => import('./AIVisibilityReport'));
const CompetitorComparisonLazy = lazy(() => import('./CompetitorComparison'));
const ActionRoadmapLazy = lazy(() => import('./ActionRoadmap'));
const InteractiveROICalculatorLazy = lazy(() => import('./InteractiveROICalculator'));

// Wrapper components with Suspense
export function FoxyHealthScore(props) {
  return (
    <Suspense fallback={<SectionLoader />}>
      <FoxyHealthScoreLazy {...props} />
    </Suspense>
  );
}

export function RevenueLeakCalculator(props) {
  return (
    <Suspense fallback={<SectionLoader />}>
      <RevenueLeakCalculatorLazy {...props} />
    </Suspense>
  );
}

export function GeoHeatmapDisplay(props) {
  return (
    <Suspense fallback={<SectionLoader />}>
      <GeoHeatmapDisplayLazy {...props} />
    </Suspense>
  );
}

export function AIVisibilityReport(props) {
  return (
    <Suspense fallback={<SectionLoader />}>
      <AIVisibilityReportLazy {...props} />
    </Suspense>
  );
}

export function CompetitorComparison(props) {
  return (
    <Suspense fallback={<SectionLoader />}>
      <CompetitorComparisonLazy {...props} />
    </Suspense>
  );
}

export function ActionRoadmap(props) {
  return (
    <Suspense fallback={<SectionLoader />}>
      <ActionRoadmapLazy {...props} />
    </Suspense>
  );
}

export function InteractiveROICalculator(props) {
  return (
    <Suspense fallback={<SectionLoader />}>
      <InteractiveROICalculatorLazy {...props} />
    </Suspense>
  );
}

// Default export for barrel imports
export default {
  FoxyHealthScore,
  RevenueLeakCalculator,
  GeoHeatmapDisplay,
  AIVisibilityReport,
  CompetitorComparison,
  ActionRoadmap,
  InteractiveROICalculator,
};
