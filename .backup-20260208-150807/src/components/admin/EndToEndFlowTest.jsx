import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { CheckCircle, XCircle, Loader2, ArrowRight, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function EndToEndFlowTest() {
  const [testing, setTesting] = useState(false);
  const [currentTest, setCurrentTest] = useState('');
  const [results, setResults] = useState([]);

  const runAllFlows = async () => {
    try {
      setTesting(true);
      setResults([]);
      const flowResults = [];

      setCurrentTest('Quiz Flow');
      flowResults.push(await testQuizFlow());
      setResults([...flowResults]);

      setCurrentTest('Checkout Flow');
      flowResults.push(await testCheckoutFlow());
      setResults([...flowResults]);

      setCurrentTest('Email Chain');
      flowResults.push(await testEmailChain());
      setResults([...flowResults]);

      setCurrentTest('Funnel Versions');
      flowResults.push(await testFunnelVersions());
      setResults([...flowResults]);

      setCurrentTest('Data Integrity');
      flowResults.push(await testDataIntegrity());
      setResults([...flowResults]);

      setTesting(false);
      setCurrentTest('');
      
      const passed = flowResults.filter(r => r.passed).length;
      const failed = flowResults.filter(r => !r.passed).length;
      
      if (failed === 0) {
        toast.success(`All ${passed} flows verified ✅`);
      } else {
        toast.error(`${failed} flow(s) need review`);
      }
    } catch (error) {
      setTesting(false);
      setCurrentTest('');
      toast.error('Flow test suite error');
    }
  };

  const testQuizFlow = async () => {
    const steps = [];
    try {
      // Step 1: Check recent leads
      const leads = await base44.entities.Lead.list('-created_date', 5);
      steps.push({ name: 'Lead Creation', passed: leads.length > 0 });

      // Step 2: Check if leads have required data
      const validLead = leads.find(l => l.email && l.business_name);
      steps.push({ name: 'Lead Data Validation', passed: !!validLead });

      // Step 3: Check email logs for welcome emails
      const emailLogs = await base44.entities.EmailLog.filter({ type: 'welcome' });
      steps.push({ name: 'Welcome Email Sent', passed: emailLogs.length > 0 });

      const allPassed = steps.every(s => s.passed);
      return {
        name: 'Quiz → Lead → Email Flow',
        passed: allPassed,
        steps,
        message: allPassed ? 'Complete flow working' : 'Flow has issues'
      };
    } catch (error) {
      return {
        name: 'Quiz → Lead → Email Flow',
        passed: false,
        steps,
        message: 'Flow test failed',
        error: error.message
      };
    }
  };

  const testCheckoutFlow = async () => {
    const steps = [];
    try {
      // Step 1: Check orders exist
      const orders = await base44.entities.Order.list('-created_date', 5);
      steps.push({ name: 'Order Creation', passed: orders.length > 0 });

      // Step 2: Validate order data
      const validOrder = orders.find(o => o.total_amount && o.email);
      steps.push({ name: 'Order Data Complete', passed: !!validOrder });

      // Step 3: Check order confirmation emails
      const confirmEmails = await base44.entities.EmailLog.filter({ type: 'order_confirmation' });
      steps.push({ name: 'Confirmation Email', passed: confirmEmails.length > 0 });

      const allPassed = steps.every(s => s.passed);
      return {
        name: 'Checkout → Order → Confirmation',
        passed: allPassed,
        steps,
        message: allPassed ? 'Checkout flow operational' : 'Checkout has issues'
      };
    } catch (error) {
      return {
        name: 'Checkout → Order → Confirmation',
        passed: false,
        steps,
        message: 'Checkout test failed',
        error: error.message
      };
    }
  };

  const testEmailChain = async () => {
    const steps = [];
    try {
      // Check different email types exist
      const emailTypes = ['welcome', 'order_confirmation', 'abandoned_cart', 'nurture'];
      
      for (const type of emailTypes) {
        const emails = await base44.entities.EmailLog.filter({ type });
        steps.push({ 
          name: `${type} emails`, 
          passed: emails.length > 0,
          count: emails.length 
        });
      }

      // Check email success rate
      const allEmails = await base44.entities.EmailLog.list('', 50);
      const sentEmails = allEmails.filter(e => e.status === 'sent');
      const successRate = allEmails.length > 0 ? (sentEmails.length / allEmails.length) * 100 : 0;
      steps.push({ 
        name: 'Success Rate', 
        passed: successRate >= 95,
        rate: successRate.toFixed(1) + '%'
      });

      const allPassed = steps.every(s => s.passed);
      return {
        name: 'Email Delivery Chain',
        passed: allPassed,
        steps,
        message: allPassed ? 'All email types working' : 'Email issues detected'
      };
    } catch (error) {
      return {
        name: 'Email Delivery Chain',
        passed: false,
        steps,
        message: 'Email test failed',
        error: error.message
      };
    }
  };

  const testFunnelVersions = async () => {
    const steps = [];
    try {
      // Check conversion events for different funnels
      const funnels = ['v2', 'v3', 'geenius'];
      
      for (const funnel of funnels) {
        const events = await base44.entities.ConversionEvent.filter({ funnel_version: funnel });
        steps.push({ 
          name: `${funnel.toUpperCase()} Funnel`, 
          passed: events.length > 0,
          events: events.length 
        });
      }

      // Check if funnel settings exist
      const settings = await base44.entities.AppSettings.filter({ category: 'general' });
      const hasFunnelConfig = settings.some(s => s.setting_key === 'active_funnel_mode');
      steps.push({ name: 'Funnel Configuration', passed: hasFunnelConfig });

      const allPassed = steps.every(s => s.passed);
      return {
        name: 'Funnel Version Tests',
        passed: allPassed,
        steps,
        message: allPassed ? 'All funnels operational' : 'Funnel issues found'
      };
    } catch (error) {
      return {
        name: 'Funnel Version Tests',
        passed: false,
        steps,
        message: 'Funnel test failed',
        error: error.message
      };
    }
  };

  const testDataIntegrity = async () => {
    const steps = [];
    try {
      // Check for duplicate leads by email
      const leads = await base44.entities.Lead.list('', 100);
      const emails = leads.map(l => l.email).filter(Boolean);
      const uniqueEmails = new Set(emails);
      const hasDupes = emails.length !== uniqueEmails.size;
      steps.push({ 
        name: 'No Duplicate Leads', 
        passed: !hasDupes,
        info: `${uniqueEmails.size} unique of ${emails.length} total`
      });

      // Check lead scoring
      const scoredLeads = leads.filter(l => l.lead_score !== undefined && l.lead_score !== null);
      const scoringRate = leads.length > 0 ? (scoredLeads.length / leads.length) * 100 : 0;
      steps.push({ 
        name: 'Lead Scoring Active', 
        passed: scoringRate >= 80,
        rate: scoringRate.toFixed(0) + '%'
      });

      // Check order totals are valid
      const orders = await base44.entities.Order.list('', 50);
      const invalidOrders = orders.filter(o => !o.total_amount || o.total_amount <= 0);
      steps.push({ 
        name: 'Valid Order Totals', 
        passed: invalidOrders.length === 0,
        info: `${orders.length - invalidOrders.length}/${orders.length} valid`
      });

      // Check recent activity
      const recentLeads = leads.filter(l => {
        const created = new Date(l.created_date);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return created > dayAgo;
      });
      steps.push({ 
        name: 'Recent Activity', 
        passed: recentLeads.length > 0,
        count: recentLeads.length
      });

      const allPassed = steps.every(s => s.passed);
      return {
        name: 'Data Integrity Check',
        passed: allPassed,
        steps,
        message: allPassed ? 'Data is clean and valid' : 'Data quality issues found'
      };
    } catch (error) {
      return {
        name: 'Data Integrity Check',
        passed: false,
        steps,
        message: 'Integrity test failed',
        error: error.message
      };
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-[#c8ff00]" />
            End-to-End Flow Testing
          </CardTitle>
          <Button
            onClick={runAllFlows}
            disabled={testing}
            size="sm"
            className="bg-[#c8ff00] text-black hover:bg-[#b8ef00]"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Run All Flows'
            )}
          </Button>
        </div>
        {testing && currentTest && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Testing: {currentTest}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {results.length > 0 ? (
          <div className="space-y-4">
            {results.map((result, i) => (
              <div
                key={i}
                className={`p-4 rounded-lg border ${
                  result.passed
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-red-500/5 border-red-500/20'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {result.passed ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="text-white font-medium">{result.name}</span>
                  </div>
                  <Badge variant={result.passed ? "default" : "destructive"} className="text-xs">
                    {result.passed ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>
                
                <p className="text-xs text-gray-400 mb-3">{result.message}</p>
                
                {result.steps && result.steps.length > 0 && (
                  <div className="space-y-2 pl-4 border-l-2 border-gray-700">
                    {result.steps.map((step, si) => (
                      <div key={si} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {step.passed ? (
                            <CheckCircle className="w-3 h-3 text-green-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-400" />
                          )}
                          <span className="text-gray-300">{step.name}</span>
                        </div>
                        {(step.count !== undefined || step.events !== undefined || step.rate || step.info) && (
                          <span className="text-gray-500">
                            {step.count !== undefined && `${step.count} found`}
                            {step.events !== undefined && `${step.events} events`}
                            {step.rate && step.rate}
                            {step.info && step.info}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {result.error && (
                  <p className="text-xs text-red-400 mt-2">Error: {result.error}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Run complete flow tests to verify system integration</p>
            <p className="text-xs mt-2">Tests: Quiz, Checkout, Emails, Funnels, Data Quality</p>
          </div>
        )}

        <div className="pt-4 border-t border-gray-700">
          <div className="text-xs text-gray-400 space-y-2">
            <div className="font-semibold">Flow Coverage:</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1">
                <ArrowRight className="w-3 h-3" />
                Quiz → Lead → Email
              </div>
              <div className="flex items-center gap-1">
                <ArrowRight className="w-3 h-3" />
                Checkout → Order → Confirm
              </div>
              <div className="flex items-center gap-1">
                <ArrowRight className="w-3 h-3" />
                Email Delivery Chain
              </div>
              <div className="flex items-center gap-1">
                <ArrowRight className="w-3 h-3" />
                V2/V3/Geenius Funnels
              </div>
              <div className="flex items-center gap-1">
                <ArrowRight className="w-3 h-3" />
                Data Integrity
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}