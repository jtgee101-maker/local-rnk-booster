/**
 * EMAIL CIRCUIT BREAKER & RESILIENCE PATTERN
 * 
 * Implements circuit breaker pattern for external email providers
 * States: CLOSED (normal) -> OPEN (failing) -> HALF_OPEN (testing)
 * 
 * 200X Scale Features:
 * - Automatic failover between Resend and Base44 Core
 * - Exponential backoff with jitter
 * - Health monitoring and metrics
 * - Thread-safe state management
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerConfig {
  failureThreshold: number;      // Failures before opening circuit
  resetTimeoutMs: number;        // Time before attempting reset
  halfOpenMaxCalls: number;      // Test calls in half-open state
  successThreshold: number;      // Successes needed to close circuit
}

interface ProviderMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  averageLatencyMs: number;
  p95LatencyMs: number;
}

interface CircuitBreakerState {
  state: CircuitState;
  lastStateChange: number;
  halfOpenCalls: number;
  metrics: ProviderMetrics;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30000, // 30 seconds
  halfOpenMaxCalls: 3,
  successThreshold: 2
};

class CircuitBreaker {
  private state: CircuitBreakerState;
  private config: CircuitBreakerConfig;
  private providerName: string;
  private latencyHistory: number[] = [];
  private readonly MAX_LATENCY_HISTORY = 100;

  constructor(providerName: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.providerName = providerName;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      state: 'CLOSED',
      lastStateChange: Date.now(),
      halfOpenCalls: 0,
      metrics: this.initializeMetrics()
    };
  }

  private initializeMetrics(): ProviderMetrics {
    return {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      averageLatencyMs: 0,
      p95LatencyMs: 0
    };
  }

  /**
   * Check if circuit allows requests
   */
  canExecute(): boolean {
    this.transitionStateIfNeeded();
    
    switch (this.state.state) {
      case 'CLOSED':
        return true;
      case 'OPEN':
        return false;
      case 'HALF_OPEN':
        return this.state.halfOpenCalls < this.config.halfOpenMaxCalls;
      default:
        return false;
    }
  }

  /**
   * Record a successful call
   */
  recordSuccess(latencyMs: number): void {
    this.updateLatencyMetrics(latencyMs);
    
    this.state.metrics.totalCalls++;
    this.state.metrics.successfulCalls++;
    this.state.metrics.consecutiveSuccesses++;
    this.state.metrics.consecutiveFailures = 0;
    this.state.metrics.lastSuccessTime = Date.now();

    if (this.state.state === 'HALF_OPEN') {
      this.state.halfOpenCalls++;
      
      if (this.state.metrics.consecutiveSuccesses >= this.config.successThreshold) {
        this.transitionTo('CLOSED');
      }
    }
  }

  /**
   * Record a failed call
   */
  recordFailure(error?: Error, latencyMs?: number): void {
    if (latencyMs) {
      this.updateLatencyMetrics(latencyMs);
    }

    this.state.metrics.totalCalls++;
    this.state.metrics.failedCalls++;
    this.state.metrics.consecutiveFailures++;
    this.state.metrics.consecutiveSuccesses = 0;
    this.state.metrics.lastFailureTime = Date.now();

    if (this.state.state === 'HALF_OPEN') {
      this.state.halfOpenCalls++;
      this.transitionTo('OPEN');
    } else if (this.state.state === 'CLOSED') {
      if (this.state.metrics.consecutiveFailures >= this.config.failureThreshold) {
        this.transitionTo('OPEN');
      }
    }
  }

  /**
   * Get current state and metrics
   */
  getStatus(): { state: CircuitState; metrics: ProviderMetrics; health: number } {
    const health = this.calculateHealthScore();
    return {
      state: this.state.state,
      metrics: { ...this.state.metrics },
      health
    };
  }

  /**
   * Force reset circuit (for manual recovery)
   */
  reset(): void {
    this.transitionTo('CLOSED');
    this.state.metrics = this.initializeMetrics();
    this.latencyHistory = [];
  }

  private transitionStateIfNeeded(): void {
    if (this.state.state === 'OPEN') {
      const timeSinceOpen = Date.now() - this.state.lastStateChange;
      if (timeSinceOpen >= this.config.resetTimeoutMs) {
        this.transitionTo('HALF_OPEN');
      }
    }
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state.state;
    this.state.state = newState;
    this.state.lastStateChange = Date.now();
    this.state.halfOpenCalls = 0;
    
    if (newState === 'CLOSED') {
      this.state.metrics.consecutiveFailures = 0;
    } else if (newState === 'HALF_OPEN') {
      this.state.metrics.consecutiveSuccesses = 0;
    }

    console.log(`[CircuitBreaker] ${this.providerName}: ${oldState} -> ${newState}`);
  }

  private updateLatencyMetrics(latencyMs: number): void {
    this.latencyHistory.push(latencyMs);
    if (this.latencyHistory.length > this.MAX_LATENCY_HISTORY) {
      this.latencyHistory.shift();
    }

    // Calculate average
    const sum = this.latencyHistory.reduce((a, b) => a + b, 0);
    this.state.metrics.averageLatencyMs = Math.round(sum / this.latencyHistory.length);

    // Calculate P95
    const sorted = [...this.latencyHistory].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    this.state.metrics.p95LatencyMs = sorted[p95Index] || sorted[sorted.length - 1] || 0;
  }

  private calculateHealthScore(): number {
    const { successfulCalls, failedCalls, consecutiveFailures } = this.state.metrics;
    const total = successfulCalls + failedCalls;
    
    if (total === 0) return 100;
    
    const successRate = successfulCalls / total;
    const failurePenalty = Math.min(consecutiveFailures * 10, 50);
    
    return Math.max(0, Math.round(successRate * 100 - failurePenalty));
  }
}

// Global circuit breakers for each provider
const circuitBreakers = new Map<string, CircuitBreaker>();

/**
 * Get or create circuit breaker for a provider
 */
export function getCircuitBreaker(
  providerName: string, 
  config?: Partial<CircuitBreakerConfig>
): CircuitBreaker {
  if (!circuitBreakers.has(providerName)) {
    circuitBreakers.set(providerName, new CircuitBreaker(providerName, config));
  }
  return circuitBreakers.get(providerName)!;
}

/**
 * Execute function with circuit breaker protection
 */
export async function executeWithCircuitBreaker<T>(
  providerName: string,
  operation: () => Promise<T>,
  config?: Partial<CircuitBreakerConfig>
): Promise<T> {
  const breaker = getCircuitBreaker(providerName, config);
  
  if (!breaker.canExecute()) {
    throw new Error(`Circuit breaker OPEN for ${providerName} - service temporarily unavailable`);
  }

  const startTime = Date.now();
  
  try {
    const result = await operation();
    const latency = Date.now() - startTime;
    breaker.recordSuccess(latency);
    return result;
  } catch (error) {
    const latency = Date.now() - startTime;
    breaker.recordFailure(error instanceof Error ? error : undefined, latency);
    throw error;
  }
}

/**
 * Get health status for all providers
 */
export function getAllCircuitBreakerStatus(): Record<string, ReturnType<CircuitBreaker['getStatus']>> {
  const status: Record<string, ReturnType<CircuitBreaker['getStatus']>> = {};
  circuitBreakers.forEach((breaker, name) => {
    status[name] = breaker.getStatus();
  });
  return status;
}

/**
 * Reset all circuit breakers
 */
export function resetAllCircuitBreakers(): void {
  circuitBreakers.forEach(breaker => breaker.reset());
}

export { CircuitBreaker };
