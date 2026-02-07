import { createClient } from 'npm:@base44/sdk@0.8.6';

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Log entry interface
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  requestId: string;
  method: string;
  url: string;
  path: string;
  query: Record<string, string>;
  ip: string;
  userAgent: string;
  userId?: string;
  statusCode: number;
  duration: number;
  requestSize?: number;
  responseSize?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

// Logger configuration
interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableDatabase: boolean;
  enableFile: boolean;
  logRotationDays: number;
  samplingRate: number; // 0-1, for high-traffic endpoints
}

const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: LogLevel.INFO,
  enableConsole: true,
  enableDatabase: true,
  enableFile: false,
  logRotationDays: 30,
  samplingRate: 1.0,
};

let globalConfig: LoggerConfig = DEFAULT_CONFIG;

// Configure logger
export function configureLogger(config: Partial<LoggerConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

// Generate request ID
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Get client IP
function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  
  return cfConnectingIP || 
         realIP || 
         (forwarded ? forwarded.split(',')[0].trim() : null) || 
         'unknown';
}

// Get user ID from request
function getUserId(req: Request): string | undefined {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return undefined;
  
  try {
    const token = authHeader.substring(7);
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || payload.user_id;
  } catch {
    return undefined;
  }
}

// Parse query params
function parseQueryParams(url: URL): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    params[key] = value;
  }
  return params;
}

// Log level priority
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

// Check if should log based on level
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[globalConfig.minLevel];
}

// Console logger
function logToConsole(entry: LogEntry): void {
  const logData = {
    ...entry,
    timestamp: new Date(entry.timestamp).toISOString(),
  };
  
  switch (entry.level) {
    case LogLevel.ERROR:
      console.error(JSON.stringify(logData));
      break;
    case LogLevel.WARN:
      console.warn(JSON.stringify(logData));
      break;
    case LogLevel.DEBUG:
      console.debug(JSON.stringify(logData));
      break;
    default:
      console.log(JSON.stringify(logData));
  }
}

// Database logger (async)
async function logToDatabase(entry: LogEntry): Promise<void> {
  try {
    // In a real implementation, you'd use your database client
    // For now, we'll just log that we would save to DB
    // This could be enhanced to use Base44 or another database
    
    // Example with Base44 (commented out as it requires request context):
    // const base44 = createClientFromRequest(req);
    // await base44.asServiceRole.entities.RequestLog.create({
    //   ...entry,
    //   created_at: entry.timestamp,
    // });
  } catch (error) {
    console.error('Failed to log to database:', error);
  }
}

// Main logger function
export async function logRequest(entry: LogEntry): Promise<void> {
  // Check sampling rate
  if (Math.random() > globalConfig.samplingRate) {
    return;
  }
  
  if (!shouldLog(entry.level)) {
    return;
  }
  
  if (globalConfig.enableConsole) {
    logToConsole(entry);
  }
  
  if (globalConfig.enableDatabase) {
    await logToDatabase(entry);
  }
}

// Request context for logging
export interface RequestContext {
  requestId: string;
  startTime: number;
  method: string;
  url: string;
  path: string;
  ip: string;
  userAgent: string;
  userId?: string;
  requestSize?: number;
}

// Create request context
export function createRequestContext(req: Request): RequestContext {
  const url = new URL(req.url);
  
  return {
    requestId: generateRequestId(),
    startTime: Date.now(),
    method: req.method,
    url: req.url,
    path: url.pathname,
    ip: getClientIP(req),
    userAgent: req.headers.get('user-agent') || 'unknown',
    userId: getUserId(req),
    requestSize: req.headers.get('content-length') 
      ? parseInt(req.headers.get('content-length')!, 10) 
      : undefined,
  };
}

// Log request start
export function logRequestStart(context: RequestContext): void {
  if (globalConfig.enableConsole && shouldLog(LogLevel.DEBUG)) {
    console.log(JSON.stringify({
      level: LogLevel.DEBUG,
      message: 'Request started',
      requestId: context.requestId,
      method: context.method,
      path: context.path,
      ip: context.ip,
      userId: context.userId,
      timestamp: new Date().toISOString(),
    }));
  }
}

// Log request completion
export async function logRequestComplete(
  context: RequestContext,
  response: Response,
  error?: Error
): Promise<void> {
  const duration = Date.now() - context.startTime;
  const url = new URL(context.url);
  
  // Determine log level based on status code
  let level = LogLevel.INFO;
  if (response.status >= 500) {
    level = LogLevel.ERROR;
  } else if (response.status >= 400) {
    level = LogLevel.WARN;
  }
  
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    requestId: context.requestId,
    method: context.method,
    url: context.url,
    path: context.path,
    query: parseQueryParams(url),
    ip: context.ip,
    userAgent: context.userAgent,
    userId: context.userId,
    statusCode: response.status,
    duration,
    requestSize: context.requestSize,
    responseSize: response.headers.get('content-length') 
      ? parseInt(response.headers.get('content-length')!, 10) 
      : undefined,
    error: error?.message,
  };
  
  await logRequest(entry);
}

// Logger middleware
export async function loggerMiddleware(
  req: Request,
  handler: (req: Request) => Promise<Response>
): Promise<Response> {
  const context = createRequestContext(req);
  
  // Add request ID to headers for tracing
  const requestWithId = new Request(req, {
    headers: {
      ...Object.fromEntries(req.headers.entries()),
      'x-request-id': context.requestId,
    },
  });
  
  logRequestStart(context);
  
  try {
    const response = await handler(requestWithId);
    await logRequestComplete(context, response);
    
    // Add request ID to response headers
    const headers = new Headers(response.headers);
    headers.set('x-request-id', context.requestId);
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    const errorResponse = new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
    await logRequestComplete(context, errorResponse, error as Error);
    throw error;
  }
}

// Structured logger for manual logging
export const logger = {
  debug: (message: string, metadata?: Record<string, unknown>) => {
    if (shouldLog(LogLevel.DEBUG)) {
      console.log(JSON.stringify({
        level: LogLevel.DEBUG,
        message,
        timestamp: new Date().toISOString(),
        ...metadata,
      }));
    }
  },
  info: (message: string, metadata?: Record<string, unknown>) => {
    if (shouldLog(LogLevel.INFO)) {
      console.log(JSON.stringify({
        level: LogLevel.INFO,
        message,
        timestamp: new Date().toISOString(),
        ...metadata,
      }));
    }
  },
  warn: (message: string, metadata?: Record<string, unknown>) => {
    if (shouldLog(LogLevel.WARN)) {
      console.warn(JSON.stringify({
        level: LogLevel.WARN,
        message,
        timestamp: new Date().toISOString(),
        ...metadata,
      }));
    }
  },
  error: (message: string, error?: Error, metadata?: Record<string, unknown>) => {
    if (shouldLog(LogLevel.ERROR)) {
      console.error(JSON.stringify({
        level: LogLevel.ERROR,
        message,
        error: error?.message,
        stack: error?.stack,
        timestamp: new Date().toISOString(),
        ...metadata,
      }));
    }
  },
};

// Performance tracking
export function trackPerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  
  return fn().finally(() => {
    const duration = performance.now() - start;
    logger.debug(`Performance: ${name}`, {
      operation: name,
      duration: Math.round(duration),
      unit: 'ms',
    });
  });
}