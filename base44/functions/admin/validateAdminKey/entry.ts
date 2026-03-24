import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler';

// Constant-time string comparison to prevent timing attacks
function secureCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  const bufA = new TextEncoder().encode(a);
  const bufB = new TextEncoder().encode(b);
  
  if (bufA.length !== bufB.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  
  return result === 0;
}

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { key } = await req.json();
    
    if (!key || typeof key !== 'string') {
      return Response.json({ valid: false, error: 'Invalid key format' }, { status: 400 });
    }
    
    const adminKey = Deno.env.get('ADMIN_ACCESS_KEY');
    
    if (!adminKey) {
      return Response.json({ valid: false, error: 'Admin key not configured' }, { status: 500 });
    }
    
    // Secure constant-time comparison
    const isValid = secureCompare(key, adminKey);
    
    if (isValid) {
      // Log successful key access for security audit
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'low',
        message: 'Admin dashboard accessed via secret key',
        metadata: {
          timestamp: new Date().toISOString(),
          access_method: 'admin_key'
        },
        resolved: true
      }).catch(() => {}); // Don't fail if logging fails
    }
    
    return Response.json({ valid: isValid });
  } catch (error) {
    return Response.json({ valid: false, error: error.message }, { status: 500 });
  }
});