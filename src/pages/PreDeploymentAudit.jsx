import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, AlertCircle, XCircle, Loader2, RefreshCw, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PreDeploymentAuditPage() {
  const [loading, setLoading] = useState(false);
  const [buildReport, setBuildReport] = useState(null);
  const [configReport, setConfigReport] = useState(null);
  const [performanceReport, setPerformanceReport] = useState(null);
  const [errorReport, setErrorReport] = useState(null);
  const [readinessReport, setReadinessReport] = useState(null);

  const runAllChecks = async () => {
    setLoading(true);
    try {
      const [build, config, performance, errors, readiness] = await Promise.all([
        base44.functions.invoke('validateBuild', {}),
        base44.functions.invoke('validateEnvironmentConfig', {}),
        base44.functions.invoke('validatePerformance', {}),
        base44.functions.invoke('validateErrorHandling', {}),
        base44.functions.invoke('deploymentReadinessCheck', {})
      ]);

      setBuildReport(build.data);
      setConfigReport(config.data);
      setPerformanceReport(performance.data);
      setErrorReport(errors.data);
      setReadinessReport(readiness.data);
    } catch (error) {
      console.error('Error running checks:', error);
      alert('Failed to run deployment checks. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAllChecks();
  }, []);

  const getStatusIcon = (status) => {
    if (status === 'pass' || status === 'configured' || status === 'implemented') {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
    if (status === 'warning' || status === 'needs-review') {
      return <AlertCircle className="w-4 h-4 text-amber-500" />;
    }
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusColor = (status) => {
    if (status === 'pass' || status === 'configured' || status === 'ready-for-deployment') {
      return 'text-green-500';
    }
    if (status === 'warning' || status === 'needs-review' || status === 'ready-with-warnings') {
      return 'text-amber-500';
    }
    if (status === 'fail' || status === 'blocked') {
      return 'text-red-500';
    }
    return 'text-gray-400';
  };

  return (
    <>
      <Helmet>
        <title>Pre-Deployment Audit - LocalRank.ai</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-[#c8ff00]" />
                <h1 className="text-4xl font-bold text-white">Pre-Deployment Audit</h1>
              </div>
              <Button
                onClick={runAllChecks}
                disabled={loading}
                className="bg-[#c8ff00] text-gray-900 hover:bg-[#b8ef00]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running Checks...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Run All Checks
                  </>
                )}
              </Button>
            </div>
            <p className="text-gray-400">Complete production readiness verification</p>
          </div>

          {/* Overall Status */}
          {readinessReport && (
            <Card className="bg-gray-900/50 border-gray-800/50 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Overall Deployment Status</span>
                  <Badge
                    className={`${
                      readinessReport.canDeploy
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {readinessReport.overallStatus}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg text-gray-300 font-semibold">
                  {readinessReport.recommendation}
                </p>
                {readinessReport.blockers.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <h3 className="text-red-400 font-semibold mb-3">Critical Blockers</h3>
                    <ul className="space-y-2">
                      {readinessReport.blockers.map((blocker, idx) => (
                        <li key={idx} className="text-sm text-red-300">
                          • <strong>{blocker.item}:</strong> {blocker.details}
                          <br />
                          <span className="text-red-400 text-xs ml-4">→ {blocker.action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {readinessReport.warnings.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                    <h3 className="text-amber-400 font-semibold mb-3">Warnings</h3>
                    <ul className="space-y-2">
                      {readinessReport.warnings.map((warning, idx) => (
                        <li key={idx} className="text-sm text-amber-300">
                          • <strong>{warning.item}</strong>: {warning.impact}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Detailed Checks */}
          <Tabs defaultValue="build" className="space-y-4">
            <TabsList className="bg-gray-900/50 border-gray-800/50">
              <TabsTrigger value="build">Build ({buildReport?.summary?.passed || 0})</TabsTrigger>
              <TabsTrigger value="config">Config</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="errors">Error Handling</TabsTrigger>
            </TabsList>

            {/* BUILD TAB */}
            <TabsContent value="build">
              {buildReport && (
                <div className="space-y-4">
                  <Card className="bg-gray-900/50 border-gray-800/50">
                    <CardHeader>
                      <CardTitle>Build Verification</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(buildReport.checks).map(([category, data]) => (
                          <div key={category}>
                            <h3 className="text-sm font-semibold text-gray-300 mb-2">
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </h3>
                            <div className="space-y-2">
                              {data.details?.slice(0, 5).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  {getStatusIcon(item.status)}
                                  <span className="text-gray-300">{item.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* CONFIG TAB */}
            <TabsContent value="config">
              {configReport && (
                <div className="space-y-4">
                  <Card className="bg-gray-900/50 border-gray-800/50">
                    <CardHeader>
                      <CardTitle>Environment & Secrets</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Configured Secrets */}
                      <div>
                        <h3 className="text-sm font-semibold text-green-400 mb-3">✓ Configured</h3>
                        <div className="space-y-2">
                          {configReport.secrets.configured.map((secret, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm bg-green-500/10 border border-green-500/20 rounded p-3">
                              <div>
                                <p className="text-green-300 font-semibold">{secret.name}</p>
                                <p className="text-xs text-gray-500">{secret.service}</p>
                              </div>
                              <Badge className="bg-green-500/20 text-green-300">Set</Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Missing Secrets */}
                      {configReport.secrets.missing.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-red-400 mb-3">✗ Missing (Critical)</h3>
                          <div className="space-y-2">
                            {configReport.secrets.missing.map((secret, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm bg-red-500/10 border border-red-500/20 rounded p-3">
                                <div>
                                  <p className="text-red-300 font-semibold">{secret.name}</p>
                                  <p className="text-xs text-gray-500">{secret.service}</p>
                                </div>
                                <Badge className="bg-red-500/20 text-red-300">Missing</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Warnings */}
                      {configReport.secrets.warnings.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-amber-400 mb-3">⚠ Optional</h3>
                          <div className="space-y-2">
                            {configReport.secrets.warnings.map((secret, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm bg-amber-500/10 border border-amber-500/20 rounded p-3">
                                <div>
                                  <p className="text-amber-300 font-semibold">{secret.name}</p>
                                  <p className="text-xs text-gray-500">{secret.reason}</p>
                                </div>
                                <Badge className="bg-amber-500/20 text-amber-300">Optional</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* API Status */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">API Integration Status</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {Object.entries(configReport.apis).map(([api, data]) => (
                            <div key={api} className={`rounded p-3 border ${
                              data.status === 'configured' 
                                ? 'bg-green-500/10 border-green-500/20' 
                                : 'bg-red-500/10 border-red-500/20'
                            }`}>
                              <p className={`text-sm font-semibold ${
                                data.status === 'configured' ? 'text-green-300' : 'text-red-300'
                              }`}>
                                {api.charAt(0).toUpperCase() + api.slice(1)}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">{data.details}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* PERFORMANCE TAB */}
            <TabsContent value="performance">
              {performanceReport && (
                <div className="space-y-4">
                  <Card className="bg-gray-900/50 border-gray-800/50">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Performance Audit</span>
                        <Badge className="bg-green-500/20 text-green-300">Score: {performanceReport.summary.overallScore}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Lazy Loading */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">
                          Lazy Loading ({performanceReport.summary.lazyLoading.coverage})
                        </h3>
                        <p className="text-xs text-gray-500 mb-3">
                          {performanceReport.summary.lazyLoading.implemented} of{' '}
                          {performanceReport.summary.lazyLoading.total} components optimized
                        </p>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${(performanceReport.summary.lazyLoading.implemented /
                                performanceReport.summary.lazyLoading.total) * 100}%`
                            }}
                          />
                        </div>
                      </div>

                      {/* Caching */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">
                          Caching Strategy
                        </h3>
                        <p className="text-sm text-green-300">
                          {performanceReport.summary.caching.strategies} strategies implemented:
                        </p>
                        <ul className="mt-2 space-y-1 text-xs text-gray-400">
                          <li>✓ Session state caching</li>
                          <li>✓ React Query optimization</li>
                          <li>✓ Image browser caching</li>
                          <li>✓ CSS-in-JS optimization</li>
                        </ul>
                      </div>

                      {/* Bundle */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">
                          Bundle Health
                        </h3>
                        <p className="text-sm text-green-300">
                          {performanceReport.summary.bundleHealth.estimate} (gzipped)
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {performanceReport.summary.bundleHealth.recommendation}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* ERROR HANDLING TAB */}
            <TabsContent value="errors">
              {errorReport && (
                <div className="space-y-4">
                  <Card className="bg-gray-900/50 border-gray-800/50">
                    <CardHeader>
                      <CardTitle>Error Handling Verification</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(errorReport.summary).map(([category, data]) => {
                        if (typeof data !== 'object') return null;
                        return (
                          <div key={category}>
                            <h3 className="text-sm font-semibold text-gray-300 mb-2">
                              {category.split(/(?=[A-Z])/).join(' ')}
                            </h3>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400">
                                {data.implemented} / {data.total} implemented
                              </span>
                              <span className={`font-semibold ${getStatusColor('pass')}`}>
                                {data.coverage}
                              </span>
                            </div>
                            <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{
                                  width: `${(data.implemented / data.total) * 100}%`
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Recommendations */}
          {readinessReport?.recommendations.length > 0 && (
            <Card className="bg-[#c8ff00]/5 border-[#c8ff00]/20 mt-8">
              <CardHeader>
                <CardTitle className="text-[#c8ff00]">Deployment Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {readinessReport.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex-shrink-0">
                        <Badge
                          className={`${
                            rec.priority === 'high'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {rec.priority}
                        </Badge>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-300">{rec.phase}</p>
                        <p className="text-sm text-gray-400">{rec.task}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}