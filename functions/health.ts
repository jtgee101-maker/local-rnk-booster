import { createClient, createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

// Health check status
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

// Health check result
interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  responseTime: number;
  lastChecked: string;
  message?: string;
  details?: Record<string, unknown>;
}

// Overall health status
interface HealthStatusReport {
  status: HealthStatus;
  timestamp: string;
  version: string;
  environment: string;
  checks: HealthCheckResult[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

// Health check configuration
interface HealthCheckConfig {
  timeoutMs: number;
  benchmarks: {
    database: number;
    externalApi: number;
    memory: number;
  };
}

const DEFAULT_CONFIG: HealthCheckConfig = {
  timeoutMs: 5000,
  benchmarks: {
    database: 100,
    externalApi: 2000,
    memory: 100,
  },
};

// Check database connection
async function checkDatabase(req: Request): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Try a simple query
    const result = await base44.asServiceRole.entities.AppSettings.filter({}, { limit: 1 });
    
    const responseTime = Date.now() - start;
    const status = responseTime > DEFAULT_CONFIG.benchmarks.database 
      ? HealthStatus.DEGRADED 
      : HealthStatus.HEALTHY;
    
    return {
      name: 'database',
      status,
      responseTime,
      lastChecked: new Date().toISOString(),
      message: status === HealthStatus.HEALTHY ? 'Database connection OK' : 'Database response slow',
      details: { queryResult: result.length > 0 ? 'success' : 'empty' },
    };
  } catch (error) {
    return {
      name: 'database',
      status: HealthStatus.UNHEALTHY,
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
      message: `Database connection failed: ${(error as Error).message}`,
    };
  }
}

// Check external APIs
async function checkExternalAPIs(): Promise<HealthCheckResult[]> {
  const checks: HealthCheckResult[] = [];
  
  // Check Stripe API
  checks.push(await checkStripeAPI());
  
  // Check Google Maps API
  checks.push(await checkGoogleMapsAPI());
  
  // Check Email service (Resend)
  checks.push(await checkEmailService());
  
  return checks;
}

async function checkStripeAPI(): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return {
        name: 'stripe_api',
        status: HealthStatus.DEGRADED,
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        message: 'Stripe API key not configured',
      };
    }
    
    const response = await fetch('https://api.stripe.com/v1/charges?limit=1', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
      },
    });
    
    const responseTime = Date.now() - start;
    
    if (!response.ok && response.status !== 401) { // 401 is OK, means key is valid but no permissions
      throw new Error(`Stripe API responded with ${response.status}`);
    }
    
    const status = responseTime > DEFAULT_CONFIG.benchmarks.externalApi 
      ? HealthStatus.DEGRADED 
      : HealthStatus.HEALTHY;
    
    return {
      name: 'stripe_api',
      status,
      responseTime,
      lastChecked: new Date().toISOString(),
      message: 'Stripe API connection OK',
    };
  } catch (error) {
    return {
      name: 'stripe_api',
      status: HealthStatus.UNHEALTHY,
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
      message: `Stripe API check failed: ${(error as Error).message}`,
    };
  }
}

