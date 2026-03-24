// Security headers middleware
// Implements security best practices including CSP, HSTS, CORS, and more

export interface SecurityConfig {
  // Content Security Policy
  csp?: {
    defaultSrc?: string[];
    scriptSrc?: string[];
    styleSrc?: string[];
    imgSrc?: string[];
    connectSrc?: string[];
    fontSrc?: string[];
    objectSrc?: string[];
    mediaSrc?: string[];
    frameSrc?: string[];
    upgradeInsecureRequests?: boolean;
  };
  // CORS
  cors?: {
    allowedOrigins?: string[];
    allowedMethods?: string[];
    allowedHeaders?: string[];
    allowCredentials?: boolean;
    maxAge?: number;
  };
  // HSTS
  hsts?: {
    maxAge?: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  // Other security headers
  referrerPolicy?: string;
  xFrameOptions?: string;
  xContentTypeOptions?: boolean;
  xXSSProtection?: boolean;
  permissionsPolicy?: Record<string, string>;
}

// Default security configuration
const DEFAULT_CONFIG: SecurityConfig = {
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://maps.googleapis.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    imgSrc: ["'self'", "data:", "https:", "blob:"],
    connectSrc: ["'self'", "https://api.base44.com", "https://api.stripe.com", "https://maps.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
    upgradeInsecureRequests: true,
  },
  cors: {
    allowedOrigins: ['https://localrank.ai', 'https://app.localrank.ai', 'https://admin.localrank.ai'],
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
    allowCredentials: true,
    maxAge: 86400,
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: 'strict-origin-when-cross-origin',
  xFrameOptions: 'DENY',
  xContentTypeOptions: true,
  xXSSProtection: true,
  permissionsPolicy: {
    'accelerometer': "'none'",
    'camera': "'none'",
    'geolocation': "'self'",
    'gyroscope': "'none'",
    'magnetometer': "'none'",
    'microphone': "'none'",
    'payment': "'self'",
    'usb': "'none'",
  },
};

// Build CSP header value
function buildCSPHeader(csp: SecurityConfig['csp']): string {
  if (!csp) return "";
  
  const directives: string[] = [];
  
  if (csp.defaultSrc) directives.push(`default-src ${csp.defaultSrc.join(' ')}`);
  if (csp.scriptSrc) directives.push(`script-src ${csp.scriptSrc.join(' ')}`);
  if (csp.styleSrc) directives.push(`style-src ${csp.styleSrc.join(' ')}`);
  if (csp.imgSrc) directives.push(`img-src ${csp.imgSrc.join(' ')}`);
  if (csp.connectSrc) directives.push(`connect-src ${csp.connectSrc.join(' ')}`);
  if (csp.fontSrc) directives.push(`font-src ${csp.fontSrc.join(' ')}`);
  if (csp.objectSrc) directives.push(`object-src ${csp.objectSrc.join(' ')}`);
  if (csp.mediaSrc) directives.push(`media-src ${csp.mediaSrc.join(' ')}`);
  if (csp.frameSrc) directives.push(`frame-src ${csp.frameSrc.join(' ')}`);
  if (csp.upgradeInsecureRequests) directives.push('upgrade-insecure-requests');
  
  return directives.join('; ');
}

// Build HSTS header value
function buildHSTSHeader(hsts: SecurityConfig['hsts']): string {
  if (!hsts) return "";
  
  let value = `max-age=${hsts.maxAge || 31536000}`;
  if (hsts.includeSubDomains) value += '; includeSubDomains';
  if (hsts.preload) value += '; preload';
  
  return value;
}

// Build Permissions Policy header value
function buildPermissionsPolicyHeader(policy: Record<string, string>): string {
  return Object.entries(policy)
    .map(([feature, allowlist]) => `${feature}=${allowlist}`)
    .join(', ');
}

// Apply security headers to response
export function applySecurityHeaders(
  response: Response,
  config: SecurityConfig = DEFAULT_CONFIG
): Response {
  const headers = new Headers(response.headers);
  
  // Content Security Policy
  if (config.csp) {
    const cspValue = buildCSPHeader(config.csp);
    headers.set('Content-Security-Policy', cspValue);
  }
  
  // HSTS (only in production)
  if (config.hsts && Deno.env.get('NODE_ENV') === 'production') {
    headers.set('Strict-Transport-Security', buildHSTSHeader(config.hsts));
  }
  
  // X-Frame-Options
  if (config.xFrameOptions) {
    headers.set('X-Frame-Options', config.xFrameOptions);
  }
  
  // X-Content-Type-Options
  if (config.xContentTypeOptions) {
    headers.set('X-Content-Type-Options', 'nosniff');
  }
  
  // X-XSS-Protection
  if (config.xXSSProtection) {
    headers.set('X-XSS-Protection', '1; mode=block');
  }
  
  // Referrer Policy
  if (config.referrerPolicy) {
    headers.set('Referrer-Policy', config.referrerPolicy);
  }
  
  // Permissions Policy
  if (config.permissionsPolicy) {
    headers.set('Permissions-Policy', buildPermissionsPolicyHeader(config.permissionsPolicy));
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Handle CORS preflight and add CORS headers
export function handleCORS(req: Request, config: SecurityConfig['cors'] = DEFAULT_CONFIG.cors): Response | null {
  if (!config) return null;
  
  const origin = req.headers.get('origin');
  const method = req.method;
  
  // Check if origin is allowed
  const isAllowedOrigin = !origin || 
    config.allowedOrigins?.includes('*') ||
    config.allowedOrigins?.includes(origin) ||
    config.allowedOrigins?.some(allowed => {
      // Support wildcard subdomains
      if (allowed.startsWith('*.')) {
        const domain = allowed.slice(2);
        return origin?.endsWith(domain) || origin === domain;
      }
      return false;
    });
  
  // Handle preflight request
  if (method === 'OPTIONS') {
    const headers = new Headers();
    
    if (isAllowedOrigin) {
      headers.set('Access-Control-Allow-Origin', origin || '*');
    }
    
    headers.set('Access-Control-Allow-Methods', config.allowedMethods?.join(', ') || 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', config.allowedHeaders?.join(', ') || 'Content-Type, Authorization');
    
    if (config.allowCredentials) {
      headers.set('Access-Control-Allow-Credentials', 'true');
    }
    
    if (config.maxAge) {
      headers.set('Access-Control-Max-Age', config.maxAge.toString());
    }
    
    return new Response(null, { status: 204, headers });
  }
  
  return null;
}

// Add CORS headers to response
export function addCORSHeaders(
  response: Response,
  req: Request,
  config: SecurityConfig['cors'] = DEFAULT_CONFIG.cors
): Response {
  if (!config) return response;
  
  const origin = req.headers.get('origin');
  const headers = new Headers(response.headers);
  
  // Check if origin is allowed
  const isAllowedOrigin = !origin || 
    config.allowedOrigins?.includes('*') ||
    config.allowedOrigins?.includes(origin) ||
    config.allowedOrigins?.some(allowed => {
      if (allowed.startsWith('*.')) {
        const domain = allowed.slice(2);
        return origin?.endsWith(domain) || origin === domain;
      }
      return false;
    });
  
  if (isAllowedOrigin) {
    headers.set('Access-Control-Allow-Origin', origin || '*');
  }
  
  if (config.allowCredentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  headers.set('Access-Control-Expose-Headers', 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Main security middleware
export function securityMiddleware(req: Request, config: SecurityConfig = DEFAULT_CONFIG): Response | null {
  // Handle CORS preflight first
  const corsResponse = handleCORS(req, config.cors);
  if (corsResponse) {
    return corsResponse;
  }
  
  return null;
}

// Apply all security headers to a response
export function secureResponse(
  response: Response,
  req: Request,
  config: SecurityConfig = DEFAULT_CONFIG
): Response {
  let securedResponse = applySecurityHeaders(response, config);
  securedResponse = addCORSHeaders(securedResponse, req, config.cors);
  return securedResponse;
}