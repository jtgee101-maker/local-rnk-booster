import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Clock, Database, Wifi, TrendingUp } from 'lucide-react';

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    pageLoadTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
    renderTime: 0,
    networkSpeed: 'unknown'
  });

  useEffect(() => {
    // Measure page load time
    const perfData = performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    
    // Measure memory (if available)
    const memory = performance.memory;
    const memoryUsage = memory ? Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100) : 0;

    // Measure render time
    const renderTime = performance.now();

    setMetrics({
      pageLoadTime: Math.round(pageLoadTime),
      apiResponseTime: 0, // Will be measured on API calls
      memoryUsage,
      renderTime: Math.round(renderTime),
      networkSpeed: navigator.connection ? navigator.connection.effectiveType : 'unknown'
    });

    // Monitor API response times
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const apiCalls = entries.filter(e => e.initiatorType === 'fetch' || e.initiatorType === 'xmlhttprequest');
      if (apiCalls.length > 0) {
        const avgResponseTime = apiCalls.reduce((sum, e) => sum + e.duration, 0) / apiCalls.length;
        setMetrics(prev => ({ ...prev, apiResponseTime: Math.round(avgResponseTime) }));
      }
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => observer.disconnect();
  }, []);

  const getPerformanceScore = () => {
    let score = 100;
    
    // Page load penalties
    if (metrics.pageLoadTime > 3000) score -= 20;
    else if (metrics.pageLoadTime > 2000) score -= 10;
    
    // API response penalties
    if (metrics.apiResponseTime > 1000) score -= 20;
    else if (metrics.apiResponseTime > 500) score -= 10;
    
    // Memory penalties
    if (metrics.memoryUsage > 80) score -= 15;
    else if (metrics.memoryUsage > 60) score -= 5;

    return Math.max(score, 0);
  };

  const performanceScore = getPerformanceScore();
  const scoreColor = performanceScore >= 90 ? 'text-green-400' : performanceScore >= 70 ? 'text-yellow-400' : 'text-red-400';
  const scoreBg = performanceScore >= 90 ? 'bg-green-500/20' : performanceScore >= 70 ? 'bg-yellow-500/20' : 'bg-red-500/20';

  const performanceMetrics = [
    {
      label: 'Page Load Time',
      value: `${(metrics.pageLoadTime / 1000).toFixed(2)}s`,
      icon: Clock,
      status: metrics.pageLoadTime < 2000 ? 'good' : metrics.pageLoadTime < 3000 ? 'fair' : 'poor',
      target: '< 2s'
    },
    {
      label: 'API Response',
      value: metrics.apiResponseTime > 0 ? `${metrics.apiResponseTime}ms` : 'N/A',
      icon: Database,
      status: metrics.apiResponseTime === 0 ? 'good' : metrics.apiResponseTime < 500 ? 'good' : metrics.apiResponseTime < 1000 ? 'fair' : 'poor',
      target: '< 500ms'
    },
    {
      label: 'Memory Usage',
      value: metrics.memoryUsage > 0 ? `${metrics.memoryUsage}%` : 'N/A',
      icon: TrendingUp,
      status: metrics.memoryUsage === 0 ? 'good' : metrics.memoryUsage < 60 ? 'good' : metrics.memoryUsage < 80 ? 'fair' : 'poor',
      target: '< 60%'
    },
    {
      label: 'Network Speed',
      value: metrics.networkSpeed === '4g' ? 'Fast' : metrics.networkSpeed === '3g' ? 'Medium' : metrics.networkSpeed === '2g' ? 'Slow' : 'Unknown',
      icon: Wifi,
      status: metrics.networkSpeed === '4g' ? 'good' : metrics.networkSpeed === '3g' ? 'fair' : 'poor',
      target: '4G+'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'fair': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      case 'poor': return 'text-red-400 border-red-500/30 bg-red-500/10';
      default: return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#c8ff00]" />
            Performance Monitor
          </CardTitle>
          <div className={`px-4 py-2 rounded-lg ${scoreBg}`}>
            <div className="text-xs text-gray-400 mb-1">Score</div>
            <div className={`text-2xl font-bold ${scoreColor}`}>{performanceScore}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {performanceMetrics.map((metric, i) => {
            const Icon = metric.icon;
            return (
              <div key={i} className={`p-4 rounded-lg border ${getStatusColor(metric.status)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm text-white">{metric.label}</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {metric.value}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Target: {metric.target}</span>
                  <span className={
                    metric.status === 'good' ? 'text-green-400' :
                    metric.status === 'fair' ? 'text-yellow-400' : 'text-red-400'
                  }>
                    {metric.status === 'good' ? '✓ Optimal' : metric.status === 'fair' ? '⚠ Fair' : '✗ Needs Improvement'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-400 space-y-1">
            <div className="font-semibold mb-2">Optimization Tips:</div>
            {performanceScore < 90 && (
              <ul className="space-y-1 ml-4 list-disc">
                {metrics.pageLoadTime > 2000 && (
                  <li>Enable lazy loading for heavy components</li>
                )}
                {metrics.apiResponseTime > 500 && (
                  <li>Implement data caching and pagination</li>
                )}
                {metrics.memoryUsage > 60 && (
                  <li>Review component re-renders and memory leaks</li>
                )}
              </ul>
            )}
            {performanceScore >= 90 && (
              <div className="text-green-400">✓ Performance is optimal</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}