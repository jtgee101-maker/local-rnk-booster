import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, AlertCircle, Loader2, Zap, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProductionFinalChecklistPage() {
  const [testResults, setTestResults] = useState(null);
  const [adminSetup, setAdminSetup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    setLoading(true);
    try {
      const [tests, admin] = await Promise.all([
        base44.functions.invoke('testCriticalPaths', {}),
        base44.functions.invoke('setupProductionAdmin', {})
      ]);
      setTestResults(tests.data);
      setAdminSetup(admin.data);
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const preDeploymentChecklist = [
    { section: 'Code & Build', items: [
      { name: 'npm run build completes without errors', status: 'check' },
      { name: 'No console warnings in browser', status: 'check' },
      { name: 'All pages load correctly', status: 'check' },
      { name: 'All links navigate properly', status: 'check' }
    ]},
    { section: 'Secrets & Configuration', items: [
      { name: 'RESEND_API_KEY set', status: 'pass' },
      { name: 'RESEND_WEBHOOK_SECRET set', status: 'pass' },
      { name: 'GOOGLE_MAPS_API_KEY set', status: 'pass' },
      { name: 'ADMIN_ACCESS_KEY set', status: 'pass' },
      { name: 'STRIPE_SECRET_KEY set', status: 'warning' },
      { name: 'STRIPE_WEBHOOK_SECRET set', status: 'warning' }
    ]},
    { section: 'Critical Path Testing', items: [
      { name: 'Email delivery working', status: 'check' },
      { name: 'Analytics tracking functional', status: 'check' },
      { name: 'Database access verified', status: 'check' },
      { name: 'API connectivity confirmed', status: 'check' }
    ]},
    { section: 'Admin Setup', items: [
      { name: 'Admin user verified', status: 'check' },
      { name: 'Admin dashboard accessible', status: 'check' },
      { name: 'Error logging configured', status: 'check' }
    ]},
    { section: 'Deployment Safety', items: [
      { name: 'Database backup created', status: 'check' },
      { name: 'Rollback plan documented', status: 'check' },
      { name: 'Team notified of deployment', status: 'check' },
      { name: 'Monitoring alerts enabled', status: 'check' },
      { name: 'Error tracking active', status: 'check' }
    ]},
    { section: 'Post-Deployment (First 24h)', items: [
      { name: 'Monitor error logs continuously', status: 'action' },
      { name: 'Verify all emails delivering', status: 'action' },
      { name: 'Check Core Web Vitals', status: 'action' },
      { name: 'Review first day conversions', status: 'action' },
      { name: 'Test payment flow with real card', status: 'action' }
    ]}
  ];

  const getIcon = (status) => {
    if (status === 'pass') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (status === 'warning') return <AlertCircle className="w-4 h-4 text-amber-500" />;
    if (status === 'check' || status === 'action') return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
    return <AlertCircle className="w-4 h-4 text-gray-400" />;
  };

  const getStatusColor = (status) => {
    if (status === 'pass' || status === 'check') return 'text-gray-300';
    if (status === 'warning') return 'text-amber-300';
    if (status === 'action') return 'text-blue-300';
    return 'text-gray-500';
  };

  return (
    <>
      <Helmet>
        <title>Production Final Checklist - LocalRank.ai</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-[#c8ff00]" />
                <h1 className="text-4xl font-bold text-white">Production Final Checklist</h1>
              </div>
              <Button
                onClick={runTests}
                disabled={loading}
                className="bg-[#c8ff00] text-gray-900 hover:bg-[#b8ef00]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Run Tests
                  </>
                )}
              </Button>
            </div>
            <p className="text-gray-400">Final verification before deploying to production</p>
          </div>

          <Tabs defaultValue="checklist" className="space-y-4">
            <TabsList className="bg-gray-900/50">
              <TabsTrigger value="checklist">Deployment Checklist</TabsTrigger>
              <TabsTrigger value="tests">Critical Path Tests</TabsTrigger>
              <TabsTrigger value="admin">Admin Setup</TabsTrigger>
            </TabsList>

            {/* CHECKLIST TAB */}
            <TabsContent value="checklist">
              <div className="space-y-4">
                {preDeploymentChecklist.map((section, sectionIdx) => (
                  <Card key={sectionIdx} className="bg-gray-900/50 border-gray-800/50">
                    <CardHeader>
                      <CardTitle className="text-lg">{section.section}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {section.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex items-center gap-3">
                            {getIcon(item.status)}
                            <span className={`text-sm ${getStatusColor(item.status)}`}>
                              {item.name}
                            </span>
                            {item.status === 'warning' && (
                              <Badge className="ml-auto bg-amber-500/20 text-amber-300">
                                {item.status === 'warning' ? 'Optional' : 'Review'}
                              </Badge>
                            )}
                            {item.status === 'action' && (
                              <Badge className="ml-auto bg-blue-500/20 text-blue-300">
                                During Deployment
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* TESTS TAB */}
            <TabsContent value="tests">
              {testResults && (
                <div className="space-y-4">
                  <Card className="bg-gray-900/50 border-gray-800/50">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Critical Path Tests</span>
                        <Badge
                          className={`${
                            testResults.summary.failed === 0
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {testResults.summary.passed}/{testResults.summary.total} Pass
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(testResults.tests).map(([testName, result]) => (
                        <div
                          key={testName}
                          className={`rounded-lg p-4 border ${
                            result.status === 'pass'
                              ? 'bg-green-500/10 border-green-500/20'
                              : 'bg-red-500/10 border-red-500/20'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p
                                className={`font-semibold ${
                                  result.status === 'pass' ? 'text-green-300' : 'text-red-300'
                                }`}
                              >
                                {testName.split(/(?=[A-Z])/).join(' ')}
                              </p>
                              <p className="text-sm text-gray-400 mt-1">{result.details}</p>
                            </div>
                            {result.status === 'pass' ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* ADMIN SETUP TAB */}
            <TabsContent value="admin">
              {adminSetup && (
                <div className="space-y-4">
                  <Card className="bg-gray-900/50 border-gray-800/50">
                    <CardHeader>
                      <CardTitle>Admin User Setup</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Current User</h3>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
                          <p className="text-sm">
                            <span className="text-gray-400">Email: </span>
                            <span className="text-blue-300 font-semibold">{adminSetup.currentUser.email}</span>
                          </p>
                          <p className="text-sm mt-1">
                            <span className="text-gray-400">Role: </span>
                            <span className="text-blue-300 font-semibold">{adminSetup.currentUser.role}</span>
                          </p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Configuration Checks</h3>
                        <div className="space-y-2">
                          {Object.entries(adminSetup.checks).map(([checkName, check]) => (
                            <div
                              key={checkName}
                              className="flex items-center gap-3 p-3 bg-gray-800/50 rounded"
                            >
                              {check.status === 'pass' ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              )}
                              <div className="flex-1">
                                <p className="text-sm text-gray-300">
                                  {checkName.split(/(?=[A-Z])/).join(' ')}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">{check.value}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {adminSetup.setup.nextSteps.length > 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded p-4">
                          <h3 className="text-amber-300 font-semibold mb-2">Next Steps</h3>
                          <ul className="space-y-1 text-sm text-amber-300">
                            {adminSetup.setup.nextSteps.map((step, idx) => (
                              <li key={idx}>• {step}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {adminSetup.setup.readyForDeployment && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded p-4">
                          <p className="text-green-300 font-semibold">
                            ✓ Admin setup complete and ready for production
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Deployment Summary */}
          <Card className="bg-[#c8ff00]/5 border-[#c8ff00]/20 mt-8">
            <CardHeader>
              <CardTitle className="text-[#c8ff00]">Deployment Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-semibold text-gray-300 mb-2">1. Pre-Deployment (Now)</p>
                <ul className="list-disc list-inside space-y-1 text-gray-400 ml-2">
                  <li>Complete all items above ✓</li>
                  <li>Run npm run build</li>
                  <li>Verify no warnings in output</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-300 mb-2">2. Deployment (10-15 min)</p>
                <ul className="list-disc list-inside space-y-1 text-gray-400 ml-2">
                  <li>Push code to production</li>
                  <li>Verify all pages load</li>
                  <li>Test quiz flow end-to-end</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-300 mb-2">3. Post-Deployment (First 24h)</p>
                <ul className="list-disc list-inside space-y-1 text-gray-400 ml-2">
                  <li>Monitor error logs every 1-2 hours</li>
                  <li>Verify emails are sending</li>
                  <li>Check Core Web Vitals</li>
                  <li>Test payment flow</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}