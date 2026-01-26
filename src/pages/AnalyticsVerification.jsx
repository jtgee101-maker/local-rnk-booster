import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity, CheckCircle, XCircle, Loader2, AlertCircle,
  TrendingUp, Mail, MousePointer, ShoppingCart, Zap
} from 'lucide-react';
import { toast } from 'sonner';

export default function AnalyticsVerification() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [checks, setChecks] = useState([]);
  const [sessionId] = useState(`test_${Date.now()}`);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const updateCheck = (id, status, message, data = null) => {
    setChecks(prev => {
      const existing = prev.find(c => c.id === id);
      if (existing) {
        return prev.map(c => c.id === id ? { ...c, status, message, data, timestamp: Date.now() } : c);
      }
      return [...prev, { id, status, message, data, timestamp: Date.now() }];
    });
  };

  const runAllTests = async () => {
    setTesting(true);
    setChecks([]);
    
    try {
      // Test 1: Base44 Analytics Track
      updateCheck('base44_track', 'running', 'Testing base44.analytics.track...');
      try {
        await base44.analytics.track({
          eventName: 'analytics_verification_test',
          properties: {
            test_type: 'verification',
            session_id: sessionId,
            timestamp: Date.now()
          }
        });
        updateCheck('base44_track', 'success', 'Base44 analytics tracking working');
      } catch (error) {
        updateCheck('base44_track', 'error', `Analytics track failed: ${error.message}`);
      }

      // Test 2: ConversionEvent Creation
      updateCheck('conversion_event', 'running', 'Testing ConversionEvent entity...');
      try {
        const event = await base44.entities.ConversionEvent.create({
          funnel_version: 'v3',
          event_name: 'test_conversion_event',
          session_id: sessionId,
          properties: { test: true }
        });
        updateCheck('conversion_event', 'success', 'ConversionEvent creation working', event);
      } catch (error) {
        updateCheck('conversion_event', 'error', `ConversionEvent failed: ${error.message}`);
      }

      // Test 3: UserBehavior Tracking
      updateCheck('user_behavior', 'running', 'Testing UserBehavior entity...');
      try {
        const behavior = await base44.entities.UserBehavior.create({
          session_id: sessionId,
          email: user?.email || 'test@test.com',
          consent_given: true,
          engagement_score: 75,
          scroll_depth: 50,
          click_count: 5,
          time_on_page: 120,
          interactions: [{ type: 'test', timestamp: Date.now() }]
        });
        updateCheck('user_behavior', 'success', 'UserBehavior tracking working', behavior);
      } catch (error) {
        updateCheck('user_behavior', 'error', `UserBehavior failed: ${error.message}`);
      }

      // Test 4: EmailLog Tracking
      updateCheck('email_log', 'running', 'Testing EmailLog entity...');
      try {
        const emailLog = await base44.entities.EmailLog.create({
          to: user?.email || 'test@test.com',
          from: 'LocalRank.ai',
          subject: 'Test Email - Analytics Verification',
          type: 'other',
          status: 'sent',
          metadata: { test: true, session_id: sessionId }
        });
        updateCheck('email_log', 'success', 'EmailLog tracking working', emailLog);
      } catch (error) {
        updateCheck('email_log', 'error', `EmailLog failed: ${error.message}`);
      }

      // Test 5: Check Recent Analytics Data
      updateCheck('recent_data', 'running', 'Checking recent analytics data...');
      try {
        const recentEvents = await base44.entities.ConversionEvent.list('-created_date', 5);
        const recentBehavior = await base44.entities.UserBehavior.list('-created_date', 5);
        const recentEmails = await base44.entities.EmailLog.list('-created_date', 5);
        
        updateCheck('recent_data', 'success', 
          `Recent data: ${recentEvents.length} events, ${recentBehavior.length} behaviors, ${recentEmails.length} emails`,
          { events: recentEvents.length, behaviors: recentBehavior.length, emails: recentEmails.length }
        );
      } catch (error) {
        updateCheck('recent_data', 'error', `Data fetch failed: ${error.message}`);
      }

      // Test 6: Campaign Tracking (if campaigns exist)
      updateCheck('campaign_tracking', 'running', 'Testing campaign tracking...');
      try {
        const campaigns = await base44.entities.Campaign.list('-created_date', 1);
        if (campaigns.length > 0) {
          const testClick = await base44.entities.CampaignClick.create({
            campaign_id: campaigns[0].id,
            short_code: 'test123',
            ip_address: '127.0.0.1',
            user_agent: navigator.userAgent,
            device_type: 'desktop'
          });
          updateCheck('campaign_tracking', 'success', 'Campaign tracking working', testClick);
        } else {
          updateCheck('campaign_tracking', 'warning', 'No campaigns to test (create one first)');
        }
      } catch (error) {
        updateCheck('campaign_tracking', 'error', `Campaign tracking failed: ${error.message}`);
      }

      // Test 7: ABTest Event Tracking
      updateCheck('abtest_tracking', 'running', 'Testing A/B test tracking...');
      try {
        const abtests = await base44.entities.ABTest.filter({ status: 'active' });
        if (abtests.length > 0) {
          const testEvent = await base44.entities.ABTestEvent.create({
            test_id: abtests[0].id,
            variant_id: 'test_variant',
            session_id: sessionId,
            event_type: 'view'
          });
          updateCheck('abtest_tracking', 'success', 'A/B test tracking working', testEvent);
        } else {
          updateCheck('abtest_tracking', 'warning', 'No active A/B tests to verify');
        }
      } catch (error) {
        updateCheck('abtest_tracking', 'error', `A/B test tracking failed: ${error.message}`);
      }

      toast.success('Analytics verification complete!');
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Verification encountered errors');
    } finally {
      setTesting(false);
    }
  };

  const cleanupTestData = async () => {
    try {
      // Delete test data created during verification
      const events = await base44.entities.ConversionEvent.filter({ session_id: sessionId });
      const behaviors = await base44.entities.UserBehavior.filter({ session_id: sessionId });
      const emails = await base44.entities.EmailLog.filter({ 
        subject: 'Test Email - Analytics Verification' 
      });

      for (const event of events) {
        await base44.entities.ConversionEvent.delete(event.id);
      }
      for (const behavior of behaviors) {
        await base44.entities.UserBehavior.delete(behavior.id);
      }
      for (const email of emails) {
        await base44.entities.EmailLog.delete(email.id);
      }

      toast.success('Test data cleaned up');
      setChecks([]);
    } catch (error) {
      console.error('Cleanup error:', error);
      toast.error('Failed to cleanup test data');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'running': return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'border-green-500/50 bg-green-500/10';
      case 'error': return 'border-red-500/50 bg-red-500/10';
      case 'warning': return 'border-yellow-500/50 bg-yellow-500/10';
      case 'running': return 'border-blue-500/50 bg-blue-500/10';
      default: return 'border-gray-700 bg-gray-800/50';
    }
  };

  const getCategoryIcon = (id) => {
    if (id.includes('track')) return <TrendingUp className="w-5 h-5" />;
    if (id.includes('email')) return <Mail className="w-5 h-5" />;
    if (id.includes('behavior')) return <MousePointer className="w-5 h-5" />;
    if (id.includes('campaign')) return <Zap className="w-5 h-5" />;
    return <Activity className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#c8ff00] animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <Card className="bg-gray-800/50 border-red-500/50 max-w-md">
          <CardContent className="py-8 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Admin Access Required</h2>
            <p className="text-gray-400">Analytics verification requires admin access.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const successCount = checks.filter(c => c.status === 'success').length;
  const errorCount = checks.filter(c => c.status === 'error').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Activity className="w-8 h-8" style={{ color: '#c8ff00' }} />
            <h1 className="text-4xl font-black text-white">Analytics Verification</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Test all tracking systems to ensure data collection is working properly
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={runAllTests}
            disabled={testing}
            style={{ backgroundColor: '#c8ff00' }}
            className="text-black font-bold hover:opacity-90"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 mr-2" />
                Run All Tests
              </>
            )}
          </Button>
          {checks.length > 0 && (
            <Button
              onClick={cleanupTestData}
              variant="outline"
              className="text-gray-300 border-gray-600 hover:bg-gray-700"
            >
              Clean Up Test Data
            </Button>
          )}
        </div>

        {/* Summary */}
        {checks.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="py-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">{successCount}</div>
                <div className="text-sm text-gray-400">Passed</div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/30">
              <CardContent className="py-4 text-center">
                <AlertCircle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">{warningCount}</div>
                <div className="text-sm text-gray-400">Warnings</div>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="py-4 text-center">
                <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">{errorCount}</div>
                <div className="text-sm text-gray-400">Failed</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Test Results */}
        {checks.length > 0 && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checks.map((check) => (
                  <div
                    key={check.id}
                    className={`p-4 rounded-lg border ${getStatusColor(check.status)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getStatusIcon(check.status)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getCategoryIcon(check.id)}
                          <span className="font-semibold text-white capitalize">
                            {check.id.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">{check.message}</p>
                        {check.data && (
                          <pre className="mt-2 text-xs bg-gray-900/50 p-2 rounded overflow-auto text-gray-400">
                            {JSON.stringify(check.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">What Gets Tested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-[#c8ff00] mt-0.5" />
                <div>
                  <div className="font-semibold">Base44 Analytics</div>
                  <div className="text-sm text-gray-400">Custom event tracking via base44.analytics.track()</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Activity className="w-5 h-5 text-[#c8ff00] mt-0.5" />
                <div>
                  <div className="font-semibold">Conversion Events</div>
                  <div className="text-sm text-gray-400">Funnel tracking and conversion event logging</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MousePointer className="w-5 h-5 text-[#c8ff00] mt-0.5" />
                <div>
                  <div className="font-semibold">User Behavior</div>
                  <div className="text-sm text-gray-400">Session tracking, engagement scores, interactions</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#c8ff00] mt-0.5" />
                <div>
                  <div className="font-semibold">Email Logging</div>
                  <div className="text-sm text-gray-400">Email delivery tracking and analytics</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-[#c8ff00] mt-0.5" />
                <div>
                  <div className="font-semibold">Campaign Tracking</div>
                  <div className="text-sm text-gray-400">Campaign clicks and attribution</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShoppingCart className="w-5 h-5 text-[#c8ff00] mt-0.5" />
                <div>
                  <div className="font-semibold">A/B Test Events</div>
                  <div className="text-sm text-gray-400">Variant exposure and conversion tracking</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Alert className="bg-blue-500/10 border-blue-500/30">
          <AlertCircle className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-300">
            <strong>Tip:</strong> Run this verification after making changes to tracking code, 
            before production launch, and periodically to ensure data quality.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}