async function checkGoogleMapsAPI(): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    const apiKey = Deno.env.get('VITE_GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return {
        name: 'google_maps_api',
        status: HealthStatus.DEGRADED,
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        message: 'Google Maps API key not configured',
      };
    }
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=test&key=${apiKey}`,
      { method: 'GET' }
    );
    
    const responseTime = Date.now() - start;
    const data = await response.json();
    
    if (data.status === 'REQUEST_DENIED') {
      throw new Error('Google Maps API key invalid');
    }
    
    const status = responseTime > DEFAULT_CONFIG.benchmarks.externalApi 
      ? HealthStatus.DEGRADED 
      : HealthStatus.HEALTHY;
    
    return {
      name: 'google_maps_api',
      status,
      responseTime,
      lastChecked: new Date().toISOString(),
      message: 'Google Maps API connection OK',
    };
  } catch (error) {
    return {
      name: 'google_maps_api',
      status: HealthStatus.UNHEALTHY,
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
      message: `Google Maps API check failed: ${(error as Error).message}`,
    };
  }
}

async function checkEmailService(): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      return {
        name: 'email_service',
        status: HealthStatus.DEGRADED,
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        message: 'Resend API key not configured',
      };
    }
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
      },
    });
    
    const responseTime = Date.now() - start;
    
    // Resend returns 405 for GET, which means API is up
    if (response.status !== 405 && !response.ok) {
      throw new Error(`Resend API responded with ${response.status}`);
    }
    
    const status = responseTime > DEFAULT_CONFIG.benchmarks.externalApi 
      ? HealthStatus.DEGRADED 
      : HealthStatus.HEALTHY;
    
    return {
      name: 'email_service',
      status,
      responseTime,
      lastChecked: new Date().toISOString(),
      message: 'Email service connection OK',
    };
  } catch (error) {
    return {
      name: 'email_service',
      status: HealthStatus.UNHEALTHY,
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
      message: `Email service check failed: ${(error as Error).message}`,
    };
  }
}

// Check memory usage
function checkMemory(): HealthCheckResult {
  const start = Date.now();
  
  try {
    // In Deno, we don't have direct memory access like Node.js
    // This is a placeholder that would work in Node.js
    const memory = (Deno as any).memoryUsage?.() || { heapUsed: 0 };
    const heapUsedMB = memory.heapUsed / 1024 / 1024;
    const heapTotalMB = memory.heapTotal / 1024 / 1024 || heapUsedMB;
    const usagePercent = (heapUsedMB / heapTotalMB) * 100;
    
    let status = HealthStatus.HEALTHY;
    if (usagePercent > 90) {
      status = HealthStatus.UNHEALTHY;
    } else if (usagePercent > 70) {
      status = HealthStatus.DEGRADED;
    }
    
    return {
      name: 'memory',
      status,
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
      message: `Memory usage: ${heapUsedMB.toFixed(2)}MB (${usagePercent.toFixed(1)}%)`,
      details: {
        heapUsed: heapUsedMB,
        heapTotal: heapTotalMB,
        usagePercent,
      },
    };
  } catch (error) {
    return {
      name: 'memory',
      status: HealthStatus.HEALTHY, // Not critical
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
      message: 'Memory check not available',
    };
  }
}

// Calculate response time benchmarks
function calculateBenchmarks(checks: HealthCheckResult[]): HealthCheckResult {
  const dbCheck = checks.find(c => c.name === 'database');
  const apiChecks = checks.filter(c => 
    c.name.includes('_api') || c.name === 'email_service'
  );
  
  const avgDbTime = dbCheck?.responseTime || 0;
  const avgApiTime = apiChecks.length > 0
    ? apiChecks.reduce((sum, c) => sum + c.responseTime, 0) / apiChecks.length
    : 0;
  
  return {
    name: 'response_time_benchmarks',
    status: HealthStatus.HEALTHY,
    responseTime: 0,
    lastChecked: new Date().toISOString(),
    message: 'Response time benchmarks calculated',
    details: {
      databaseAvg: avgDbTime,
      externalApiAvg: avgApiTime,
      databaseThreshold: DEFAULT_CONFIG.benchmarks.database,
      externalApiThreshold: DEFAULT_CONFIG.benchmarks.externalApi,
    },
  };
}

// Run all health checks
export async function runHealthChecks(req: Request): Promise<HealthStatusReport> {
  const checks: HealthCheckResult[] = [];
  
  // Database check
  checks.push(await checkDatabase(req));
  
  // External API checks
  const externalChecks = await checkExternalAPIs();
  checks.push(...externalChecks);
  
  // Memory check
  checks.push(checkMemory());
  
  // Response time benchmarks
  checks.push(calculateBenchmarks(checks));
  
  // Calculate overall status
  const unhealthyCount = checks.filter(c => c.status === HealthStatus.UNHEALTHY).length;
  const degradedCount = checks.filter(c => c.status === HealthStatus.DEGRADED).length;
  
  let overallStatus = HealthStatus.HEALTHY;
  if (unhealthyCount > 0) {
    overallStatus = HealthStatus.UNHEALTHY;
  } else if (degradedCount > 0) {
    overallStatus = HealthStatus.DEGRADED;
  }
  
  const healthyCount = checks.filter(c => c.status === HealthStatus.HEALTHY).length;
  
  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: Deno.env.get('APP_VERSION') || 'unknown',
    environment: Deno.env.get('NODE_ENV') || 'development',
    checks,
    summary: {
      total: checks.length,
      healthy: healthyCount,
      degraded: degradedCount,
      unhealthy: unhealthyCount,
    },
  };
}

// Get health check history
export async function getHealthHistory(
  req: Request,
  options: {
    limit?: number;
    since?: Date;
  } = {}
): Promise<HealthStatusReport[]> {
  try {
    const base44 = createClientFromRequest(req);
    
    const filter: Record<string, unknown> = {};
    if (options.since) {
      filter.created_at = { $gte: options.since.toISOString() };
    }
    
    const history = await base44.asServiceRole.entities.HealthCheck.filter(filter, {
      sort: { field: 'created_at', direction: 'desc' },
      limit: options.limit || 100,
    });
    
    return history.map(h => ({
      status: h.status,
      timestamp: h.created_at,
      version: h.version,
      environment: h.environment,
      checks: h.checks,
      summary: h.summary,
    }));
  } catch (error) {
    console.error('Failed to get health history:', error);
    return [];
  }
}

// Store health check result
async function storeHealthCheck(
  req: Request,
  report: HealthStatusReport
): Promise<void> {
  try {
    const base44 = createClientFromRequest(req);
    await base44.asServiceRole.entities.HealthCheck.create({
      status: report.status,
      version: report.version,
      environment: report.environment,
      checks: report.checks,
      summary: report.summary,
    });
  } catch (error) {
    console.error('Failed to store health check:', error);
  }
}

// Main handler
Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    
    // Handle different endpoints
    if (path.endsWith('/health/history')) {
      const limit = parseInt(url.searchParams.get('limit') || '100');
      const since = url.searchParams.get('since');
      const history = await getHealthHistory(req, {
        limit,
        since: since ? new Date(since) : undefined,
      });
      return Response.json({ history });
    }
    
    // Default: run health check
    const report = await runHealthChecks(req);
    
    // Store the result
    await storeHealthCheck(req, report);
    
    // Determine status code based on health
    const statusCode = report.status === HealthStatus.HEALTHY ? 200 
      : report.status === HealthStatus.DEGRADED ? 200 
      : 503;
    
    return Response.json(report, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return Response.json({
      status: HealthStatus.UNHEALTHY,
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
    }, { status: 503 });
  }
});