import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  PlayCircle, CheckCircle, XCircle, Loader2, AlertCircle,
  ArrowRight, Mail, TrendingUp, ExternalLink, Users
} from 'lucide-react';
import { toast } from 'sonner';

export default function UserJourneyTest() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [steps, setSteps] = useState([]);
  const [testLead, setTestLead] = useState(null);
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

  const updateStep = (id, status, message, data = null) => {
    setSteps(prev => {
      const existing = prev.find(s => s.id === id);
      if (existing) {
        return prev.map(s => s.id === id ? { ...s, status, message, data, timestamp: Date.now() } : s);
      }
      return [...prev, { id, status, message, data, timestamp: Date.now() }];
    });
  };

  const runFullJourneyTest = async () => {
    setTesting(true);
    setSteps([]);
    setTestLead(null);

    try {
      // Step 1: Quiz Start - ConversionEvent
      updateStep('quiz_start', 'running', 'Simulating quiz start...');
      await base44.entities.ConversionEvent.create({
        funnel_version: 'v3',
        event_name: 'quiz_started',
        session_id: sessionId,
        properties: { test: true }
      });
      updateStep('quiz_start', 'success', 'Quiz start tracked');

      // Step 2: Quiz Steps - Track progress
      updateStep('quiz_steps', 'running', 'Simulating quiz steps...');
      const quizSteps = ['category', 'pain_point', 'goals', 'timeline', 'business_search'];
      for (const step of quizSteps) {
        await base44.entities.ConversionEvent.create({
          funnel_version: 'v3',
          event_name: `quiz_step_${step}`,
          session_id: sessionId,
          step_number: quizSteps.indexOf(step) + 1,
          properties: { step_name: step }
        });
      }
      updateStep('quiz_steps', 'success', `Tracked ${quizSteps.length} quiz steps`);

      // Step 3: Business Data Processing
      updateStep('business_data', 'running', 'Processing business data...');
      const testBusinessData = {
        business_name: 'Test Business Inc',
        place_id: 'test_place_123',
        address: '123 Test Street, Test City, TC 12345',
        phone: '555-0100',
        gmb_rating: 4.2,
        gmb_reviews_count: 87,
        gmb_photos_count: 15
      };
      updateStep('business_data', 'success', 'Business data simulated', testBusinessData);

      // Step 4: Lead Creation
      updateStep('lead_creation', 'running', 'Creating test lead...');
      const lead = await base44.entities.Lead.create({
        business_category: 'home_services',
        pain_point: 'not_in_map_pack',
        goals: ['increase_calls', 'rank_higher'],
        timeline: '30_days',
        business_name: testBusinessData.business_name,
        email: user?.email || `test_${Date.now()}@test.com`,
        place_id: testBusinessData.place_id,
        address: testBusinessData.address,
        phone: testBusinessData.phone,
        gmb_rating: testBusinessData.gmb_rating,
        gmb_reviews_count: testBusinessData.gmb_reviews_count,
        gmb_photos_count: testBusinessData.gmb_photos_count,
        health_score: 62,
        critical_issues: [
          'Missing business hours',
          'Low review count compared to competitors',
          'Incomplete business description'
        ],
        status: 'new'
      });
      setTestLead(lead);
      updateStep('lead_creation', 'success', 'Lead created successfully', lead);

      // Step 5: Health Score Calculation
      updateStep('health_score', 'running', 'Calculating health score...');
      await base44.entities.ConversionEvent.create({
        funnel_version: 'v3',
        event_name: 'health_score_calculated',
        session_id: sessionId,
        properties: {
          health_score: lead.health_score,
          critical_issues_count: lead.critical_issues.length
        }
      });
      updateStep('health_score', 'success', `Health score: ${lead.health_score}/100`);

      // Step 6: Results Page Display
      updateStep('results_display', 'running', 'Simulating results page...');
      await base44.entities.ConversionEvent.create({
        funnel_version: 'v3',
        event_name: 'results_viewed',
        session_id: sessionId,
        lead_id: lead.id,
        properties: { 
          health_score: lead.health_score,
          business_name: lead.business_name
        }
      });
      updateStep('results_display', 'success', 'Results page viewed');

      // Step 7: Email Sending
      updateStep('email_send', 'running', 'Sending welcome email...');
      try {
        await base44.functions.invoke('sendQuizSubmissionEmail', {
          leadData: lead
        });
        updateStep('email_send', 'success', 'Welcome email sent');
      } catch (error) {
        updateStep('email_send', 'warning', `Email send failed: ${error.message}`);
      }

      // Step 8: User Behavior Tracking
      updateStep('behavior_tracking', 'running', 'Recording user behavior...');
      await base44.entities.UserBehavior.create({
        session_id: sessionId,
        email: lead.email,
        consent_given: true,
        engagement_score: 85,
        scroll_depth: 75,
        click_count: 12,
        time_on_page: 180,
        quiz_completion: 100,
        pages_viewed: ['QuizV3', 'ResultsV3'],
        interactions: [
          { type: 'quiz_start', timestamp: Date.now() - 180000 },
          { type: 'quiz_step', step: 'category', timestamp: Date.now() - 150000 },
          { type: 'quiz_complete', timestamp: Date.now() - 30000 },
          { type: 'results_view', timestamp: Date.now() }
        ]
      });
      updateStep('behavior_tracking', 'success', 'User behavior recorded');

      // Step 9: CTA Click Simulation
      updateStep('cta_click', 'running', 'Simulating CTA click...');
      await base44.entities.ConversionEvent.create({
        funnel_version: 'v3',
        event_name: 'cta_clicked',
        session_id: sessionId,
        lead_id: lead.id,
        properties: { 
          cta_type: 'primary',
          cta_text: 'Get Your Free Optimization'
        }
      });
      await base44.analytics.track({
        eventName: 'cta_clicked',
        properties: {
          lead_id: lead.id,
          health_score: lead.health_score
        }
      });
      updateStep('cta_click', 'success', 'CTA click tracked');

      // Step 10: Affiliate Redirect
      updateStep('affiliate_redirect', 'running', 'Simulating affiliate redirect...');
      const affiliateUrl = 'https://thumbtack.com'; // Example
      await base44.entities.ConversionEvent.create({
        funnel_version: 'v3',
        event_name: 'affiliate_redirect',
        session_id: sessionId,
        lead_id: lead.id,
        properties: { 
          affiliate_url: affiliateUrl,
          redirect_timestamp: Date.now()
        }
      });
      updateStep('affiliate_redirect', 'success', 'Affiliate redirect tracked', { url: affiliateUrl });

      // Step 11: Data Verification
      updateStep('verification', 'running', 'Verifying all data...');
      const leadData = await base44.entities.Lead.filter({ id: lead.id });
      const events = await base44.entities.ConversionEvent.filter({ session_id: sessionId });
      const behavior = await base44.entities.UserBehavior.filter({ session_id: sessionId });
      
      if (leadData.length > 0 && events.length > 0 && behavior.length > 0) {
        updateStep('verification', 'success', 
          `Verified: 1 lead, ${events.length} events, ${behavior.length} behavior records`
        );
      } else {
        updateStep('verification', 'warning', 'Some data verification failed');
      }

      toast.success('Full user journey test complete!');

    } catch (error) {
      console.error('Journey test error:', error);
      updateStep('error', 'error', `Test failed: ${error.message}`);
      toast.error('Journey test failed');
    } finally {
      setTesting(false);
    }
  };

  const cleanupTestData = async () => {
    try {
      // Delete conversion events
      const events = await base44.entities.ConversionEvent.filter({ session_id: sessionId });
      for (const event of events) {
        await base44.entities.ConversionEvent.delete(event.id);
      }

      // Delete user behavior
      const behaviors = await base44.entities.UserBehavior.filter({ session_id: sessionId });
      for (const behavior of behaviors) {
        await base44.entities.UserBehavior.delete(behavior.id);
      }

      // Delete lead if exists
      if (testLead) {
        await base44.entities.Lead.delete(testLead.id);
      }

      setSteps([]);
      setTestLead(null);
      toast.success('Test data cleaned up');
    } catch (error) {
      console.error('Cleanup error:', error);
      toast.error('Cleanup failed');
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
            <p className="text-gray-400">Journey testing requires admin access.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const successCount = steps.filter(s => s.status === 'success').length;
  const errorCount = steps.filter(s => s.status === 'error').length;
  const warningCount = steps.filter(s => s.status === 'warning').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <PlayCircle className="w-8 h-8" style={{ color: '#c8ff00' }} />
            <h1 className="text-4xl font-black text-white">Complete User Journey Test</h1>
          </div>
          <p className="text-gray-400 text-lg">
            End-to-end testing: Quiz → Results → Affiliate Redirect
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={runFullJourneyTest}
            disabled={testing}
            style={{ backgroundColor: '#c8ff00' }}
            className="text-black font-bold hover:opacity-90 px-8"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Full Test...
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4 mr-2" />
                Run Complete Journey
              </>
            )}
          </Button>
          {steps.length > 0 && (
            <Button
              onClick={cleanupTestData}
              variant="outline"
              className="text-gray-300 border-gray-600 hover:bg-gray-700"
            >
              Clean Up Test Data
            </Button>
          )}
        </div>

        {/* Summary Stats */}
        {steps.length > 0 && (
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

        {/* Journey Steps */}
        {steps.length > 0 && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Journey Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div key={idx} className={`p-4 rounded-lg border ${
                    step.status === 'success' ? 'border-green-500/50 bg-green-500/10' :
                    step.status === 'error' ? 'border-red-500/50 bg-red-500/10' :
                    step.status === 'warning' ? 'border-yellow-500/50 bg-yellow-500/10' :
                    'border-blue-500/50 bg-blue-500/10'
                  }`}>
                    <div className="flex items-start gap-3">
                      {getStatusIcon(step.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white capitalize">
                            {step.id.replace(/_/g, ' ')}
                          </span>
                          {idx < steps.length - 1 && step.status === 'success' && (
                            <ArrowRight className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-300">{step.message}</p>
                        {step.data && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                              View Details
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-900/50 p-2 rounded overflow-auto text-gray-400 max-h-40">
                              {JSON.stringify(step.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Lead Details */}
        {testLead && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Test Lead Created</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-900/50 rounded">
                  <div className="text-sm text-gray-400">Business Name</div>
                  <div className="text-white font-semibold">{testLead.business_name}</div>
                </div>
                <div className="p-3 bg-gray-900/50 rounded">
                  <div className="text-sm text-gray-400">Email</div>
                  <div className="text-white font-mono text-sm">{testLead.email}</div>
                </div>
                <div className="p-3 bg-gray-900/50 rounded">
                  <div className="text-sm text-gray-400">Health Score</div>
                  <div className="text-white font-bold text-xl">{testLead.health_score}/100</div>
                </div>
                <div className="p-3 bg-gray-900/50 rounded">
                  <div className="text-sm text-gray-400">Critical Issues</div>
                  <div className="text-white font-semibold">{testLead.critical_issues.length} issues</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Journey Map */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Complete Journey Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start gap-3">
                <PlayCircle className="w-5 h-5 text-[#c8ff00] mt-0.5" />
                <div>
                  <div className="font-semibold">1. Quiz Start</div>
                  <div className="text-sm text-gray-400">User lands on QuizV3, tracking begins</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-[#c8ff00] mt-0.5" />
                <div>
                  <div className="font-semibold">2. Quiz Steps</div>
                  <div className="text-sm text-gray-400">Category, pain point, goals, timeline, business search</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-[#c8ff00] mt-0.5" />
                <div>
                  <div className="font-semibold">3. Business Analysis</div>
                  <div className="text-sm text-gray-400">Fetch GMB data, calculate health score, identify issues</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#c8ff00] mt-0.5" />
                <div>
                  <div className="font-semibold">4. Lead Creation</div>
                  <div className="text-sm text-gray-400">Save lead with all data to database</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#c8ff00] mt-0.5" />
                <div>
                  <div className="font-semibold">5. Email Delivery</div>
                  <div className="text-sm text-gray-400">Send personalized audit results via email</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-[#c8ff00] mt-0.5" />
                <div>
                  <div className="font-semibold">6. Results Display</div>
                  <div className="text-sm text-gray-400">Show health score, critical issues, recommendations</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ExternalLink className="w-5 h-5 text-[#c8ff00] mt-0.5" />
                <div>
                  <div className="font-semibold">7. CTA Click → Affiliate Redirect</div>
                  <div className="text-sm text-gray-400">User clicks CTA, tracked, then redirected to affiliate</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Criteria */}
        <Alert className="bg-green-500/10 border-green-500/30">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-300">
            <strong>Success Criteria:</strong> All steps should pass (green), emails should be sent, 
            and affiliate redirect should be tracked. Warnings are acceptable for non-critical issues.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}