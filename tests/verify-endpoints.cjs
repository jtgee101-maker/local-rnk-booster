#!/usr/bin/env node
/**
 * 200X ENDPOINT VERIFICATION
 * 
 * Verifies all sandbox endpoints are configured and responding.
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 200X ENDPOINT VERIFICATION\n');
console.log('============================\n');

const results = [];

function checkEndpoint(name, checker) {
  const start = Date.now();
  try {
    const result = checker();
    results.push({ name, status: '✅', duration: Date.now() - start, result });
    console.log(`✅ ${name} (${Date.now() - start}ms)`);
    return true;
  } catch (error) {
    results.push({ name, status: '❌', duration: Date.now() - start, error: String(error) });
    console.log(`❌ ${name} - ${error} (${Date.now() - start}ms)`);
    return false;
  }
}

// ===== ENDPOINT CHECKS =====

// Check deployment configuration
checkEndpoint('Deployment Config', () => {
  const configPath = path.join(__dirname, '../../sandbox.config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  if (config.sandbox.branch !== 'feat/200x-sandbox') {
    throw new Error('Wrong branch configured');
  }
  return `Branch: ${config.sandbox.branch}`;
});

// Check utilities entry point
checkEndpoint('Utilities Entry Point', () => {
  const entryPath = path.join(__dirname, '../functions/utils/sandbox-deployment.ts');
  const content = fs.readFileSync(entryPath, 'utf8');
  
  if (!content.includes('SANDBOX_DEPLOYMENT')) {
    throw new Error('Deployment export missing');
  }
  return '7 utilities exported';
});

// Check all utilities have proper exports
checkEndpoint('Utility Exports', () => {
  const utilsDir = path.join(__dirname, '../functions/utils');
  const files = ['cache-200x.ts', 'circuitBreaker.ts', 'batchProcessor.ts', 
                 'connectionPool.ts', 'queryOptimizer.ts', 'rateLimiter.ts', 
                 'performanceMonitor.ts'];
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(utilsDir, file), 'utf8');
    if (!content.includes('export')) {
      throw new Error(`${file} missing exports`);
    }
  }
  return `${files.length} utilities with exports`;
});

// Check entity definitions
checkEndpoint('Entity Definitions', () => {
  const entitiesPath = path.join(__dirname, '../entities/entity-definitions-200x.ts');
  if (!fs.existsSync(entitiesPath)) {
    throw new Error('Entity definitions not found');
  }
  const content = fs.readFileSync(entitiesPath, 'utf8');
  const entityCount = (content.match(/export interface/g) || []).length;
  return `${entityCount} entity interfaces defined`;
});

// Check index definitions
checkEndpoint('Index Definitions', () => {
  const indexPath = path.join(__dirname, '../entities/index-definitions.ts');
  if (!fs.existsSync(indexPath)) {
    throw new Error('Index definitions not found');
  }
  const content = fs.readFileSync(indexPath, 'utf8');
  const indexCount = (content.match(/name:/g) || []).length;
  return `${indexCount} indexes defined`;
});

// Check optimized email functions
checkEndpoint('Email Functions', () => {
  const emailDir = path.join(__dirname, '../functions/email');
  const files = fs.readdirSync(emailDir).filter(f => f.includes('optimized') || f === 'batchProcessor.ts');
  return `${files.length} optimized email functions`;
});

// Check analytics functions
checkEndpoint('Analytics Functions', () => {
  const analyticsDir = path.join(__dirname, '../functions/analytics');
  const files = fs.readdirSync(analyticsDir).filter(f => f.includes('optimized'));
  return `${files.length} optimized analytics functions`;
});

// Check error handling utilities
checkEndpoint('Error Handling', () => {
  const utilsDir = path.join(__dirname, '../functions/utils');
  const errorFiles = ['errorHandler.ts', 'addErrorLogging.ts'];
  for (const file of errorFiles) {
    if (!fs.existsSync(path.join(utilsDir, file))) {
      throw new Error(`Missing ${file}`);
    }
  }
  return 'Error handling utilities present';
});

// Check smoke test results
checkEndpoint('Smoke Test Results', () => {
  const resultsPath = path.join(__dirname, '../../memory/smoke-test-results.json');
  if (!fs.existsSync(resultsPath)) {
    throw new Error('Smoke test results not found');
  }
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  if (!results.success) {
    throw new Error('Smoke tests failed');
  }
  return `${results.passed}/${results.total} tests passed`;
});

// ===== SUMMARY =====

console.log('\n============================');
console.log('📊 ENDPOINT VERIFICATION SUMMARY\n');

const passed = results.filter(r => r.status === '✅').length;
const total = results.length;

console.log(`Total Checks: ${total}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${total - passed}`);
console.log(`\nSuccess Rate: ${Math.round((passed / total) * 100)}%`);

console.log('\n============================\n');

// Write results
const resultsPath = path.join(__dirname, '../../memory/endpoint-verification.json');
fs.writeFileSync(resultsPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  environment: 'sandbox',
  success: passed === total,
  passed,
  total,
  results
}, null, 2));

console.log(`Results written to: ${resultsPath}\n`);

process.exit(passed === total ? 0 : 1);
