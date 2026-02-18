/**
 * Get A/B Test Results - TypeScript Fixed Version
 * 
 * Fixes:
 * - Added proper Deno type declarations
 * - Added explicit Request type annotation
 * - Fixed unused FunctionError import (now used in error handling)
 * - Added proper type annotations for all variables
 * - Fixed implicit 'any' parameters in callbacks
 * - Added proper type guards for error handling
 * 
 * @200x-optimized
 */

// @ts-ignore - Deno and npm imports are runtime-provided
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
// @ts-ignore - Local import
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

// Type declarations for Deno runtime
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
};

// Request body type definition
interface GetTestResultsRequestBody {
  test_id: string;
}

// Event type definition
interface ABTestEvent {
  id: string;
  test_id: string;
  variant_id: string;
  event_type: 'view' | 'conversion';
  conversion_value?: number;
  created_at: string;
}

// Variant type definition
interface ABTestVariant {
  id: string;
  name: string;
  content?: unknown;
}

// Test type definition
interface ABTest {
  id: string;
  name: string;
  variants: ABTestVariant[];
  status: string;
}

// Variant stats type
interface VariantStats {
  name: string;
  views: number;
  conversions: number;
  conversion_rate: number;
  total_value: number;
  avg_value: number;
}

// Winner info type
interface WinnerInfo {
  variant_id: string;
  stats: VariantStats;
  is_significant: boolean;
}

// Response type definition
interface GetTestResultsResponse {
  success: boolean;
  test: ABTest;
  variant_stats: Record<string, VariantStats>;
  winner: WinnerInfo | null;
  total_events: number;
}

Deno.serve(withDenoErrorHandler(async (req: Request): Promise<Response> => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json() as GetTestResultsRequestBody;
    const { test_id } = body;

    if (!test_id) {
      return Response.json(
        { error: 'test_id is required' },
        { status: 400 }
      );
    }

    const test = (await base44.asServiceRole.entities.ABTest.get(test_id)) as ABTest | null;
    if (!test) {
      return Response.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    const events = (await base44.asServiceRole.entities.ABTestEvent.filter({
      test_id
    })) as ABTestEvent[];

    const variantStats: Record<string, VariantStats> = {};

    for (const variant of test.variants) {
      const variantEvents = events.filter(
        (e: ABTestEvent): boolean => e.variant_id === variant.id
      );
      const views = variantEvents.filter(
        (e: ABTestEvent): boolean => e.event_type === 'view'
      ).length;
      const conversions = variantEvents.filter(
        (e: ABTestEvent): boolean => e.event_type === 'conversion'
      ).length;
      const conversionRate = views > 0 ? (conversions / views) * 100 : 0;

      const totalValue = variantEvents
        .filter(
          (e: ABTestEvent): boolean =>
            e.event_type === 'conversion' && e.conversion_value !== undefined
        )
        .reduce(
          (sum: number, e: ABTestEvent): number => sum + (e.conversion_value || 0),
          0
        );

      variantStats[variant.id] = {
        name: variant.name,
        views,
        conversions,
        conversion_rate: parseFloat(conversionRate.toFixed(2)),
        total_value: totalValue,
        avg_value: conversions > 0 ? parseFloat((totalValue / conversions).toFixed(2)) : 0
      };
    }

    // Determine winner
    const sortedVariants = Object.entries(variantStats).sort(
      (a: [string, VariantStats], b: [string, VariantStats]): number =>
        b[1].conversion_rate - a[1].conversion_rate
    );

    const winner: string | null =
      sortedVariants.length > 0 ? sortedVariants[0][0] : null;
    const winnerStats: VariantStats | null = winner ? variantStats[winner] : null;

    // Calculate statistical significance (simplified)
    const hasSignificance: boolean =
      sortedVariants.length > 0 &&
      sortedVariants[0][1].views >= 100 &&
      sortedVariants[0][1].conversions >= 10;

    const winnerInfo: WinnerInfo | null = winner
      ? {
          variant_id: winner,
          stats: winnerStats as VariantStats,
          is_significant: hasSignificance
        }
      : null;

    const response: GetTestResultsResponse = {
      success: true,
      test,
      variant_stats: variantStats,
      winner: winnerInfo,
      total_events: events.length
    };

    return Response.json(response);
  } catch (error: unknown) {
    console.error('Get test results error:', error);

    // Now FunctionError is properly used
    if (error instanceof FunctionError) {
      return Response.json(
        {
          error: error.message,
          code: error.code
        },
        { status: error.statusCode }
      );
    }

    // Log error to ErrorLog entity
    try {
      const base44 = createClientFromRequest(req);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'medium',
        message: 'Failed to get A/B test results',
        stack_trace: errorStack || errorMessage,
        metadata: { endpoint: 'getTestResults' }
      });
    } catch {
      // Silently fail if error logging fails
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      {
        error: 'Failed to get test results',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}));
