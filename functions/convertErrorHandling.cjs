#!/usr/bin/env node
/**
 * Error Handling Conversion Script
 * Applies standardized error handling to Base44 functions
 */

const fs = require('fs');
const path = require('path');

// Configuration
const FUNCTIONS_DIR = '/root/clawd/local-rnk-booster/functions';
const ERROR_HANDLER_IMPORT = "import { withErrorHandler, FunctionError, successResponse } from '../utils/errorHandler';";
const ERROR_HANDLER_IMPORT_ADMIN = "import { withErrorHandler, FunctionError, successResponse } from '../utils/errorHandler';";

// Track results
const results = {
  converted: [],
  skipped: [],
  errors: [],
  needsManualReview: []
};

/**
 * Detect function pattern
 */
function detectPattern(content) {
  // Already has withErrorHandler
  if (content.includes('withErrorHandler')) {
    return 'already-converted';
  }
  
  // Deno.serve pattern
  if (content.includes('Deno.serve')) {
    return 'deno-serve';
  }
  
  // Export default async function pattern
  if (content.match(/export\s+default\s+async\s+function\s+\w+\s*\(/)) {
    return 'export-default-async';
  }
  
  // Export default function pattern
  if (content.match(/export\s+default\s+(async\s+)?function\s*\(/)) {
    return 'export-default';
  }
  
  // Named export pattern
  if (content.match(/export\s+(async\s+)?function\s+\w+\s*\(/)) {
    return 'named-export';
  }
  
  // Arrow function export
  if (content.match(/export\s+default\s+/)) {
    return 'arrow-export';
  }
  
  return 'unknown';
}

/**
 * Convert export default async function pattern
 */
function convertExportDefaultAsync(content, filePath) {
  let modified = content;
  
  // Add import if not present
  const relativePath = filePath.includes('/admin/') ? './utils/errorHandler' : '../utils/errorHandler';
  const importLine = `import { withErrorHandler, FunctionError, successResponse } from '${relativePath}';`;
  
  if (!content.includes('errorHandler')) {
    // Find the best place to add import
    const importMatch = content.match(/^(import\s+.*;\n)/m);
    if (importMatch) {
      modified = modified.replace(importMatch[1], importMatch[1] + importLine + '\n');
    } else {
      // Add at the top after comments
      const commentEnd = content.match(/(\*\/\s*\n)/);
      if (commentEnd) {
        modified = modified.replace(commentEnd[1], commentEnd[1] + '\n' + importLine + '\n');
      } else {
        modified = importLine + '\n' + modified;
      }
    }
  }
  
  // Extract function name and body
  const funcMatch = modified.match(/export\s+default\s+async\s+function\s+(\w+)\s*\(([^)]*)\)\s*\{/);
  if (!funcMatch) return null;
  
  const funcName = funcMatch[1];
  const params = funcMatch[2];
  
  // Replace export default async function name(params) {
  // with async function name(params) {
  modified = modified.replace(
    /export\s+default\s+async\s+function\s+\w+\s*\(/,
    `async function ${funcName}Handler(`
  );
  
  // Add export default withErrorHandler at the end
  if (!modified.includes(`export default withErrorHandler(${funcName}Handler)`)) {
    // Remove existing export default if any
    modified = modified.replace(/export\s+default\s+\w+\s*;?\s*$/, '');
    
    // Add the wrapper at the end
    modified = modified.trim() + `\n\nexport default withErrorHandler(${funcName}Handler);\n`;
  }
  
  return modified;
}

/**
 * Convert Deno.serve pattern
 */
function convertDenoServe(content, filePath) {
  let modified = content;
  
  // Add import if not present
  const relativePath = filePath.includes('/admin/') ? './utils/errorHandler' : '../utils/errorHandler';
  const importLine = `import { withDenoErrorHandler, FunctionError } from '${relativePath}';`;
  
  if (!content.includes('errorHandler') && !content.includes('FunctionError')) {
    const importMatch = content.match(/^(import\s+.*;\n)/m);
    if (importMatch) {
      modified = modified.replace(importMatch[1], importMatch[1] + importLine + '\n');
    } else {
      const commentEnd = content.match(/(\*\/\s*\n)/);
      if (commentEnd) {
        modified = modified.replace(commentEnd[1], commentEnd[1] + '\n' + importLine + '\n');
      } else {
        modified = importLine + '\n' + modified;
      }
    }
  }
  
  // Wrap Deno.serve handler with withDenoErrorHandler
  // Pattern: Deno.serve(async (req) => { ... })
  modified = modified.replace(
    /Deno\.serve\(\s*async\s*\(([^)]*)\)\s*=>/g,
    'Deno.serve(withDenoErrorHandler(async ($1) =>'
  );
  
  // Pattern: Deno.serve((req) => { ... })
  modified = modified.replace(
    /Deno\.serve\(\s*\(([^)]*)\)\s*=>/g,
    'Deno.serve(withDenoErrorHandler(($1) =>'
  );
  
  // Pattern: Deno.serve(async function handler(req) { ... })
  modified = modified.replace(
    /Deno\.serve\(\s*async\s+function\s+(\w+)\s*\(/g,
    'Deno.serve(withDenoErrorHandler(async function $1('
  );
  
  return modified;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const pattern = detectPattern(content);
    
    if (pattern === 'already-converted') {
      results.skipped.push({ file: filePath, reason: 'Already has error handling' });
      return;
    }
    
    if (pattern === 'unknown') {
      results.needsManualReview.push({ file: filePath, reason: 'Unknown pattern' });
      return;
    }
    
    let modified = null;
    
    switch (pattern) {
      case 'export-default-async':
        modified = convertExportDefaultAsync(content, filePath);
        break;
      case 'deno-serve':
        modified = convertDenoServe(content, filePath);
        break;
      case 'export-default':
      case 'named-export':
      case 'arrow-export':
        results.needsManualReview.push({ file: filePath, reason: `Pattern: ${pattern}` });
        return;
    }
    
    if (modified && modified !== content) {
      fs.writeFileSync(filePath, modified, 'utf8');
      results.converted.push({ file: filePath, pattern });
    } else {
      results.skipped.push({ file: filePath, reason: 'No changes needed' });
    }
    
  } catch (error) {
    results.errors.push({ file: filePath, error: error.message });
  }
}

/**
 * Process files in priority order
 */
function processFiles() {
  // Priority 1: Admin functions
  const adminFiles = fs.readdirSync(path.join(FUNCTIONS_DIR, 'admin'))
    .filter(f => f.endsWith('.ts') && f !== 'index.ts')
    .map(f => path.join(FUNCTIONS_DIR, 'admin', f));
  
  console.log(`Processing ${adminFiles.length} admin files...`);
  adminFiles.forEach(processFile);
  
  // Priority 2: Stripe/Payment functions
  const paymentPatterns = ['stripe', 'payment', 'checkout', 'refund'];
  const allFiles = [];
  
  function walkDir(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('utils')) {
        walkDir(fullPath);
      } else if (item.endsWith('.ts') && !item.includes('.test.')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (paymentPatterns.some(p => content.toLowerCase().includes(p))) {
          allFiles.push(fullPath);
        }
      }
    }
  }
  
  walkDir(FUNCTIONS_DIR);
  
  // Remove duplicates and already processed
  const uniqueFiles = [...new Set(allFiles)].filter(f => !adminFiles.includes(f));
  
  console.log(`Processing ${uniqueFiles.length} payment/stripe files...`);
  uniqueFiles.forEach(processFile);
  
  // Priority 3: Webhook handlers
  const webhookFiles = [];
  function findWebhooks(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('utils')) {
        findWebhooks(fullPath);
      } else if (item.toLowerCase().includes('webhook') && item.endsWith('.ts')) {
        webhookFiles.push(fullPath);
      }
    }
  }
  findWebhooks(FUNCTIONS_DIR);
  
  const newWebhookFiles = webhookFiles.filter(f => !adminFiles.includes(f) && !uniqueFiles.includes(f));
  console.log(`Processing ${newWebhookFiles.length} webhook files...`);
  newWebhookFiles.forEach(processFile);
  
  return results;
}

// Run the conversion
console.log('Starting error handling conversion...\n');
processFiles();

console.log('\n=== CONVERSION RESULTS ===');
console.log(`Converted: ${results.converted.length}`);
console.log(`Skipped: ${results.skipped.length}`);
console.log(`Errors: ${results.errors.length}`);
console.log(`Needs Manual Review: ${results.needsManualReview.length}`);

if (results.converted.length > 0) {
  console.log('\n=== CONVERTED FILES ===');
  results.converted.forEach(r => console.log(`✓ ${r.file} (${r.pattern})`));
}

if (results.needsManualReview.length > 0) {
  console.log('\n=== NEEDS MANUAL REVIEW ===');
  results.needsManualReview.forEach(r => console.log(`⚠ ${r.file} - ${r.reason}`));
}

if (results.errors.length > 0) {
  console.log('\n=== ERRORS ===');
  results.errors.forEach(r => console.log(`✗ ${r.file} - ${r.error}`));
}
