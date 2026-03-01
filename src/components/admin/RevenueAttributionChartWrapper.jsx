import React, { lazy, Suspense } from 'react';

// Loading fallback for charts
const ChartLoader = () => (
  <div className="flex items-center justify-center h-[300px] w-full">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

// Lazy load the RevenueAttributionChart component
const RevenueAttributionChartLazy = lazy(() => import('./RevenueAttributionChart'));

// Wrapper component that handles Suspense
export default function RevenueAttributionChart(props) {
  return (
    <Suspense fallback={<ChartLoader />}>
      <RevenueAttributionChartLazy {...props} />
    </Suspense>
  );
}

// Re-export for named imports
export { RevenueAttributionChart };
