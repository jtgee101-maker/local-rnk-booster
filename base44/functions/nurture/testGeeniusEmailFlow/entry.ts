import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Test function to demonstrate the complete GeeNius email flow
 * Creates test leads and sends through the entire sequence
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 });
    }

    const { test_type } = await req.json();

    if (!test_type) {
      return new Response(JSON.stringify({ error: 'Missing test_type' }), { status: 400 });
    }

    const results = [];

    // TEST 1: Audit Submitted Flow
    if (test_type === 'audit_submitted_flow') {
      const testLead = await base44.entities.Lead.create({
        email: `test-audit-${Date.now()}@localrank.ai`,
        business_name: 'Test Business - Audit Flow',
        contact_name: 'Test User',
        health_score: 72,
        status: 'new',
        last_quiz_date: new Date().toISOString()
      });

      // Send audit_submitted email
      const emailResult = await base44.functions.invoke('nurture/geeniusEmailSequences', {
        lead_id: testLead.id,
        sequence_key: 'audit_submitted'
      });

      results.push({
        test: 'audit_submitted_flow',
        lead_id: testLead.id,
        lead_email: testLead.email,
        email_sent: emailResult.data.success,
        resend_id: emailResult.data.resend_id
      });
    }

    // TEST 2: Pathway Selection 2h Nudge
    if (test_type === 'pathway_nudge_flow') {
      const testLead = await base44.entities.Lead.create({
        email: `test-pathway-${Date.now()}@localrank.ai`,
        business_name: 'Test Business - Pathway Flow',
        contact_name: 'Test User',
        health_score: 65,
        status: 'new',
        last_quiz_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      });

      const emailResult = await base44.functions.invoke('nurture/geeniusEmailSequences', {
        lead_id: testLead.id,
        sequence_key: 'pathway_selection_nudge_2h'
      });

      results.push({
        test: 'pathway_nudge_flow',
        lead_id: testLead.id,
        lead_email: testLead.email,
        email_sent: emailResult.data.success,
        resend_id: emailResult.data.resend_id
      });
    }

    // TEST 3: Grant Pathway Selected
    if (test_type === 'grant_pathway_flow') {
      const testLead = await base44.entities.Lead.create({
        email: `test-grant-${Date.now()}@localrank.ai`,
        business_name: 'Test Business - Grant Path',
        contact_name: 'Test User',
        health_score: 58,
        status: 'new',
        last_quiz_date: new Date().toISOString()
      });

      // Simulate pathway selection
      await base44.entities.Lead.update(testLead.id, {
        status: 'contacted',
        admin_notes: 'Selected Pathway 1 - Grant'
      });

      const emailResult = await base44.functions.invoke('nurture/geeniusEmailSequences', {
        lead_id: testLead.id,
        sequence_key: 'grant_pathway_selected'
      });

      results.push({
        test: 'grant_pathway_flow',
        lead_id: testLead.id,
        lead_email: testLead.email,
        email_sent: emailResult.data.success,
        resend_id: emailResult.data.resend_id
      });
    }

    // TEST 4: DFY Pathway Selected
    if (test_type === 'dfy_pathway_flow') {
      const testLead = await base44.entities.Lead.create({
        email: `test-dfy-${Date.now()}@localrank.ai`,
        business_name: 'Test Business - DFY Path',
        contact_name: 'Test User',
        health_score: 68,
        status: 'new',
        last_quiz_date: new Date().toISOString()
      });

      const emailResult = await base44.functions.invoke('nurture/geeniusEmailSequences', {
        lead_id: testLead.id,
        sequence_key: 'dfy_pathway_selected'
      });

      results.push({
        test: 'dfy_pathway_flow',
        lead_id: testLead.id,
        lead_email: testLead.email,
        email_sent: emailResult.data.success,
        resend_id: emailResult.data.resend_id
      });
    }

    // TEST 5: DIY Pathway Selected
    if (test_type === 'diy_pathway_flow') {
      const testLead = await base44.entities.Lead.create({
        email: `test-diy-${Date.now()}@localrank.ai`,
        business_name: 'Test Business - DIY Path',
        contact_name: 'Test User',
        health_score: 75,
        status: 'new',
        last_quiz_date: new Date().toISOString()
      });

      const emailResult = await base44.functions.invoke('nurture/geeniusEmailSequences', {
        lead_id: testLead.id,
        sequence_key: 'diy_pathway_selected'
      });

      results.push({
        test: 'diy_pathway_flow',
        lead_id: testLead.id,
        lead_email: testLead.email,
        email_sent: emailResult.data.success,
        resend_id: emailResult.data.resend_id
      });
    }

    // TEST 6: Checkout Abandoned 1h
    if (test_type === 'checkout_abandoned_flow') {
      const testLead = await base44.entities.Lead.create({
        email: `test-cart-${Date.now()}@localrank.ai`,
        business_name: 'Test Business - Cart Abandoned',
        contact_name: 'Test User',
        health_score: 72,
        status: 'new',
        last_quiz_date: new Date().toISOString()
      });

      const emailResult = await base44.functions.invoke('nurture/geeniusEmailSequences', {
        lead_id: testLead.id,
        sequence_key: 'checkout_abandoned_1h'
      });

      results.push({
        test: 'checkout_abandoned_flow',
        lead_id: testLead.id,
        lead_email: testLead.email,
        email_sent: emailResult.data.success,
        resend_id: emailResult.data.resend_id
      });
    }

    // TEST 7: Post-Purchase Welcome
    if (test_type === 'post_purchase_flow') {
      const testLead = await base44.entities.Lead.create({
        email: `test-purchase-${Date.now()}@localrank.ai`,
        business_name: 'Test Business - Post Purchase',
        contact_name: 'Test User',
        health_score: 80,
        status: 'converted',
        last_quiz_date: new Date().toISOString()
      });

      const emailResult = await base44.functions.invoke('nurture/geeniusEmailSequences', {
        lead_id: testLead.id,
        sequence_key: 'post_purchase_day1'
      });

      results.push({
        test: 'post_purchase_flow',
        lead_id: testLead.id,
        lead_email: testLead.email,
        email_sent: emailResult.data.success,
        resend_id: emailResult.data.resend_id
      });
    }

    // TEST 8: Run All Tests
    if (test_type === 'run_all') {
      const allTests = [
        'audit_submitted_flow',
        'pathway_nudge_flow',
        'grant_pathway_flow',
        'dfy_pathway_flow',
        'diy_pathway_flow',
        'checkout_abandoned_flow',
        'post_purchase_flow'
      ];

      for (const test of allTests) {
        try {
          const response = await base44.functions.invoke('nurture/testGeeniusEmailFlow', {
            test_type: test
          });
          results.push(...response.data.results);
        } catch (error) {
          results.push({
            test,
            error: error.message
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        test_type,
        total_tests: results.length,
        results
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Test error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});