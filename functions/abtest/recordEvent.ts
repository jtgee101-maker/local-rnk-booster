import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.json();
    const { test_id, variant_id, session_id, event_type, conversion_value, metadata } = body;

    if (!test_id || !variant_id || !session_id || !event_type) {
      return Response.json({ 
        error: 'Missing required fields: test_id, variant_id, session_id, event_type' 
      }, { status: 400 });
    }

    if (!['view', 'conversion'].includes(event_type)) {
      return Response.json({ 
        error: 'event_type must be "view" or "conversion"' 
      }, { status: 400 });
    }

    await base44.asServiceRole.entities.ABTestEvent.create({
      test_id,
      variant_id,
      session_id,
      event_type,
      conversion_value: conversion_value || null,
      metadata: metadata || {}
    });

    return Response.json({
      success: true,
      message: 'Event recorded'
    });

  } catch (error) {
    console.error('Record A/B test event error:', error);
    
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'low',
        message: 'Failed to record A/B test event',
        stack_trace: error.stack || error.message,
        metadata: { endpoint: 'recordEvent' }
      });
    } catch {}

    return Response.json({ 
      error: 'Failed to record event',
      details: error.message 
    }, { status: 500 });
  }
}));