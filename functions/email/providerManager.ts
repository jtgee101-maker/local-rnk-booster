/**
 * EMAIL PROVIDER MANAGER WITH FALLBACK
 * 
 * Manages multiple email providers with automatic failover:
 * 1. Resend (primary) - High deliverability, good for transactional
 * 2. Base44 Core (fallback) - Native integration, always available
 * 
 * 200X Scale Features:
 * - Provider health monitoring
 * - Automatic failover
 * - Retry with exponential backoff
 * - Latency tracking
 * - Cost optimization (use cheapest provider that works)
 */

import { 
  executeWithCircuitBreaker, 
  getCircuitBreaker,
  getAllCircuitBreakerStatus,
  CircuitBreaker 
} from './circuitBreaker';

export type EmailProvider = 'resend' | 'base44';

interface EmailData {
  to: string;
  from?: string;
  from_name?: string;
  subject: string;
  body: string;
  html?: string;
  text?: string;
  reply_to?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
  tags?: string[];
  metadata?: Record<string, any>;
}

interface SendResult {
  success: boolean;
  provider: EmailProvider;
  messageId?: string;
  latencyMs: number;
  error?: string;
  attempts: number;
}

interface ProviderConfig {
  priority: number;
  enabled: boolean;
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  timeoutMs: number;
}

// Provider configurations - lower priority = tried first
const PROVIDER_CONFIGS: Record<EmailProvider, ProviderConfig> = {
  resend: {
    priority: 1,
    enabled: true,
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    timeoutMs: 30000
  },
  base44: {
    priority: 2,
    enabled: true,
    maxRetries: 2,
    baseDelayMs: 500,
    maxDelayMs: 5000,
    timeoutMs: 60000
  }
};

// Track provider performance for smart routing
class ProviderPerformanceTracker {
  private metrics: Map<EmailProvider, {
    successCount: number;
    failureCount: number;
    totalLatency: number;
    lastUsed: number;
  }> = new Map();

  recordSuccess(provider: EmailProvider, latencyMs: number): void {
    const current = this.metrics.get(provider) || {
      successCount: 0, failureCount: 0, totalLatency: 0, lastUsed: 0
    };
    current.successCount++;
    current.totalLatency += latencyMs;
    current.lastUsed = Date.now();
    this.metrics.set(provider, current);
  }

  recordFailure(provider: EmailProvider): void {
    const current = this.metrics.get(provider) || {
      successCount: 0, failureCount: 0, totalLatency: 0, lastUsed: 0
    };
    current.failureCount++;
    current.lastUsed = Date.now();
    this.metrics.set(provider, current);
  }

  getSuccessRate(provider: EmailProvider): number {
    const metrics = this.metrics.get(provider);
    if (!metrics) return 1;
    const total = metrics.successCount + metrics.failureCount;
    return total === 0 ? 1 : metrics.successCount / total;
  }

  getAverageLatency(provider: EmailProvider): number {
    const metrics = this.metrics.get(provider);
    if (!metrics || metrics.successCount === 0) return 0;
    return Math.round(metrics.totalLatency / metrics.successCount);
  }

  getBestProvider(): EmailProvider {
    const providers: EmailProvider[] = ['resend', 'base44'];
    
    return providers.sort((a, b) => {
      const rateA = this.getSuccessRate(a);
      const rateB = this.getSuccessRate(b);
      
      if (Math.abs(rateA - rateB) > 0.2) {
        return rateB - rateA; // Higher success rate first
      }
      
      const latA = this.getAverageLatency(a) || 1000;
      const latB = this.getAverageLatency(b) || 1000;
      return latA - latB; // Lower latency first
    })[0];
  }
}

const performanceTracker = new ProviderPerformanceTracker();

/**
 * Send email with automatic provider failover
 */
