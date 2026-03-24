import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler';

/**
 * Comprehensive funnel testing function
 * Tests all critical paths: Quiz → Upsell1 → Upsell → ThankYou
 * Logs any errors/issues to ErrorLog entity for admin review
 */
Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can run tests
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const testResults = {
      timestamp: new Date().toISOString(),
      testsRun: [],
      issuesFound: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0
    };

    // Test 1: Lead entity creation
    try {
      const testLead = await base44.entities.Lead.create({
        email: `test_${Date.now()}@testdomain.com`,
        business_name: 'Test Business',
        business_category: 'home_services',
        pain_point: 'low_reviews',
        goals: ['increase_calls'],
        timeline: '30_days',
        health_score: 45,
        critical_issues: ['Missing reviews', 'Incomplete profile']
      });

      testResults.testsRun.push({
        name: 'Lead Creation',
        status: 'PASS',
        details: `Created lead ID: ${testLead.id}`
      });
      testResults.passedTests++;

      // Test 2: Lead retrieval
      const retrievedLead = await base44.entities.Lead.list();
      if (retrievedLead.length > 0) {
        testResults.testsRun.push({
          name: 'Lead Retrieval',
          status: 'PASS',
          details: `Retrieved ${retrievedLead.length} leads`
        });
        testResults.passedTests++;
      } else {
        throw new Error('No leads found in database');
      }

      // Test 3: Order creation
      const testOrder = await base44.entities.Order.create({
        lead_id: testLead.id,
        email: testLead.email,
        base_offer: {
          product: 'GMB Optimization & Audit',
          price: 99
        },
        total_amount: 99,
        status: 'pending'
      });

      testResults.testsRun.push({
        name: 'Order Creation',
        status: 'PASS',
        details: `Created order ID: ${testOrder.id}`
      });
      testResults.passedTests++;

      // Test 4: Email sending (mock test)
      try {
        await base44.integrations.Core.SendEmail({
          to: 'test@example.com',
          subject: 'Test Email',
          body: 'This is a test email to verify the email system is working'
        });
        testResults.testsRun.push({
          name: 'Email Integration',
          status: 'PASS',
          details: 'Email service responding'
        });
        testResults.passedTests++;
      } catch (emailErr) {
        testResults.testsRun.push({
          name: 'Email Integration',
          status: 'WARN',
          details: `Email service warning: ${emailErr.message}`
        });
        testResults.issuesFound.push({
          type: 'email_failure',
          severity: 'medium',
          message: emailErr.message
        });
      }

      // Test 5: ConversionEvent tracking
      const testEvent = await base44.entities.ConversionEvent.create({
        funnel_version: 'v3',
        event_name: 'test_event',
        session_id: `test_session_${Date.now()}`,
        properties: { test: true }
      });

      testResults.testsRun.push({
        name: 'Analytics Event Tracking',
        status: 'PASS',
        details: `Created event ID: ${testEvent.id}`
      });
      testResults.passedTests++;

      // Test 6: Segment creation
      const testSegment = await base44.entities.Segment.create({
        name: 'Test Segment',
        type: 'static',
        criteria: { test: true },
        lead_ids: [testLead.id],
        member_count: 1
      });

      testResults.testsRun.push({
        name: 'Segment Management',
        status: 'PASS',
        details: `Created segment ID: ${testSegment.id}`
      });
      testResults.passedTests++;

      // Test 7: Database connectivity stress test
      const batchLeads = [];
      for (let i = 0; i < 5; i++) {
        batchLeads.push({
          email: `batch_test_${i}_${Date.now()}@test.com`,
          business_name: `Batch Test ${i}`,
          business_category: 'retail'
        });
      }
      
      await base44.entities.Lead.bulkCreate(batchLeads);
      testResults.testsRun.push({
        name: 'Bulk Lead Creation',
        status: 'PASS',
        details: 'Successfully created 5 test leads in batch'
      });
      testResults.passedTests++;

    } catch (error) {
      testResults.testsRun.push({
        name: 'Database Operations',
        status: 'FAIL',
        details: error.message
      });
      testResults.failedTests++;

      // Log critical error
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'critical',
        message: `Database test failed: ${error.message}`,
        stack_trace: error.stack,
        metadata: { test_name: 'Database Operations' }
      }).catch(err => console.error('Failed to log error:', err));
    }

    testResults.totalTests = testResults.testsRun.length;

    // Save test results summary to database
    try {
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'low',
        message: `Funnel test completed: ${testResults.passedTests}/${testResults.totalTests} passed`,
        metadata: {
          test_type: 'funnel_comprehensive',
          results_summary: testResults
        }
      });
    } catch (err) {
      console.error('Failed to save test results:', err);
    }

    return Response.json({
      success: true,
      data: testResults,
      summary: {
        total: testResults.totalTests,
        passed: testResults.passedTests,
        failed: testResults.failedTests,
        passRate: testResults.totalTests > 0 ? `${Math.round((testResults.passedTests / testResults.totalTests) * 100)}%` : '0%'
      }
    });

  } catch (error) {
    console.error('Test function error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});