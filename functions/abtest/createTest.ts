import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, page, element, variants, traffic_split } = body;

    if (!name || !page || !element || !variants || variants.length < 2) {
      return Response.json({ 
        error: 'Missing required fields: name, page, element, variants (min 2)' 
      }, { status: 400 });
    }

    // Validate traffic split
    const splitTotal = Object.values(traffic_split || {}).reduce((a, b) => a + b, 0);
    if (splitTotal !== 100) {
      return Response.json({ 
        error: 'Traffic split must total 100%' 
      }, { status: 400 });
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

    return Response.json({
      success: true,
      test_id: test.id,
      test
    });

  } catch (error) {
    console.error('Create A/B test error:', error);
    
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'medium',
        message: 'Failed to create A/B test',
        stack_trace: error.stack || error.message,
        metadata: { endpoint: 'createTest' }
      });
    } catch {}

    return Response.json({ 
      error: 'Failed to create A/B test',
      details: error.message 
    }, { status: 500 });
  }
});