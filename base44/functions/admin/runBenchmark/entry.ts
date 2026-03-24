/**
 * Performance Benchmark Utility for LocalRnk
 * 
 * Benchmarks:
 * - Query response times
 * - Cache hit rates
 * - Connection pooling efficiency
 * - Cold start performance
 */

import { dbMonitor } from '../utils/performanceMonitor';
import { cache } from '../utils/cache';

interface BenchmarkConfig {
  iterations: number;
  warmupIterations: number;
  collections: string[];
}

interface BenchmarkResult {
  name: string;
  duration: number;
  iterations: number;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  p95Latency: number;
  p99Latency: number;
  throughput: number; // ops/sec
  errors: number;
}

interface BenchmarkSuite {
  name: string;
  description: string;
  results: BenchmarkResult[];
  summary: {
    totalDuration: number;
    totalOperations: number;
    avgThroughput: number;
    errorRate: number;
  };
}

class PerformanceBenchmark {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  /**
   * Run full benchmark suite
   */
  async runFullSuite(config: Partial<BenchmarkConfig> = {}): Promise<{
    timestamp: string;
    environment: string;
    suites: BenchmarkSuite[];
    recommendations: string[];
  }> {
    const fullConfig: BenchmarkConfig = {
      iterations: 100,
      warmupIterations: 10,
      collections: ['users', 'tenants', 'orders', 'leads'],
      ...config
    };

    const suites: BenchmarkSuite[] = [];

    // Run all benchmark suites
    suites.push(await this.benchmarkQueries(fullConfig));
    suites.push(await this.benchmarkCache());
    suites.push(await this.benchmarkAggregations(fullConfig));
    suites.push(await this.benchmarkWrites(fullConfig));

    return {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      suites,
      recommendations: this.generateRecommendations(suites)
    };
  }

  /**
   * Benchmark read queries
   */
  async benchmarkQueries(config: BenchmarkConfig): Promise<BenchmarkSuite> {
    const results: BenchmarkResult[] = [];

    for (const collectionName of config.collections) {
      const collection = this.db.collections[collectionName];
      if (!collection) continue;

      // Warmup
      for (let i = 0; i < config.warmupIterations; i++) {
        await collection.findOne({});
      }

      // Benchmark findOne
      const latencies: number[] = [];
      let errors = 0;
      const start = performance.now();

      for (let i = 0; i < config.iterations; i++) {
        const queryStart = performance.now();
        try {
          await collection.findOne({});
          latencies.push(performance.now() - queryStart);
        } catch (e) {
          errors++;
        }
      }

      const duration = performance.now() - start;
      
      results.push(this.calculateStats(
        `${collectionName}.findOne`,
        latencies,
        duration,
        config.iterations,
        errors
      ));

      // Benchmark find with limit
      const limitLatencies: number[] = [];
      errors = 0;
      const limitStart = performance.now();

      for (let i = 0; i < config.iterations; i++) {
        const queryStart = performance.now();
        try {
          await collection.find({}).limit(10).toArray();
          limitLatencies.push(performance.now() - queryStart);
        } catch (e) {
          errors++;
        }
      }

      results.push(this.calculateStats(
        `${collectionName}.find(limit:10)`,
        limitLatencies,
        performance.now() - limitStart,
        config.iterations,
        errors
      ));
    }

    return this.createSuite('Read Queries', 'Standard read operations across collections', results);
  }

