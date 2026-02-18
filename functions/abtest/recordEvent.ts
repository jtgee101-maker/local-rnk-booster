/**
 * Record A/B Test Event - TypeScript Fixed Version
 * 
 * Fixes:
 * - Added proper Deno type declarations
 * - Added explicit Request type annotation
 * - Added proper type annotations for request body
 * - Fixed implicit 'any' types
 * - Added proper error type guards
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
interface RecordEventRequestBody {
  test_id: string;
  variant_id: string;
  session_id: string;
  event_type: 'view' | 'conversion';
  conversion_value?: number;
  metadata?: Record<string, unknown>;
}

// Response type definition
interface RecordEventResponse {
  success: boolean;
  message: string;
}

Deno.serve(withDenoErrorHandler(async (req: Request): Promise<Response> => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json() as RecordEventRequestBody;
    const {
      test_id,
      variant_id,
      session_id,
      event_type,
      conversion_value,
      metadata
    } = body;

    if (!test_id || !variant_id || !session_id || !event_type) {
      return Response.json(
        {
          error: 'Missing required fields: test_id, variant_id, session_id, event_type'
        },
        { status: 400 }
      );
    }

    if (!['view', 'conversion'].includes(event_type)) {
      return Response.json(
        {
          error: 'event_type must be "view" or "conversion"'
        },
        { status: 400 }
      );
    }

    await base44.asServiceRole.entities.ABTestEvent.create({
      test_id,
      variant_id,
      session_id,
      event_type,
      conversion_value: conversion_value || null,
      metadata: metadata || {}
    });

    const response: RecordEventResponse = {
      success: true,
      message: 'Event recorded'
    };

    return Response.json(response);
  } catch (error: unknown) {
    console.error('Record A/B test event error:', error);

    // Properly use FunctionError
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
        severity: 'low',
        message: 'Failed to record A/B test event',
        stack_trace: errorStack || errorMessage,
        metadata: { endpoint: 'recordEvent' }
      });
    } catch {
      // Silently fail if error logging fails
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      {
        error: 'Failed to record event',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}));
