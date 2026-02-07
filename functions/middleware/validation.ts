import { z } from 'npm:zod@3.24.2';

// Common validation schemas
export const schemas = {
  // UUID validation
  uuid: z.string().uuid(),
  
  // Email validation
  email: z.string().email().max(254),
  
  // Phone validation (E.164 format)
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/),
  
  // URL validation
  url: z.string().url().max(2048),
  
  // Slug validation (for URLs)
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  
  // Safe string (no HTML)
  safeString: z.string().max(5000).transform((val) => sanitizeHtml(val)),
  
  // JSON object
  jsonObject: z.record(z.unknown()).default({}),
  
  // Pagination params
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
  
  // Date range
  dateRange: z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  }).refine((data) => data.startDate <= data.endDate, {
    message: "Start date must be before or equal to end date",
  }),
  
  // Lead creation
  createLead: z.object({
    email: z.string().email().max(254),
    first_name: z.string().max(100).optional().transform(sanitizeHtml),
    last_name: z.string().max(100).optional().transform(sanitizeHtml),
    phone: z.string().max(20).optional(),
    company: z.string().max(200).optional().transform(sanitizeHtml),
    source: z.string().max(100).optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
  
  // User registration
  registerUser: z.object({
    email: z.string().email().max(254),
    password: z.string().min(8).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
      message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    }),
    first_name: z.string().max(100).optional().transform(sanitizeHtml),
    last_name: z.string().max(100).optional().transform(sanitizeHtml),
  }),
  
  // Login
  login: z.object({
    email: z.string().email().max(254),
    password: z.string().min(1).max(128),
  }),
  
  // API Key
  apiKey: z.string().regex(/^[a-zA-Z0-9_-]{32,128}$/),
  
  // Analytics query
  analyticsQuery: z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    metric: z.enum(['views', 'clicks', 'conversions', 'revenue']).optional(),
    groupBy: z.enum(['day', 'week', 'month']).optional(),
  }),
  
  // Campaign creation
  createCampaign: z.object({
    name: z.string().min(1).max(200).transform(sanitizeHtml),
    type: z.enum(['email', 'sms', 'push', 'social']),
    content: z.string().max(10000).transform(sanitizeHtml),
    scheduledAt: z.coerce.date().optional(),
    targetSegment: z.string().uuid().optional(),
  }),
  
  // Payment intent
  createPaymentIntent: z.object({
    amount: z.number().int().positive().max(1000000), // Max $10,000 in cents
    currency: z.string().length(3).default('usd'),
    metadata: z.record(z.unknown()).optional(),
  }),
  
  // Business search
  businessSearch: z.object({
    query: z.string().min(1).max(200).transform(sanitizeHtml),
    location: z.string().max(200).optional().transform(sanitizeHtml),
    radius: z.coerce.number().int().min(1000).max(50000).optional(), // meters
  }),
};

// Sanitize HTML to prevent XSS
function sanitizeHtml(input: string | undefined): string | undefined {
  if (!input) return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Additional sanitization for complex objects
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHtml(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

// Content type validation
export function validateContentType(req: Request, allowedTypes: string[] = ['application/json']): boolean {
  const contentType = req.headers.get('content-type') || '';
  return allowedTypes.some(type => contentType.includes(type));
}

// Payload size validation
export async function validatePayloadSize(req: Request, maxSizeBytes: number = 10 * 1024 * 1024): Promise<boolean> {
  const contentLength = req.headers.get('content-length');
  
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > maxSizeBytes) {
      return false;
    }
  }
  
  // For chunked encoding, check actual body size
  const clonedReq = req.clone();
  const body = await clonedReq.arrayBuffer();
  return body.byteLength <= maxSizeBytes;
}

// Query parameter validation
export function validateQueryParams<T extends z.ZodType>(
  url: URL,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; errors: z.ZodError } {
  const params: Record<string, unknown> = {};
  
  for (const [key, value] of url.searchParams.entries()) {
    // Try to parse as number if applicable
    const numValue = Number(value);
    if (!isNaN(numValue) && value !== '') {
      params[key] = numValue;
    } else if (value === 'true') {
      params[key] = true;
    } else if (value === 'false') {
      params[key] = false;
    } else {
      params[key] = value;
    }
  }
  
  const result = schema.safeParse(params);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

// Body validation
export async function validateBody<T extends z.ZodType>(
  req: Request,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; errors: z.ZodError }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, errors: result.error };
    }
  } catch {
    return { 
      success: false, 
      errors: new z.ZodError([{ 
        code: 'custom', 
        path: [], 
        message: 'Invalid JSON body' 
      }]) 
    };
  }
}

// Create validation error response
export function createValidationErrorResponse(errors: z.ZodError): Response {
  const formattedErrors = errors.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
  
  return new Response(
    JSON.stringify({
      error: 'Validation failed',
      message: 'The request contains invalid data',
      errors: formattedErrors,
    }),
    {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// Create content type error response
export function createContentTypeErrorResponse(allowedTypes: string[]): Response {
  return new Response(
    JSON.stringify({
      error: 'Unsupported Media Type',
      message: `Content-Type must be one of: ${allowedTypes.join(', ')}`,
    }),
    {
      status: 415,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// Create payload size error response
export function createPayloadSizeErrorResponse(maxSizeBytes: number): Response {
  const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(1);
  return new Response(
    JSON.stringify({
      error: 'Payload Too Large',
      message: `Request body must not exceed ${maxSizeMB} MB`,
    }),
    {
      status: 413,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// Main validation middleware
export interface ValidationOptions {
  bodySchema?: z.ZodType;
  querySchema?: z.ZodType;
  allowedContentTypes?: string[];
  maxPayloadSize?: number;
}

export async function validateRequest(
  req: Request,
  options: ValidationOptions
): Promise<{ success: true; data?: { body?: unknown; query?: unknown } } | { success: false; response: Response }> {
  // Validate content type
  if (options.allowedContentTypes && req.method !== 'GET') {
    if (!validateContentType(req, options.allowedContentTypes)) {
      return { success: false, response: createContentTypeErrorResponse(options.allowedContentTypes) };
    }
  }
  
  // Validate payload size
  if (options.maxPayloadSize && req.method !== 'GET') {
    const isValidSize = await validatePayloadSize(req, options.maxPayloadSize);
    if (!isValidSize) {
      return { success: false, response: createPayloadSizeErrorResponse(options.maxPayloadSize) };
    }
  }
  
  const result: { body?: unknown; query?: unknown } = {};
  
  // Validate query params
  if (options.querySchema) {
    const url = new URL(req.url);
    const queryResult = validateQueryParams(url, options.querySchema);
    if (!queryResult.success) {
      return { success: false, response: createValidationErrorResponse(queryResult.errors) };
    }
    result.query = queryResult.data;
  }
  
  // Validate body
  if (options.bodySchema && req.method !== 'GET') {
    const bodyResult = await validateBody(req, options.bodySchema);
    if (!bodyResult.success) {
      return { success: false, response: createValidationErrorResponse(bodyResult.errors) };
    }
    result.body = bodyResult.data;
  }
  
  return { success: true, data: result };
}