  /**
   * Benchmark cache performance
   */
  async benchmarkCache(): Promise<BenchmarkSuite> {
    const results: BenchmarkResult[] = [];
    const iterations = 1000;

    // Warmup
    for (let i = 0; i < 100; i++) {
      await cache.set(`warmup_${i}`, { data: i });
      await cache.get(`warmup_${i}`);
    }

    // Benchmark cache writes
    const writeLatencies: number[] = [];
    let errors = 0;
    const writeStart = performance.now();

    for (let i = 0; i < iterations; i++) {
      const queryStart = performance.now();
      try {
        await cache.set(`bench_write_${i}`, { data: i, timestamp: Date.now() });
        writeLatencies.push(performance.now() - queryStart);
      } catch (e) {
        errors++;
      }
    }

    results.push(this.calculateStats(
      'cache.set',
      writeLatencies,
      performance.now() - writeStart,
      iterations,
      errors
    ));

    // Benchmark cache reads (all hits)
    const readLatencies: number[] = [];
    errors = 0;
    const readStart = performance.now();

    for (let i = 0; i < iterations; i++) {
      const queryStart = performance.now();
      try {
        await cache.get(`bench_write_${i}`);
        readLatencies.push(performance.now() - queryStart);
      } catch (e) {
        errors++;
      }
    }

    results.push(this.calculateStats(
      'cache.get (hit)',
      readLatencies,
      performance.now() - readStart,
      iterations,
      errors
    ));

    // Benchmark cache reads (all misses)
    const missLatencies: number[] = [];
    errors = 0;
    const missStart = performance.now();

    for (let i = 0; i < iterations; i++) {
      const queryStart = performance.now();
      try {
        await cache.get(`nonexistent_key_${i}_${Date.now()}`);
        missLatencies.push(performance.now() - queryStart);
      } catch (e) {
        errors++;
      }
    }

    results.push(this.calculateStats(
      'cache.get (miss)',
      missLatencies,
      performance.now() - missStart,
      iterations,
      errors
    ));

    // Get cache stats
    const stats = cache.getStats();
    console.log('Cache stats:', stats);

    return this.createSuite('Cache Performance', 'In-memory cache read/write operations', results);
  }

  /**
   * Benchmark aggregation queries
   */
  async benchmarkAggregations(config: BenchmarkConfig): Promise<BenchmarkSuite> {
    const results: BenchmarkResult[] = [];

    // Test aggregation on orders collection
    const orders = this.db.collections.orders;
    if (orders) {
      const latencies: number[] = [];
      let errors = 0;
      const start = performance.now();

      for (let i = 0; i < 20; i++) { // Fewer iterations for heavy aggregations
        const queryStart = performance.now();
        try {
          await orders.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ]).toArray();
          latencies.push(performance.now() - queryStart);
        } catch (e) {
          errors++;
        }
      }

