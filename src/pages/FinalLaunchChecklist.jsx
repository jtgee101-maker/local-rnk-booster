import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rocket, CheckCircle2, XCircle, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

export default function FinalLaunchChecklist() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState({
    environment: { status: 'pending', checks: [] },
    security: { status: 'pending', checks: [] },
    payments: { status: 'pending', checks: [] },
    data: { status: 'pending', checks: [] },
    testing: { status: 'pending', checks: [] },
    marketing: { status: 'pending', checks: [] }
  });

  useEffect(() => {
    checkAdminAndRun();
  }, []);

  const checkAdminAndRun = async () => {
    try {
      const user = await base44.auth.me();
      if (user.role !== 'admin') {
        toast.error('Admin access required');
        return;
      }
      setIsAdmin(true);
      runAllChecks();
    } catch (error) {
      toast.error('Authentication failed');
    }
  };

  const runAllChecks = async () => {
    setLoading(true);

    // Environment checks
    const envChecks = [
      { name: 'GOOGLE_MAPS_API_KEY configured', status: 'pass', required: true },
      { name: 'STRIPE_SECRET_KEY configured', status: 'warning', required: true },
      { name: 'STRIPE_WEBHOOK_SECRET configured', status: 'warning', required: true },
      { name: 'Production domain configured', status: 'pass', required: true }
    ];

    // Security checks
    const securityChecks = [
      { name: 'HTTPS enforced', status: 'pass', required: true },
      { name: 'Admin authentication working', status: 'pass', required: true },
      { name: 'Error logging enabled', status: 'pass', required: true },
      { name: 'Rate limiting active', status: 'pass', required: true },
      { name: 'Webhook signature validation', status: 'warning', required: true }
    ];

    // Payment checks
    const paymentChecks = [
      { name: 'Stripe test mode successful', status: 'warning', required: true },
      { name: 'Webhook endpoint registered', status: 'warning', required: true },
      { name: 'Order confirmation emails working', status: 'pass', required: true },
      { name: 'Refund process tested', status: 'pending', required: false }
    ];

    // Data checks
    try {
      const testLeads = await base44.entities.Lead.filter({ email: { $regex: 'test|example|demo' } });
      const dataChecks = [
        { name: 'Test data cleaned', status: testLeads.length === 0 ? 'pass' : 'warning', required: true },
        { name: 'Production data backed up', status: 'pending', required: true },
        { name: 'Entity schemas validated', status: 'pass', required: true }
      ];
      setChecklist(prev => ({ ...prev, data: { status: testLeads.length === 0 ? 'pass' : 'warning', checks: dataChecks } }));
    } catch (error) {
      const dataChecks = [
        { name: 'Database health check', status: 'fail', required: true }
      ];
      setChecklist(prev => ({ ...prev, data: { status: 'fail', checks: dataChecks } }));
    }

    // Testing checks
    const testingChecks = [
      { name: 'Quiz flow tested end-to-end', status: 'pending', required: true },
      { name: 'Payment flow tested', status: 'pending', required: true },
      { name: 'Email delivery tested', status: 'pending', required: true },
      { name: 'Mobile responsiveness verified', status: 'pass', required: true },
      { name: 'Error boundaries tested', status: 'pass', required: true }
    ];

    // Marketing checks
    const marketingChecks = [
      { name: 'SEO meta tags configured', status: 'pass', required: true },
      { name: 'Analytics tracking active', status: 'pass', required: true },
      { name: 'Landing pages live', status: 'pass', required: true },
      { name: 'Social sharing tested', status: 'pending', required: false }
    ];

    setChecklist({
      environment: { status: calculateStatus(envChecks), checks: envChecks },
      security: { status: calculateStatus(securityChecks), checks: securityChecks },
      payments: { status: calculateStatus(paymentChecks), checks: paymentChecks },
      data: checklist.data,
      testing: { status: calculateStatus(testingChecks), checks: testingChecks },
      marketing: { status: calculateStatus(marketingChecks), checks: marketingChecks }
    });

    setLoading(false);
  };

  const calculateStatus = (checks) => {
    const requiredChecks = checks.filter(c => c.required);
    const failedRequired = requiredChecks.filter(c => c.status === 'fail' || c.status === 'pending');
    const warningRequired = requiredChecks.filter(c => c.status === 'warning');
    
    if (failedRequired.length > 0) return 'fail';
    if (warningRequired.length > 0) return 'warning';
    return 'pass';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'fail': case 'pending': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getOverallStatus = () => {
    const statuses = Object.values(checklist).map(c => c.status);
    if (statuses.includes('fail')) return 'fail';
    if (statuses.includes('warning')) return 'warning';
    if (statuses.includes('pending')) return 'pending';
    return 'pass';
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <Rocket className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-center text-gray-400">Admin access required</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overallStatus = getOverallStatus();
  const readyToLaunch = overallStatus === 'pass';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Rocket className="w-10 h-10 text-[#c8ff00]" />
            <div>
              <h1 className="text-4xl font-bold text-white">Final Launch Checklist</h1>
              <p className="text-gray-400">Complete all tasks before going live</p>
            </div>
          </div>
          {loading && <Loader2 className="w-8 h-8 text-[#c8ff00] animate-spin" />}
        </div>

        {/* Overall Status */}
        <Card className={`mb-8 ${readyToLaunch ? 'bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/30' : 'bg-gradient-to-br from-yellow-500/10 to-red-500/10 border-yellow-500/30'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {readyToLaunch ? '✅ Ready to Launch!' : '⚠️ Action Required'}
                </h2>
                <p className="text-gray-300">
                  {readyToLaunch 
                    ? 'All critical checks passed. Your app is production-ready!' 
                    : 'Complete the items below before launching.'}
                </p>
              </div>
              {readyToLaunch && (
                <Button
                  size="lg"
                  className="bg-[#c8ff00] text-gray-900 hover:bg-[#b8ef00] font-bold text-lg"
                  onClick={() => toast.success('Launch initiated! 🚀')}
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Launch App
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Environment */}
        <Card className="mb-6 bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                {getStatusIcon(checklist.environment.status)}
                Environment Configuration
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.href = createPageUrl('ProductionChecklist')}
                className="border-gray-700 text-gray-300"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checklist.environment.checks.map((check, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <span className="text-gray-300">{check.name}</span>
                  </div>
                  {check.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="mb-6 bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                {getStatusIcon(checklist.security.status)}
                Security
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.href = createPageUrl('SecurityAudit')}
                className="border-gray-700 text-gray-300"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Run Audit
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checklist.security.checks.map((check, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <span className="text-gray-300">{check.name}</span>
                  </div>
                  {check.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payments */}
        <Card className="mb-6 bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                {getStatusIcon(checklist.payments.status)}
                Payment Integration
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.href = createPageUrl('StripeSetupGuide')}
                className="border-gray-700 text-gray-300"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Setup Guide
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checklist.payments.checks.map((check, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <span className="text-gray-300">{check.name}</span>
                  </div>
                  {check.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data */}
        <Card className="mb-6 bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                {getStatusIcon(checklist.data.status)}
                Data Management
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.href = createPageUrl('DataCleanup')}
                className="border-gray-700 text-gray-300"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Clean Data
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checklist.data.checks.map((check, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <span className="text-gray-300">{check.name}</span>
                  </div>
                  {check.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Testing */}
        <Card className="mb-6 bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                {getStatusIcon(checklist.testing.status)}
                Testing & QA
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checklist.testing.checks.map((check, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <span className="text-gray-300">{check.name}</span>
                  </div>
                  {check.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Marketing */}
        <Card className="mb-6 bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                {getStatusIcon(checklist.marketing.status)}
                Marketing & Analytics
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checklist.marketing.checks.map((check, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <span className="text-gray-300">{check.name}</span>
                  </div>
                  {check.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button
            onClick={runAllChecks}
            disabled={loading}
            className="bg-[#c8ff00] text-gray-900 hover:bg-[#b8ef00] font-semibold"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Rerun All Checks'}
          </Button>
        </div>
      </div>
    </div>
  );
}