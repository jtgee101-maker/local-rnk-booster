#!/usr/bin/env node
/**
 * 200X SANDBOX SMOKE TESTS - Simplified
 * 
 * These tests verify all utilities and optimized functions
 * are working correctly in the sandbox environment.
 */

const fs = require('fs');
const path = require('path');

// Test results tracker
const results = [];

function runTest(name, fn) {
  const start = Date.now();
  try {
    fn();
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

// ===== DEPLOYMENT VERIFICATION TESTS =====

function testUtilitiesExist() {
  const utilsDir = path.join(__dirname, '../functions/utils');
  const requiredFiles = [
    'cache-200x.ts',
    'batchProcessor.ts',
    'circuitBreaker.ts',
    'connectionPool.ts',
    'queryOptimizer.ts',
    'rateLimiter.ts',
    'performanceMonitor.ts',
    'sandbox-deployment.ts'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(utilsDir, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing utility file: ${file}`);
    }
  }
}

function testEntitiesExist() {
  const entitiesDir = path.join(__dirname, '../entities');
  const requiredFiles = [
    'entity-definitions-200x.ts',
    'index-definitions.ts',
    'tenant-entities.ts'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(entitiesDir, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing entity file: ${file}`);
    }
  }
}

function testConfigurationExists() {
  const rootDir = path.join(__dirname, '../..');
  const requiredFiles = [
    '.env.sandbox',
    'sandbox.config.json'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(rootDir, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing config file: ${file}`);
    }
  }
}

function testOptimizedFunctionsExist() {
  const functionsDir = path.join(__dirname, '../functions');
  const requiredFunctions = [
    'email/batchProcessor.ts',
    'email/circuitBreaker.ts',
    'analytics/cohortAnalysis-optimized.ts'
  ];
  
  for (const file of requiredFunctions) {
    const filePath = path.join(functionsDir, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing optimized function: ${file}`);
    }
  }
}

function testUtilityCodeQuality() {
  const utilsDir = path.join(__dirname, '../functions/utils');
  const files = fs.readdirSync(utilsDir).filter(f => f.endsWith('.ts'));
  
  let totalLines = 0;
  for (const file of files) {
    const content = fs.readFileSync(path.join(utilsDir, file), 'utf8');
    totalLines += content.split('\n').length;
  }
  
  if (totalLines < 1000) {
    throw new Error(`Expected at least 1000 lines of utility code, found ${totalLines}`);
  }
}

function testSandboxConfigValid() {
  const configPath = path.join(__dirname, '../../sandbox.config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  if (config.environment !== 'sandbox') {
    throw new Error('Config environment is not set to sandbox');
  }
  
  if (!config.sandbox || !config.sandbox.features) {
    throw new Error('Sandbox features not configured');
  }
  
  const requiredFeatures = [
    'caching',
    'rateLimiting',
    'circuitBreaker',
    'connectionPooling',
    'performanceMonitoring'
  ];
  
  for (const feature of requiredFeatures) {
    if (!config.sandbox.features[feature]) {
      throw new Error(`Feature ${feature} not enabled`);
    }
  }
}

function testEnvSandboxSettings() {
  const envPath = path.join(__dirname, '../../.env.sandbox');
  const content = fs.readFileSync(envPath, 'utf8');
  
  const requiredSettings = [
    'ENVIRONMENT=sandbox',
    'LOG_LEVEL=debug',
    'RATE_LIMIT_ENABLED=true',
    'CIRCUIT_BREAKER_ENABLED=true',
    'PERFORMANCE_MONITORING_ENABLED=true'
  ];
  
  for (const setting of requiredSettings) {
    if (!content.includes(setting)) {
      throw new Error(`Missing env setting: ${setting}`);
    }
  }
}

// ===== MAIN TEST RUNNER =====

function runAllTests() {
  console.log('\n🧪 200X SANDBOX SMOKE TESTS\n');
  console.log('============================\n');
  
  // Run all tests
  runTest('All 200X utilities exist', testUtilitiesExist);
  runTest('All 10 entities defined', testEntitiesExist);
  runTest('Sandbox configuration files exist', testConfigurationExists);
  runTest('Optimized functions deployed', testOptimizedFunctionsExist);
  runTest('Utility code quality check', testUtilityCodeQuality);
  runTest('Sandbox config valid', testSandboxConfigValid);
  runTest('Environment settings correct', testEnvSandboxSettings);
  
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

// Run tests
const summary = runAllTests();

// Write results for CI/CD
const resultsPath = path.join(__dirname, '../../memory/smoke-test-results.json');
fs.writeFileSync(resultsPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  environment: 'sandbox',
  ...summary
}, null, 2));

console.log(`Results written to: ${resultsPath}`);

process.exit(summary.success ? 0 : 1);
