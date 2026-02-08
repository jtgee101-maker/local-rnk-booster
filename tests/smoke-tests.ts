/**
 * 200X SANDBOX SMOKE TESTS
 * 
 * These tests verify all utilities and optimized functions
 * are working correctly in the sandbox environment.
 */

import {
  UltraCache,
  BatchProcessor,
  CircuitBreaker,
  ConnectionPool,
  QueryOptimizer,
  RateLimiter,
  PerformanceMonitor,
  globalMonitor,
  verifyDeployment
} from '../functions/utils/sandbox-deployment';

// Test results tracker
interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    results.push({
      name,
      passed: true,
      duration: Date.now() - start
    });
    console.log(`✅ ${name} (${Date.now() - start}ms)`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      duration: Date.now() - start,
      error: String(error)
    });
    console.log(`❌ ${name} - ${error} (${Date.now() - start}ms)`);
  }
}

// ===== UTILITY TESTS =====

async function testUltraCache() {
  const cache = new UltraCache({ maxSizeMB: 10, defaultTTLSeconds: 60 });
  
  // Basic set/get
  cache.set('test-key', { data: 'value' });
  const value = cache.get('test-key');
  if (!value || value.data !== 'value') {
    throw new Error('Cache get/set failed');
  }
  
  // Batch operations
  cache.set('key1', 'value1');
  cache.set('key2', 'value2');
  const batch = cache.mget(['key1', 'key2', 'key3']);
  if (batch[0] !== 'value1' || batch[1] !== 'value2') {
    throw new Error('Cache batch operations failed');
  }
  
  // Stats
  const stats = cache.getStats();
  if (stats.hits === 0) {
    throw new Error('Cache stats not tracking');
  }
  
  cache.destroy();
}

async function testBatchProcessor() {
  const items = [1, 2, 3, 4, 5];
  const processed: number[] = [];
  
  await BatchProcessor.process(
    items,
    async (item) => {
      processed.push(item * 2);
      return item * 2;
    },
    {
      batchSize: 2,
      concurrency: 2
    }
  );
  
  if (processed.length !== 5) {
    throw new Error(`Expected 5 items, got ${processed.length}`);
  }
}

async function testCircuitBreaker() {
  let callCount = 0;
  
  const breaker = new CircuitBreaker(
    async () => {
      callCount++;
      if (callCount < 3) {
        throw new Error('Simulated failure');
      }
      return 'success';
    },
    {
      failureThreshold: 2,
      resetTimeout: 100
    }
  );
  
  // First two calls should fail
  try { await breaker.execute(); } catch (e) { /* expected */ }
  try { await breaker.execute(); } catch (e) { /* expected */ }
  
  // Wait for reset
  await new Promise(r => setTimeout(r, 150));
  
  // Third call should succeed
  const result = await breaker.execute();
  if (result !== 'success') {
    throw new Error('Circuit breaker recovery failed');
  }
}

async function testConnectionPool() {
  let created = 0;
  let destroyed = 0;
  
  const pool = new ConnectionPool(
    async () => {
      created++;
      return { id: created };
    },
    async () => {
      destroyed++;
    },
    {
      minConnections: 1,
      maxConnections: 3
    }
  );
  
  // Test basic connection usage
  const result = await pool.withConnection(async (conn) => {
    return conn.id;
  });
  
  if (result !== 1) {
    throw new Error('Connection pool returned wrong value');
  }
  
  await pool.destroy();
}

async function testRateLimiter() {
  const limiter = new RateLimiter({
    tokensPerInterval: 3,
    interval: 1000
  });
  
  // Should allow first 3
  const r1 = await limiter.check('user1');
  const r2 = await limiter.check('user1');
  const r3 = await limiter.check('user1');
  
  if (!r1.allowed || !r2.allowed || !r3.allowed) {
    throw new Error('Rate limiter blocked allowed requests');
  }
  
  // 4th should be blocked
  const r4 = await limiter.check('user1');
  if (r4.allowed) {
    throw new Error('Rate limiter allowed too many requests');
  }
}

async function testPerformanceMonitor() {
  const monitor = new PerformanceMonitor();
  
  // Record a metric
  monitor.record('test_metric', 1);
  
  // Time an operation
  const result = await monitor.time('test_op', async () => {
    await new Promise(r => setTimeout(r, 10));
    return 'done';
  });
  
  if (result !== 'done') {
    throw new Error('Timed operation returned wrong value');
  }
  
  // Get stats
  const stats = monitor.getStats('test_op', 60000);
  if (!stats || stats.count === 0) {
    throw new Error('Performance stats not recorded');
  }
}

async function testQueryOptimizer() {
  const optimizer = new QueryOptimizer();
  
  // Analyze a query
  const analysis = optimizer.analyze('SELECT * FROM large_table');
  if (!analysis.suggestions || analysis.suggestions.length === 0) {
    throw new Error('Query optimizer did not provide suggestions');
  }
  
  // Check for SELECT * warning
  const hasSelectAllWarning = analysis.suggestions.some(
    s => s.includes('SELECT *')
  );
  if (!hasSelectAllWarning) {
    throw new Error('Query optimizer missed SELECT * warning');
  }
}

// ===== MAIN TEST RUNNER =====

async function runAllTests() {
  console.log('\n🧪 200X SANDBOX SMOKE TESTS\n');
  console.log('============================\n');
  
  // Run all utility tests
  await runTest('UltraCache - Basic operations', testUltraCache);
  await runTest('BatchProcessor - Batch processing', testBatchProcessor);
  await runTest('CircuitBreaker - Failure handling', testCircuitBreaker);
  await runTest('ConnectionPool - Connection management', testConnectionPool);
  await runTest('RateLimiter - Token bucket', testRateLimiter);
  await runTest('PerformanceMonitor - Metrics & timing', testPerformanceMonitor);
  await runTest('QueryOptimizer - Query analysis', testQueryOptimizer);
  
  // Summary
  console.log('\n============================');
  console.log('📊 TEST SUMMARY\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️ Total Duration: ${totalDuration}ms`);
  console.log(`\nSuccess Rate: ${Math.round((passed / total) * 100)}%`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }
  
  console.log('\n============================\n');
  
  return {
    success: failed === 0,
    passed,
    failed,
    total,
    results
  };
}

// Run if executed directly
if (require.main === module) {
  runAllTests()
    .then(summary => {
      process.exit(summary.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

export { runAllTests };
