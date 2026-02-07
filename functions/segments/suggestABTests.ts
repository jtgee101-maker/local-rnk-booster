import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

/**
 * AI-Powered A/B Test Suggestions
 * Analyzes performance and suggests high-impact tests
 */
Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Analyze current performance
    const [orders, leads, currentTests, segments] = await Promise.all([
      base44.asServiceRole.entities.Order.filter({}, '-created_date', 500),
      base44.asServiceRole.entities.Lead.filter({}, '-created_date', 500),
      base44.asServiceRole.entities.ABTest.filter({ status: 'active' }, 'created_date', 50),
      base44.asServiceRole.entities.Segment.filter({ is_active: true }, '-member_count', 20)
    ]);

    const conversionRate = leads.length > 0 ? (orders.length / leads.length) * 100 : 0;
    const avgOrderValue = orders.length > 0 
      ? orders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / orders.length 
      : 99;

    // Generate test suggestions
    const suggestions = [];

    // Suggestion 1: Low conversion rate - test urgency/scarcity
    if (conversionRate < 10) {
      suggestions.push({
        priority: 'high',
        test_name: 'Urgency & Scarcity Test',
        hypothesis: `Current conversion rate (${conversionRate.toFixed(1)}%) is below benchmark. Adding urgency/scarcity could increase conversions by 30-50%.`,
        page: 'quiz',
        element: 'headline',
        variants: [
          {
            id: 'control',
            name: 'Current Headline',
            content: { headline: 'Discover Your GMB Health Score' }
          },
          {
            id: 'urgency',
            name: 'Urgency Focused',
            content: { headline: 'You\'re Losing $15,000/Year - Find Out Why (Free Audit)' }
          },
          {
            id: 'scarcity',
            name: 'Scarcity Focused',
            content: { headline: 'Only 7 Free Audits Left Today - Claim Yours Now' }
          }
        ],
        expected_impact: '+35% conversion rate',
        confidence: 'high'
      });
    }

    // Suggestion 2: High traffic segment with low conversion
    const lowConvertingSegment = segments.find(s => 
      s.member_count > 20 && (s.conversion_rate || 0) < 15
    );

    if (lowConvertingSegment) {
      suggestions.push({
        priority: 'high',
        test_name: `Segment-Specific Messaging for ${lowConvertingSegment.name}`,
        hypothesis: `${lowConvertingSegment.name} has ${lowConvertingSegment.member_count} members but only ${lowConvertingSegment.conversion_rate}% conversion. Tailored messaging could improve this.`,
        page: 'quiz',
        element: 'results_cta',
        variants: [
          {
            id: 'control',
            name: 'Generic CTA',
            content: { cta: 'Get Your Full Report' }
          },
          {
            id: 'segment_specific',
            name: 'Segment-Specific CTA',
            content: { 
              cta: generateSegmentSpecificCTA(lowConvertingSegment.name),
              include_segment_testimonial: true
            }
          }
        ],
        expected_impact: '+25% conversion for this segment',
        confidence: 'medium'
      });
    }

    // Suggestion 3: Pricing page optimization
    const pricingPageViews = await base44.asServiceRole.entities.ConversionEvent.filter({
      event_name: 'pricing_page_viewed'
    }, 'created_date', 1000);

    const pricingConversions = await base44.asServiceRole.entities.ConversionEvent.filter({
      event_name: 'checkout_initiated'
    }, 'created_date', 1000);

    const pricingConversionRate = pricingPageViews.length > 0 
      ? (pricingConversions.length / pricingPageViews.length) * 100 
      : 0;

    if (pricingConversionRate < 30) {
      suggestions.push({
        priority: 'medium',
        test_name: 'Pricing Page Value Prop Test',
        hypothesis: `Only ${pricingConversionRate.toFixed(1)}% of pricing page visitors convert. Testing different value propositions could increase this.`,
        page: 'pricing',
        element: 'value_proposition',
        variants: [
          {
            id: 'control',
            name: 'Features Focus',
            content: { focus: 'features' }
          },
          {
            id: 'roi_focus',
            name: 'ROI Focus',
            content: { 
              focus: 'roi',
              headline: 'Stop Paying $100/Lead to Thumbtack',
              subheadline: 'Get YOUR customers directly for $0.33/lead'
            }
          }
        ],
        expected_impact: '+20% pricing page conversion',
        confidence: 'medium'
      });
    }

    // Suggestion 4: Email subject line test (if email open rates are low)
    const recentEmails = await base44.asServiceRole.entities.EmailLog.filter({
      created_date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }
    }, 'created_date', 500);

    const emailsOpened = recentEmails.filter(e => e.open_count > 0);
    const emailOpenRate = recentEmails.length > 0 
      ? (emailsOpened.length / recentEmails.length) * 100 
      : 0;

    if (emailOpenRate < 25 && recentEmails.length > 50) {
      suggestions.push({
        priority: 'high',
        test_name: 'Email Subject Line Optimization',
        hypothesis: `Email open rate is ${emailOpenRate.toFixed(1)}% (below 25% benchmark). Testing subject lines could dramatically improve engagement.`,
        channel: 'email',
        element: 'subject_line',
        variants: [
          {
            id: 'current',
            name: 'Current Approach',
            content: { format: 'standard' }
          },
          {
            id: 'personalized',
            name: 'Personalized + Curiosity',
            content: { 
              format: '[First Name], are you losing customers to Google Maps?',
              personalization: 'high'
            }
          },
          {
            id: 'numbers',
            name: 'Data-Driven',
            content: { 
              format: 'Your business lost $[calculated_amount] last month',
              include_numbers: true
            }
          }
        ],
        expected_impact: '+15% email open rate',
        confidence: 'high'
      });
    }

    // Suggestion 5: Mobile optimization test
    const mobileEvents = await base44.asServiceRole.entities.ConversionEvent.filter({
      'properties.device_type': 'mobile'
    }, 'created_date', 500);

    if (mobileEvents.length > 100) {
      suggestions.push({
        priority: 'medium',
        test_name: 'Mobile Quiz Experience',
        hypothesis: 'Significant mobile traffic detected. Mobile-optimized layout could improve completion rate.',
        page: 'quiz',
        element: 'layout',
        variants: [
          {
            id: 'current',
            name: 'Current Desktop Layout',
            content: { layout: 'desktop_responsive' }
          },
          {
            id: 'mobile_first',
            name: 'Mobile-First Design',
            content: { 
              layout: 'mobile_optimized',
              larger_buttons: true,
              simplified_steps: true
            }
          }
        ],
        expected_impact: '+20% mobile completion rate',
        confidence: 'medium'
      });
    }

    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    suggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    return Response.json({
      success: true,
      current_metrics: {
        conversion_rate: Math.round(conversionRate * 10) / 10,
        avg_order_value: Math.round(avgOrderValue),
        email_open_rate: Math.round(emailOpenRate * 10) / 10,
        active_tests: currentTests.length
      },
      suggestions: suggestions,
      recommendation: suggestions.length > 0 
        ? `Start with "${suggestions[0].test_name}" - highest potential impact`
        : 'Current performance is optimized. Monitor for changes.'
    });

  } catch (error) {
    console.error('A/B test suggestion error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateSegmentSpecificCTA(segmentName) {
  const ctaMap = {
    'Hot Leads - Urgent Action': 'Claim Your Free Strategy Call (Only 3 Left)',
    'Critical Churn Risk': 'Get Your Personalized Retention Plan',
    'Low Health Score Leads': 'Fix These Critical Issues Now (Free)',
    'Home Services - Priority': 'See How Home Service Leaders Use This',
    'High Health Score Leads': 'Unlock Your Full Ranking Potential'
  };

  return ctaMap[segmentName] || 'Get Your Custom Action Plan';
}