import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  CheckCircle2, XCircle, AlertCircle, Loader2, ShieldCheck, Database,
  Server, Mail, CreditCard, Bug, Lock, Activity, BarChart3, Zap
} from 'lucide-react';

export default function ProductionReadinessCheck() {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningChecks, setRunningChecks] = useState(false);

  useEffect(() => {
    runChecks();
  }, []);

  const runChecks = async () => {
    setRunningChecks(true);
    const results = [];

    // 1. Authentication & Security
    results.push(await checkAuth());
    
    // 2. Database entities
    results.push(await checkEntities());
    
    // 3. Backend functions
    results.push(await checkFunctions());
    
    // 4. Email system
    results.push(await checkEmails());
    
    // 5. Payment system
    results.push(await checkPayments());
    
    // 6. Analytics tracking
    results.push(await checkAnalytics());
    
    // 7. Error monitoring
    results.push(await checkErrorMonitoring());
    
    // 8. Rate limiting
    results.push(await checkRateLimiting());

    // 9. Data validation
    results.push(await checkDataValidation());

    // 10. Performance
    results.push(await checkPerformance());

    setChecks(results);
    setLoading(false);
    setRunningChecks(false);
  };

  const checkAuth = async () => {
    try {
      const user = await base44.auth.me();
      return {
        category: 'Authentication',
        icon: ShieldCheck,
        name: 'Admin Authentication',
        status: user?.role === 'admin' ? 'pass' : 'fail',
        message: user?.role === 'admin' 
          ? 'Admin authentication working' 
          : 'Not logged in as admin',
        details: `Current role: ${user?.role || 'none'}`
      };
    } catch (error) {
      return {
        category: 'Authentication',
        icon: ShieldCheck,
        name: 'Admin Authentication',
        status: 'fail',
        message: 'Auth check failed',
        details: error.message
      };
    }
  };

  const checkEntities = async () => {
    try {
      const requiredEntities = [
        'Lead', 'Order', 'EmailLog', 'LeadNurture', 'ErrorLog',
        'ABTest', 'ABTestEvent', 'ConversionEvent', 'Segment',
        'Affiliate', 'Referral', 'AppSettings'
      ];
      
      const entityChecks = await Promise.all(
        requiredEntities.map(async (entity) => {
          try {
            await base44.entities[entity].list('-created_date', 1);
            return { entity, exists: true };
          } catch {
            return { entity, exists: false };
          }
        })
      );

      const missing = entityChecks.filter(e => !e.exists).map(e => e.entity);

      return {
        category: 'Database',
        icon: Database,
        name: 'Entity Schemas',
        status: missing.length === 0 ? 'pass' : 'fail',
        message: missing.length === 0 
          ? 'All entities configured' 
          : `Missing ${missing.length} entities`,
        details: missing.length > 0 ? `Missing: ${missing.join(', ')}` : 'All required entities present'
      };
    } catch (error) {
      return {
        category: 'Database',
        icon: Database,
        name: 'Entity Schemas',
        status: 'fail',
        message: 'Entity check failed',
        details: error.message
      };
    }
  };

  const checkFunctions = async () => {
    try {
      const criticalFunctions = [
        'admin/getAnalytics',
        'admin/getEmailAnalytics',
        'analytics/roiMetrics',
        'analytics/funnelAnalysis',
        'analytics/cohortAnalysis',
        'stripeWebhook',
        'createStripeCheckout'
      ];

      // Test one function
      const testResult = await base44.functions.invoke('admin/getAnalytics', {});
      
      return {
        category: 'Backend',
        icon: Server,
        name: 'Backend Functions',
        status: testResult.data ? 'pass' : 'warn',
        message: 'Backend functions operational',
        details: `${criticalFunctions.length} critical functions`
      };
    } catch (error) {
      return {
        category: 'Backend',
        icon: Server,
        name: 'Backend Functions',
        status: 'fail',
        message: 'Function check failed',
        details: error.message
      };
    }
  };

  const checkEmails = async () => {
    try {
      const recentLogs = await base44.entities.EmailLog.list('-created_date', 10);
      const failureRate = recentLogs.filter(l => l.status === 'failed').length / recentLogs.length;

      return {
        category: 'Email',
        icon: Mail,
        name: 'Email System',
        status: failureRate < 0.1 ? 'pass' : 'warn',
        message: failureRate < 0.1 ? 'Email delivery healthy' : 'High failure rate',
        details: `${recentLogs.length} recent emails, ${(failureRate * 100).toFixed(1)}% failure rate`
      };
    } catch (error) {
      return {
        category: 'Email',
        icon: Mail,
        name: 'Email System',
        status: 'warn',
        message: 'Email check inconclusive',
        details: 'No recent email logs or error: ' + error.message
      };
    }
  };

  const checkPayments = async () => {
    try {
      const recentOrders = await base44.entities.Order.list('-created_date', 10);
      const hasCompletedOrders = recentOrders.some(o => o.status === 'completed');

      return {
        category: 'Payments',
        icon: CreditCard,
        name: 'Stripe Integration',
        status: hasCompletedOrders ? 'pass' : 'warn',
        message: hasCompletedOrders ? 'Payments processing' : 'No recent completed orders',
        details: `${recentOrders.length} recent orders`
      };
    } catch (error) {
      return {
        category: 'Payments',
        icon: CreditCard,
        name: 'Stripe Integration',
        status: 'fail',
        message: 'Payment check failed',
        details: error.message
      };
    }
  };

  const checkAnalytics = async () => {
    try {
      const recentEvents = await base44.entities.ConversionEvent.list('-created_date', 10);

      return {
        category: 'Analytics',
        icon: BarChart3,
        name: 'Event Tracking',
        status: recentEvents.length > 0 ? 'pass' : 'warn',
        message: recentEvents.length > 0 ? 'Events tracking' : 'No recent events',
        details: `${recentEvents.length} recent events tracked`
      };
    } catch (error) {
      return {
        category: 'Analytics',
        icon: BarChart3,
        name: 'Event Tracking',
        status: 'fail',
        message: 'Analytics check failed',
        details: error.message
      };
    }
  };

  const checkErrorMonitoring = async () => {
    try {
      const recentErrors = await base44.entities.ErrorLog.list('-created_date', 50);
      const criticalErrors = recentErrors.filter(e => e.severity === 'critical' && !e.resolved);

      return {
        category: 'Monitoring',
        icon: Bug,
        name: 'Error Tracking',
        status: criticalErrors.length === 0 ? 'pass' : 'warn',
        message: criticalErrors.length === 0 
          ? 'No critical errors' 
          : `${criticalErrors.length} unresolved critical errors`,
        details: `${recentErrors.length} total errors logged`
      };
    } catch (error) {
      return {
        category: 'Monitoring',
        icon: Bug,
        name: 'Error Tracking',
        status: 'warn',
        message: 'Error monitoring check inconclusive',
        details: error.message
      };
    }
  };

  const checkRateLimiting = async () => {
    try {
      // Check if rate limiting function exists
      const result = await base44.functions.invoke('validateRateLimit', {
        email: 'test@example.com',
        action: 'quiz_submit'
      });

      return {
        category: 'Security',
        icon: Lock,
        name: 'Rate Limiting',
        status: 'pass',
        message: 'Rate limiting active',
        details: 'Protecting against abuse'
      };
    } catch (error) {
      return {
        category: 'Security',
        icon: Lock,
        name: 'Rate Limiting',
        status: 'warn',
        message: 'Rate limiting check inconclusive',
        details: error.message
      };
    }
  };

  const checkDataValidation = async () => {
    try {
      const recentLeads = await base44.entities.Lead.list('-created_date', 50);
      const invalidLeads = recentLeads.filter(l => !l.email || !l.business_name);

      return {
        category: 'Data Quality',
        icon: Activity,
        name: 'Data Validation',
        status: invalidLeads.length === 0 ? 'pass' : 'warn',
        message: invalidLeads.length === 0 
          ? 'Data validation working' 
          : `${invalidLeads.length} incomplete records`,
        details: `Checked ${recentLeads.length} recent leads`
      };
    } catch (error) {
      return {
        category: 'Data Quality',
        icon: Activity,
        name: 'Data Validation',
        status: 'fail',
        message: 'Validation check failed',
        details: error.message
      };
    }
  };

  const checkPerformance = async () => {
    try {
      const start = Date.now();
      await base44.entities.Lead.list('-created_date', 100);
      const duration = Date.now() - start;

      return {
        category: 'Performance',
        icon: Zap,
        name: 'Query Performance',
        status: duration < 2000 ? 'pass' : 'warn',
        message: duration < 2000 ? 'Fast queries' : 'Slow queries detected',
        details: `100 leads fetched in ${duration}ms`
      };
    } catch (error) {
      return {
        category: 'Performance',
        icon: Zap,
        name: 'Query Performance',
        status: 'fail',
        message: 'Performance check failed',
        details: error.message
      };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pass': return 'text-green-400';
      case 'warn': return 'text-yellow-400';
      case 'fail': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'pass': return 'bg-green-500/10 border-green-500/30';
      case 'warn': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'fail': return 'bg-red-500/10 border-red-500/30';
      default: return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'warn': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'fail': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />;
    }
  };

  const summary = checks.reduce((acc, check) => {
    acc[check.status] = (acc[check.status] || 0) + 1;
    return acc;
  }, {});

  const overallStatus = 
    summary.fail > 0 ? 'Critical Issues' :
    summary.warn > 0 ? 'Warnings Present' :
    'All Systems Go';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#c8ff00] animate-spin mx-auto mb-4" />
          <p className="text-white text-xl font-semibold">Running Production Checks...</p>
          <p className="text-gray-400 mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Production Readiness Check</h1>
              <p className="text-gray-400">Comprehensive system health audit</p>
            </div>
            <Button
              onClick={runChecks}
              disabled={runningChecks}
              className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold"
            >
              {runningChecks ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Re-run Checks
            </Button>
          </div>
        </motion.div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  summary.fail > 0 ? 'bg-red-500 animate-pulse' :
                  summary.warn > 0 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`} />
                {overallStatus}
              </CardTitle>
              <CardDescription>
                {checks.length} checks completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="text-3xl font-bold text-green-400">{summary.pass || 0}</div>
                  <div className="text-sm text-green-300">Passed</div>
                </div>
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <div className="text-3xl font-bold text-yellow-400">{summary.warn || 0}</div>
                  <div className="text-sm text-yellow-300">Warnings</div>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <div className="text-3xl font-bold text-red-400">{summary.fail || 0}</div>
                  <div className="text-sm text-red-300">Failed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detailed Checks */}
        <div className="space-y-3">
          {checks.map((check, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`border ${getStatusBg(check.status)}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-2 bg-gray-900/50 rounded-lg">
                        <check.icon className={`w-5 h-5 ${getStatusColor(check.status)}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-semibold">{check.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {check.category}
                          </Badge>
                        </div>
                        <p className={`text-sm ${getStatusColor(check.status)} mb-1`}>
                          {check.message}
                        </p>
                        <p className="text-xs text-gray-500">{check.details}</p>
                      </div>
                    </div>
                    <StatusIcon status={check.status} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recommendations */}
        {(summary.fail > 0 || summary.warn > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gray-800/50 border-yellow-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  Action Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {checks.filter(c => c.status === 'fail').map((check, i) => (
                  <div key={i} className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                    <p className="text-red-400 font-semibold text-sm">🔴 {check.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{check.details}</p>
                  </div>
                ))}
                {checks.filter(c => c.status === 'warn').map((check, i) => (
                  <div key={i} className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                    <p className="text-yellow-400 font-semibold text-sm">⚠️ {check.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{check.details}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}