      results.push(this.calculateStats(
        'orders.aggregate(revenue)',
        latencies,
        performance.now() - start,
        20,
        errors
      ));
    }

    return this.createSuite('Aggregations', 'Data aggregation and analytics queries', results);
  }

  /**
   * Benchmark write operations
   */
  async benchmarkWrites(config: BenchmarkConfig): Promise<BenchmarkSuite> {
    const results: BenchmarkResult[] = [];
    const testCollection = this.db.collections.benchmark_tests;

    if (!testCollection) {
      return this.createSuite('Write Operations', 'Database write performance', []);
    }

    // Clean up any existing test data
    await testCollection.deleteMany({ _benchmark: true });

    // Benchmark insertOne
    const insertLatencies: number[] = [];
    let errors = 0;
    const insertStart = performance.now();

    for (let i = 0; i < 50; i++) {
      const queryStart = performance.now();
      try {
        await testCollection.insertOne({
          _benchmark: true,
          data: `test_${i}`,
          timestamp: new Date(),
          metadata: { iteration: i }
        });
        insertLatencies.push(performance.now() - queryStart);
      } catch (e) {
        errors++;
      }
    }

    results.push(this.calculateStats(
      'insertOne',
      insertLatencies,
      performance.now() - insertStart,
      50,
      errors
    ));

    // Benchmark updateOne
    const updateLatencies: number[] = [];
    errors = 0;
    const updateStart = performance.now();

    for (let i = 0; i < 50; i++) {
      const queryStart = performance.now();
      try {
        await testCollection.updateOne(
          { _benchmark: true, data: `test_${i}` },
          { $set: { updated: true, updateTime: new Date() } }
        );
        updateLatencies.push(performance.now() - queryStart);
      } catch (e) {
        errors++;
      }
    }

    results.push(this.calculateStats(
      'updateOne',
      updateLatencies,
      performance.now() - updateStart,
      50,
      errors
    ));

    // Cleanup
    await testCollection.deleteMany({ _benchmark: true });

    return this.createSuite('Write Operations', 'Database write performance', results);
  }

  /**
   * Calculate statistics from latency array
   */
  private calculateStats(
    name: string,
    latencies: number[],
    duration: number,
    iterations: number,
    errors: number
  ): BenchmarkResult {
    if (latencies.length === 0) {
      return {
        name,
        duration,
        iterations,
        avgLatency: 0,
        minLatency: 0,
        maxLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
        throughput: 0,
        errors
      };
    }

    const sorted = [...latencies].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      name,
      duration,
      iterations,
      avgLatency: sum / sorted.length,
      minLatency: sorted[0],
      maxLatency: sorted[sorted.length - 1],
      p95Latency: sorted[Math.floor(sorted.length * 0.95)],
      p99Latency: sorted[Math.floor(sorted.length * 0.99)],
      throughput: (iterations / duration) * 1000, // ops/sec
      errors
    };
  }

  /**
   * Create benchmark suite object
   */
  private createSuite(name: string, description: string, results: BenchmarkResult[]): BenchmarkSuite {
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const totalOperations = results.reduce((sum, r) => sum + r.iterations, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

    return {
      name,
      description,
      results,
      summary: {
        totalDuration,
        totalOperations,
        avgThroughput: totalOperations / (totalDuration / 1000),
        errorRate: totalOperations > 0 ? (totalErrors / totalOperations) * 100 : 0
      }
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(suites: BenchmarkSuite[]): string[] {
    const recommendations: string[] = [];

    for (const suite of suites) {
      for (const result of suite.results) {
        // Check for slow queries
        if (result.avgLatency > 100) {
          recommendations.push(
            `${result.name}: High average latency (${result.avgLatency.toFixed(2)}ms). Consider adding indexes.`
          );
        }

        // Check for high error rate
        if (result.errorRate > 1) {
          recommendations.push(
            `${result.name}: High error rate (${result.errorRate.toFixed(2)}%). Check connection pooling.`
          );
        }

        // Check for high variance
        const variance = result.maxLatency - result.minLatency;
        if (variance > result.avgLatency * 2) {
          recommendations.push(
            `${result.name}: High latency variance (${variance.toFixed(2)}ms). Consider query optimization.`
          );
        }
      }
    }

    return recommendations;
  }
}

/**
 * Compare benchmark results
 */
export function compareBenchmarks(
  baseline: BenchmarkSuite[],
  current: BenchmarkSuite[]
): {
  improved: string[];
  degraded: string[];
  unchanged: string[];
} {
  const improved: string[] = [];
  const degraded: string[] = [];
  const unchanged: string[] = [];

  for (const currentSuite of current) {
    const baselineSuite = baseline.find(s => s.name === currentSuite.name);
    if (!baselineSuite) continue;

    for (const currentResult of currentSuite.results) {
      const baselineResult = baselineSuite.results.find(r => r.name === currentResult.name);
      if (!baselineResult) continue;

      const change = ((currentResult.avgLatency - baselineResult.avgLatency) / baselineResult.avgLatency) * 100;

      if (change < -10) {
        improved.push(`${currentResult.name}: ${change.toFixed(1)}% faster`);
      } else if (change > 10) {
        degraded.push(`${currentResult.name}: ${change.toFixed(1)}% slower`);
      } else {
        unchanged.push(`${currentResult.name}: ~${change.toFixed(1)}% change`);
      }
    }
  }

  return { improved, degraded, unchanged };
}

/**
 * Base44 function handler for running benchmarks
 */
export async function runBenchmark(request: any) {
  const {
    iterations = 100,
    collections = ['users', 'tenants', 'orders', 'leads']
  } = request.data || {};

  // Verify admin access
  const currentUser = request.user;
  if (!currentUser || !['admin', 'super-admin'].includes(currentUser.role)) {
    return {
      success: false,
      error: 'Admin access required'
    };
  }

  const benchmark = new PerformanceBenchmark(base44.db);

  try {
    const results = await benchmark.runFullSuite({
      iterations,
      warmupIterations: Math.floor(iterations / 10),
      collections
    });

    return {
      success: true,
      data: results
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

export default PerformanceBenchmark;
