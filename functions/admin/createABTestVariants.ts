import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Create QuizV3 A/B test variants
    const tests = [
      {
        name: 'QuizV3 CTA Button Test',
        page: 'quiz',
        element: 'cta_button',
        status: 'active',
        variants: [
          {
            id: 'control',
            name: 'Control - Start Audit',
            content: { text: 'Start Your Free Audit', icon: 'arrow' }
          },
          {
            id: 'variant_a',
            name: 'Variant A - Urgency',
            content: { text: 'Claim My Free Audit Now', icon: 'zap' }
          },
          {
            id: 'variant_b',
            name: 'Variant B - Benefit',
            content: { text: 'See What\'s Costing Me Leads', icon: 'arrow' }
          }
        ],
        traffic_split: {
          control: 34,
          variant_a: 33,
          variant_b: 33
        },
        start_date: new Date().toISOString()
      },
      {
        name: 'QuizV3 Results CTA Test',
        page: 'quiz',
        element: 'results_cta',
        status: 'active',
        variants: [
          {
            id: 'control',
            name: 'Control',
            content: { text: 'Yes, Auto-Fix My Rankings Now' }
          },
          {
            id: 'variant_a',
            name: 'Variant A - Free Trial',
            content: { text: 'Start My Free 7-Day Trial' }
          },
          {
            id: 'variant_b',
            name: 'Variant B - Territory',
            content: { text: 'Claim My Territory Before Competitors' }
          }
        ],
        traffic_split: {
          control: 34,
          variant_a: 33,
          variant_b: 33
        },
        start_date: new Date().toISOString()
      }
    ];

    const created = [];
    for (const test of tests) {
      // Check if test already exists
      const existing = await base44.asServiceRole.entities.ABTest.filter({
        name: test.name
      });

      if (existing.length === 0) {
        const result = await base44.asServiceRole.entities.ABTest.create(test);
        created.push(result);
      }
    }

    return Response.json({
      success: true,
      created: created.length,
      message: `Created ${created.length} new A/B tests`
    });
  } catch (error) {
    console.error('Error creating A/B tests:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}));