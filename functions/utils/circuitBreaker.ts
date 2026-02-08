/**
 * 200X Circuit Breaker - Prevents cascade failures
 * Protects system during outages
 */

enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, rejecting requests
  HALF_OPEN = 'HALF_OPEN' // Testing if recovered
}

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenMaxCalls: number;
  monitoringPeriod: number;
}

interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  consecutiveSuccesses: number;
  totalCalls: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private lastFailureTime: number | null = null;
  private consecutiveSuccesses = 0;
  private halfOpenCalls = 0;
  private totalCalls = 0;

  constructor(
    private readonly action: () => Promise<any>,
    private readonly options: CircuitBreakerOptions = {
      failureThreshold: 5,
      resetTimeout: 30000,
      halfOpenMaxCalls: 3,
      monitoringPeriod: 60000
    }
  ) {}

  async execute<T>(): Promise<T> {
    this.totalCalls++;

    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        this.halfOpenCalls = 0;
        console.log('[CircuitBreaker] Transitioning to HALF_OPEN');
      } else {
        throw new Error(`Circuit breaker is OPEN. Too many failures.`);
      }
    }

    if (this.state === CircuitState.HALF_OPEN && this.halfOpenCalls >= this.options.halfOpenMaxCalls) {
      throw new Error(`Circuit breaker HALF_OPEN limit reached`);
    }

    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenCalls++;
    }

    try {
      const result = await this.action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.consecutiveSuccesses++;
    
    if (this.state === CircuitState.HALF_OPEN) {
      if (this.consecutiveSuccesses >= this.options.halfOpenMaxCalls) {
        this.reset();
        console.log('[CircuitBreaker] Transitioning to CLOSED');
      }
    } else {
      this.successes++;
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.consecutiveSuccesses = 0;

    if (this.failures >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      console.log(`[CircuitBreaker] Transitioning to OPEN after ${this.failures} failures`);
    }
  }

  private shouldAttemptReset(): boolean {
    return this.lastFailureTime !== null && 
           Date.now() - this.lastFailureTime >= this.options.resetTimeout;
  }

  private reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.consecutiveSuccesses = 0;
    this.halfOpenCalls = 0;
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      consecutiveSuccesses: this.consecutiveSuccesses,
      totalCalls: this.totalCalls
    };
  }

  isOpen(): boolean {
    return this.state === CircuitState.OPEN;
  }
}

// 200X: Retry with circuit breaker wrapper
export async function withRetryAndCircuitBreaker<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    circuitBreakerOptions?: CircuitBreakerOptions;
  } = {}
): Promise<T> {
  const { maxRetries = 3, retryDelay = 1000, circuitBreakerOptions } = options;
  const breaker = new CircuitBreaker(fn, circuitBreakerOptions);
  
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await breaker.execute<T>();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries && !breaker.isOpen()) {
        await new Promise(r => setTimeout(r, retryDelay * attempt));
      }
    }
  }
  
  throw lastError;
}

export default CircuitBreaker;
