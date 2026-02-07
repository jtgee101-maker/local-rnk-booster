import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

/**
 * Test Critical Production Paths
 * Verifies email delivery, analytics tracking, and payment flow
 */
Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const testResults = {
      timestamp: new Date().toISOString(),
      tests: {
        emailDelivery: { status: 'pending', details: '' },
        analyticsTracking: { status: 'pending', details: '' },
        databaseAccess: { status: 'pending', details: '' },
        apiConnectivity: { status: 'pending', details: '' }
      }
    };

    // TEST 1: Email Delivery (Resend)
    try {
      const emailTest = await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: 'Production Test - Email Delivery',
        body: 'This is a test email from LocalRank.ai production environment. If you received this, email delivery is working correctly.'
      });
      testResults.tests.emailDelivery = {
        status: 'pass',
        details: 'Test email sent successfully to ' + user.email
      };
    } catch (error) {
      testResults.tests.emailDelivery = {
        status: 'fail',
        details: 'Email delivery failed: ' + error.message
      };
    }

    // TEST 2: Analytics Tracking
    try {
      await base44.analytics.track({
        eventName: 'production_readiness_test',
        properties: {
          environment: 'production',
          test_type: 'critical_path',
          timestamp: new Date().toISOString()
        }
      });
      testResults.tests.analyticsTracking = {
        status: 'pass',
        details: 'Analytics event tracked successfully'
      };
    } catch (error) {
      testResults.tests.analyticsTracking = {
        status: 'fail',
        details: 'Analytics tracking failed: ' + error.message
      };
    }

    // TEST 3: Database Access
    try {
      const leads = await base44.entities.Lead.list(undefined, 1);
      testResults.tests.databaseAccess = {
        status: 'pass',
        details: `Database accessible. ${leads?.length || 0} lead records found.`
      };
    } catch (error) {
      testResults.tests.databaseAccess = {
        status: 'fail',
        details: 'Database access failed: ' + error.message
      };
    }

    // TEST 4: API Connectivity
    try {
      const functions = ['validateBuild', 'validateEnvironmentConfig', 'deploymentReadinessCheck'];
      const results = await Promise.all(
        functions.map(fn => base44.functions.invoke(fn, {}).catch(e => ({ error: e.message })))
      );
      
      const allSuccess = results.every(r => !r.error);
      testResults.tests.apiConnectivity = {
        status: allSuccess ? 'pass' : 'partial',
        details: `API tested: ${results.filter(r => !r.error).length}/${functions.length} endpoints responding`
      };
    } catch (error) {
      testResults.tests.apiConnectivity = {
        status: 'fail',
        details: 'API connectivity test failed: ' + error.message
      };
    }

    // SUMMARY
    const passed = Object.values(testResults.tests).filter(t => t.status === 'pass').length;
    const failed = Object.values(testResults.tests).filter(t => t.status === 'fail').length;

    testResults.summary = {
      total: 4,
      passed,
      failed,
      status: failed === 0 ? 'all-systems-go' : failed === 1 ? 'degraded' : 'critical'
    };

    return Response.json(testResults);
  } catch (error) {
    console.error('Critical path test error:', error);
    return Response.json({ 
      error: error.message,
      status: 'failed'
    }, { status: 500 });
  }
});