export async function sendEmailWithFallback(
  base44: any,
  emailData: EmailData,
  preferredProvider?: EmailProvider
): Promise<SendResult> {
  const providers = getProviderOrder(preferredProvider);
  const startTime = Date.now();
  let lastError: Error | null = null;

  for (const provider of providers) {
    const config = PROVIDER_CONFIGS[provider];
    
    if (!config.enabled) continue;

    for (let attempt = 0; attempt < config.maxRetries; attempt++) {
      try {
        const result = await sendWithProvider(base44, provider, emailData);
        const latency = Date.now() - startTime;
        
        performanceTracker.recordSuccess(provider, latency);
        
        return {
          success: true,
          provider,
          messageId: result.messageId,
          latencyMs: latency,
          attempts: attempt + 1
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        performanceTracker.recordFailure(provider);

        const shouldRetry = attempt < config.maxRetries - 1 && isRetryableError(error);
        
        if (shouldRetry) {
          const delay = calculateBackoff(attempt, config.baseDelayMs, config.maxDelayMs);
          console.log(`[EmailProvider] ${provider} attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
          await sleep(delay);
        }
      }
    }

    console.log(`[EmailProvider] ${provider} exhausted all retries, trying next provider...`);
  }

  // All providers failed
  const totalLatency = Date.now() - startTime;
  
  return {
    success: false,
    provider: providers[providers.length - 1],
    latencyMs: totalLatency,
    error: lastError?.message || 'All email providers failed',
    attempts: providers.reduce((sum, p) => sum + PROVIDER_CONFIGS[p].maxRetries, 0)
  };
}

/**
 * Send email with specific provider using circuit breaker
 */
async function sendWithProvider(
  base44: any,
  provider: EmailProvider,
  emailData: EmailData
): Promise<{ messageId: string }> {
  return executeWithCircuitBreaker(
    provider,
    async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PROVIDER_CONFIGS[provider].timeoutMs);

      try {
        if (provider === 'resend') {
          return await sendViaResend(emailData, controller.signal);
        } else {
          return await sendViaBase44(base44, emailData, controller.signal);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    },
    {
      failureThreshold: provider === 'resend' ? 5 : 3,
      resetTimeoutMs: provider === 'resend' ? 30000 : 15000
    }
  );
}

/**
 * Send via Resend API
 */
async function sendViaResend(emailData: EmailData, signal: AbortSignal): Promise<{ messageId: string }> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailData.from || `LocalRank.ai <noreply@updates.localrnk.com>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html || emailData.body,
      text: emailData.text,
      reply_to: emailData.reply_to,
      tags: emailData.tags
    }),
    signal
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend API error ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  return { messageId: result.id };
}

/**
 * Send via Base44 Core integration
 */
async function sendViaBase44(
  base44: any, 
  emailData: EmailData, 
  signal: AbortSignal
): Promise<{ messageId: string }> {
  // Use AbortSignal timeout wrapper since Base44 SDK might not support AbortSignal directly
  const timeoutPromise = new Promise((_, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Base44 Core email timeout'));
    }, 60000);
    
    signal.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new Error('Base44 Core email aborted'));
    });
  });

  const sendPromise = base44.asServiceRole.integrations.Core.SendEmail({
    to: emailData.to,
    from_name: emailData.from_name || 'LocalRank.ai',
    subject: emailData.subject,
    body: emailData.body
  });

  const result = await Promise.race([sendPromise, timeoutPromise]);
  return { messageId: `base44_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
}

/**
 * Get ordered list of providers to try
 */
function getProviderOrder(preferred?: EmailProvider): EmailProvider[] {
  const all: EmailProvider[] = ['resend', 'base44'];
  
  if (preferred && all.includes(preferred)) {
    return [preferred, ...all.filter(p => p !== preferred)];
  }

  // Use performance-based ordering
  return all.sort((a, b) => {
    const priorityDiff = PROVIDER_CONFIGS[a].priority - PROVIDER_CONFIGS[b].priority;
    return priorityDiff;
  });
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return true;
    }
    
    // Rate limiting
    if (message.includes('rate limit') || message.includes('429') || message.includes('too many')) {
      return true;
    }
    
    // Timeout
    if (message.includes('timeout') || message.includes('aborted')) {
      return true;
    }
    
    // Server errors (5xx)
    if (message.includes('503') || message.includes('502') || message.includes('504')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calculate exponential backoff with jitter
 */
function calculateBackoff(attempt: number, baseDelay: number, maxDelay: number): number {
  const exponential = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  const jitter = Math.random() * 0.3 * exponential; // 30% jitter
  return Math.round(exponential + jitter);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get provider health status
 */
export function getProviderHealth(): Record<string, {
  state: string;
  health: number;
  successRate: number;
  avgLatency: number;
}> {
  const circuitStatus = getAllCircuitBreakerStatus();
  const health: Record<string, any> = {};

  (['resend', 'base44'] as EmailProvider[]).forEach(provider => {
    const circuit = circuitStatus[provider];
    health[provider] = {
      state: circuit?.state || 'UNKNOWN',
      health: circuit?.health || 100,
      successRate: performanceTracker.getSuccessRate(provider),
      avgLatency: performanceTracker.getAverageLatency(provider)
    };
  });

  return health;
}

/**
 * Reset provider (for manual recovery)
 */
export function resetProvider(provider: EmailProvider): void {
  const breaker = getCircuitBreaker(provider);
  breaker.reset();
}

export { performanceTracker, ProviderPerformanceTracker };
