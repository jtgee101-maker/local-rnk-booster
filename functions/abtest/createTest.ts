/**
 * Create A/B Test - TypeScript Fixed Version
 * 
 * Fixes:
 * - Added proper Deno type declarations
 * - Added explicit Request type annotation
 * - Fixed unused FunctionError import (now used in error handling)
 * - Added proper type annotations for all variables
 * - Fixed 'unknown' type errors with proper type guards
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
interface CreateTestRequestBody {
  name: string;
  page: string;
  element: string;
  variants: Array<{
    id: string;
    name: string;
    content?: unknown;
  }>;
  traffic_split?: Record<string, number>;
}

// Response type definition
interface CreateTestResponse {
  success: boolean;
  test_id: string;
  test: unknown;
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

    const body = await req.json() as CreateTestRequestBody;
    const { name, page, element, variants, traffic_split } = body;

    if (!name || !page || !element || !variants || variants.length < 2) {
      return Response.json(
        {
          error: 'Missing required fields: name, page, element, variants (min 2)'
        },
        { status: 400 }
      );
    }

    // Validate traffic split
    const splitTotal = Object.values(traffic_split || {}).reduce(
      (a: number, b: number): number => a + b,
      0
    );
    if (splitTotal !== 100) {
      return Response.json(
        {
          error: 'Traffic split must total 100%'
        },
        { status: 400 }
      );
    }

    const test = await base44.asServiceRole.entities.ABTest.create({
      name,
      page,
      element,
      status: 'active',
      variants,
      traffic_split,
      start_date: new Date().toISOString()
    });

    const response: CreateTestResponse = {
      success: true,
      test_id: test.id,
      test
    };

    return Response.json(response);
  } catch (error: unknown) {
    console.error('Create A/B test error:', error);

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
        message: 'Failed to create A/B test',
        stack_trace: errorStack || errorMessage,
        metadata: { endpoint: 'createTest' }
      });
    } catch {
      // Silently fail if error logging fails
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      {
        error: 'Failed to create A/B test',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}));
