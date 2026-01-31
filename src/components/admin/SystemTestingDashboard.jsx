import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { base44 } from '@/api/base44Client';
import { CheckCircle, XCircle, Loader2, Play, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function SystemTestingDashboard() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState(0);

  const tests = [
    {
      name: 'Database Connection',
      category: 'Core',
      test: async () => {
        const leads = await base44.entities.Lead.list('', 1);
        return { success: true, message: `Connected - ${leads.length} leads accessible` };
      }
    },
    {
      name: 'Lead Fetching',
      category: 'Data',
      test: async () => {
        const leads = await base44.entities.Lead.list('-created_date', 10);
        return { success: leads.length > 0, message: `${leads.length} leads retrieved` };
      }
    },
    {
      name: 'Order Management',
      category: 'Data',
      test: async () => {
        const orders = await base44.entities.Order.list('-created_date', 10);
        return { success: true, message: `${orders.length} orders found` };
      }
    },
    {
      name: 'Email Logs',
      category: 'Integrations',
      test: async () => {
        const emails = await base44.entities.EmailLog.list('-created_date', 5);
        const recent = emails.filter(e => {
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return new Date(e.created_date) > dayAgo;
        });
        return { success: true, message: `${recent.length} emails sent in 24h` };
      }
    },
    {
      name: 'Error Tracking',
      category: 'Monitoring',
      test: async () => {
        const errors = await base44.entities.ErrorLog.list('-created_date', 5);
        const critical = errors.filter(e => e.severity === 'critical');
        return { 
          success: critical.length === 0, 
          message: critical.length === 0 ? 'No critical errors' : `${critical.length} critical errors found`,
          warning: critical.length > 0
        };
      }
    },
    {
      name: 'Automation System',
      category: 'Automation',
      test: async () => {
        try {
          const response = await base44.functions.invoke('listAutomations', {});
          const automations = response.data || [];
          const active = automations.filter(a => a.is_active);
          return { success: true, message: `${active.length} active automations` };
        } catch (error) {
          return { success: false, message: 'Automation system error', error: error.message };
        }
      }
    },
    {
      name: 'Lead Scoring Engine',
      category: 'Analytics',
      test: async () => {
        const leads = await base44.entities.Lead.list('', 5);
        const scored = leads.filter(l => l.lead_score !== undefined);
        return { 
          success: scored.length > 0, 
          message: `${scored.length}/${leads.length} leads have scores` 
        };
      }
    },
    {
      name: 'Segment Management',
      category: 'Analytics',
      test: async () => {
        const segments = await base44.entities.Segment.list('', 10);
        const active = segments.filter(s => s.is_active);
        return { success: true, message: `${active.length} active segments` };
      }
    },
    {
      name: 'A/B Test System',
      category: 'Analytics',
      test: async () => {
        const tests = await base44.entities.ABTest.list('', 5);
        const active = tests.filter(t => t.status === 'active');
        return { success: true, message: `${active.length} active tests` };
      }
    },
    {
      name: 'Health Check System',
      category: 'Monitoring',
      test: async () => {
        try {
          const response = await base44.functions.invoke('runHealthCheck', {});
          return { 
            success: response.data?.overall_status !== 'critical',
            message: `System status: ${response.data?.overall_status || 'unknown'}` 
          };
        } catch (error) {
          return { success: false, message: 'Health check unavailable', error: error.message };
        }
      }
    },
    {
      name: 'User Behavior Tracking',
      category: 'Analytics',
      test: async () => {
        const behaviors = await base44.entities.UserBehavior.list('-created_date', 5);
        return { success: true, message: `${behaviors.length} recent sessions tracked` };
      }
    },
    {
      name: 'Campaign System',
      category: 'Marketing',
      test: async () => {
        const campaigns = await base44.entities.Campaign.list('', 5);
        const active = campaigns.filter(c => c.status === 'active');
        return { success: true, message: `${active.length} active campaigns` };
      }
    }
  ];

  const runTests = async () => {
    try {
      setTesting(true);
      setResults([]);
      setProgress(0);

      const testResults = [];
      
      for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        try {
          const result = await Promise.race([
            test.test(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout')), 5000))
          ]);
          
          testResults.push({
            ...test,
            ...result,
            status: result.success ? 'passed' : 'failed'
          });
        } catch (error) {
          testResults.push({
            ...test,
            success: false,
            status: 'failed',
            message: 'Test failed',
            error: error?.message || 'Unknown error'
          });
        }
        setProgress(((i + 1) / tests.length) * 100);
        setResults([...testResults]);
      }

      setTesting(false);
      
      const passed = testResults.filter(r => r.status === 'passed').length;
      const failed = testResults.filter(r => r.status === 'failed').length;
      
      if (failed === 0) {
        toast.success(`All ${passed} tests passed! System is ready.`);
      } else {
        toast.error(`${failed} test(s) failed. Review before production.`);
      }
    } catch (error) {
      setTesting(false);
      toast.error('Test suite failed');
    }
  };

  const categories = [...new Set(tests.map(t => t.category))];
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const warnings = results.filter(r => r.warning).length;

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">System Testing Dashboard</CardTitle>
          <Button
            onClick={runTests}
            disabled={testing}
            className="bg-[#c8ff00] text-black hover:bg-[#b8ef00]"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run All Tests
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {testing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Progress</span>
              <span className="text-white">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {results.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">Passed</span>
              </div>
              <div className="text-2xl font-bold text-green-400">{passed}</div>
            </div>
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-gray-400">Warnings</span>
              </div>
              <div className="text-2xl font-bold text-yellow-400">{warnings}</div>
            </div>
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-xs text-gray-400">Failed</span>
              </div>
              <div className="text-2xl font-bold text-red-400">{failed}</div>
            </div>
          </div>
        )}

        {categories.map(category => {
          const categoryTests = results.filter(r => r.category === category);
          if (categoryTests.length === 0) return null;

          return (
            <div key={category} className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-400">{category}</h3>
              <div className="space-y-2">
                {categoryTests.map((result, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border ${
                      result.status === 'passed'
                        ? 'bg-green-500/5 border-green-500/20'
                        : result.warning
                        ? 'bg-yellow-500/5 border-yellow-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {result.status === 'passed' ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : result.warning ? (
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                          <span className="text-white text-sm font-medium">{result.name}</span>
                        </div>
                        <p className="text-xs text-gray-400 ml-6">{result.message}</p>
                        {result.error && (
                          <p className="text-xs text-red-400 mt-1 ml-6">Error: {result.error}</p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          result.status === 'passed'
                            ? 'text-green-400 border-green-500/30'
                            : result.warning
                            ? 'text-yellow-400 border-yellow-500/30'
                            : 'text-red-400 border-red-500/30'
                        }
                      >
                        {result.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}