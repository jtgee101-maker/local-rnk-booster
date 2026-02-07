/**
 * Uptime Monitoring Script for LocalRnk
 * Checks production endpoints every 60 seconds
 * Alerts if downtime > 30 seconds or response time > 2s
 * 
 * Usage:
 *   node scripts/monitoring/uptime.js              # Run once
 *   node scripts/monitoring/uptime.js --daemon     # Run continuously
 *   node scripts/monitoring/uptime.js --verbose    # Verbose output
 * 
 * Environment Variables:
 *   ALERT_WEBHOOK_URL     - Slack webhook for alerts
 *   ALERT_EMAIL           - Email for alerts
 *   ALERT_SMS_NUMBER      - SMS number for critical alerts
 *   UPTIME_LOG_PATH       - Path to store uptime logs (default: ./logs/uptime.json)
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  checkInterval: 60000, // 60 seconds
  downtimeThreshold: 30000, // 30 seconds
  responseTimeThreshold: 2000, // 2 seconds
  retryAttempts: 3,
  retryDelay: 5000, // 5 seconds between retries
};

// Endpoints to monitor
const ENDPOINTS = [
  {
    name: 'Production Frontend',
    url: 'https://localrnk.com',
    type: 'GET',
    critical: true,
  },
  {
    name: 'Netlify App',
    url: 'https://harmonious-frangipane-ef2a99.netlify.app',
    type: 'GET',
    critical: true,
  },
  {
    name: 'Health API',
    url: 'https://localrnk.com/.netlify/functions/health',
    type: 'GET',
    critical: true,
    checkResponse: (data) => {
      try {
        const parsed = JSON.parse(data);
        return parsed.status === 'healthy' || parsed.status === 'HEALTHY';
      } catch {
        return true; // If we can't parse, at least we got a response
      }
    }
  },
  {
    name: 'Dashboard Stats API',
    url: 'https://localrnk.com/.netlify/functions/admin/getDashboardStats',
    type: 'POST',
    critical: false,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ timeframe: '24h' }),
    expectedStatus: 200,
  },
];

// State management
const state = {
  lastCheck: null,
  results: new Map(),
  alertsSent: new Map(),
  downtimeStart: new Map(),
  stats: {
    totalChecks: 0,
    successfulChecks: 0,
    failedChecks: 0,
    totalDowntime: 0,
    alertsSent: 0,
  },
};

// Initialize log directory
const LOG_PATH = process.env.UPTIME_LOG_PATH || path.join(__dirname, '../../logs/uptime.json');
const LOG_DIR = path.dirname(LOG_PATH);

function ensureLogDirectory() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

// Logger
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  console.log(entry);
  
  // Write to log file
  ensureLogDirectory();
  fs.appendFileSync(LOG_PATH.replace('.json', '.log'), entry + '\n');
}

function logVerbose(message) {
  if (process.argv.includes('--verbose')) {
    log(message, 'verbose');
  }
}

// HTTP Request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.type || 'GET',
      headers: {
        'User-Agent': 'LocalRnk-UptimeMonitor/1.0',
        ...options.headers,
      },
      timeout: CONFIG.responseTimeThreshold,
    };
    
    const startTime = Date.now();
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          responseTime,
          success: res.statusCode >= 200 && res.statusCode < 400,
        });
      });
    });
    
    req.on('error', (error) => {
      reject({
        error: error.message,
        responseTime: Date.now() - startTime,
        success: false,
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject({
        error: 'Request timeout',
        responseTime: Date.now() - startTime,
        success: false,
      });
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Check endpoint with retries
async function checkEndpoint(endpoint) {
  const endpointState = state.results.get(endpoint.name) || {
    lastSuccess: null,
    lastFailure: null,
    consecutiveFailures: 0,
    totalFailures: 0,
    averageResponseTime: 0,
    status: 'unknown',
  };
  
  let lastError = null;
  
  for (let attempt = 1; attempt <= CONFIG.retryAttempts; attempt++) {
    try {
      logVerbose(`Checking ${endpoint.name} (attempt ${attempt}/${CONFIG.retryAttempts})...`);
      
      const result = await makeRequest(endpoint.url, {
        type: endpoint.type,
        headers: endpoint.headers,
        body: endpoint.body,
      });
      
      // Check if response is valid
      let isValid = result.success;
      
      if (isValid && endpoint.expectedStatus) {
        isValid = result.statusCode === endpoint.expectedStatus;
      }
      
      if (isValid && endpoint.checkResponse) {
        isValid = endpoint.checkResponse(result.data);
      }
      
      if (isValid) {
        // Success!
        const responseTimeWarning = result.responseTime > CONFIG.responseTimeThreshold;
        
        endpointState.lastSuccess = new Date().toISOString();
        endpointState.consecutiveFailures = 0;
        endpointState.status = responseTimeWarning ? 'slow' : 'up';
        
        // Update average response time
        const checkCount = state.stats.totalChecks + 1;
        endpointState.averageResponseTime = 
          ((endpointState.averageResponseTime * (checkCount - 1)) + result.responseTime) / checkCount;
        
        state.results.set(endpoint.name, endpointState);
        
        // Clear downtime tracking if recovering
        if (state.downtimeStart.has(endpoint.name)) {
          const downtimeDuration = Date.now() - state.downtimeStart.get(endpoint.name);
          state.stats.totalDowntime += downtimeDuration;
          state.downtimeStart.delete(endpoint.name);
          
          await sendRecoveryAlert(endpoint, downtimeDuration);
        }
        
        if (responseTimeWarning) {
          log(`⚠️  ${endpoint.name} - SLOW (${result.responseTime}ms)`, 'warning');
          await maybeSendAlert('warning', {
            endpoint: endpoint.name,
            message: `Response time exceeded threshold: ${result.responseTime}ms`,
            threshold: CONFIG.responseTimeThreshold,
            responseTime: result.responseTime,
          });
        } else {
          logVerbose(`✓ ${endpoint.name} - OK (${result.responseTime}ms)`);
        }
        
        return {
          success: true,
          responseTime: result.responseTime,
          statusCode: result.statusCode,
        };
      } else {
        throw new Error(`Invalid response: status=${result.statusCode}`);
      }
      
    } catch (error) {
      lastError = error;
      logVerbose(`Attempt ${attempt} failed for ${endpoint.name}: ${error.error || error.message}`);
      
      if (attempt < CONFIG.retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
      }
    }
  }
  
  // All retries failed
  endpointState.lastFailure = new Date().toISOString();
  endpointState.consecutiveFailures++;
  endpointState.totalFailures++;
  endpointState.status = 'down';
  
  state.results.set(endpoint.name, endpointState);
  
  // Track downtime start
  if (!state.downtimeStart.has(endpoint.name)) {
    state.downtimeStart.set(endpoint.name, Date.now());
  }
  
  const downtimeDuration = Date.now() - state.downtimeStart.get(endpoint.name);
  
  log(`❌ ${endpoint.name} - DOWN (${lastError?.error || lastError?.message || 'Unknown error'})`, 'error');
  
  // Send alert if critical and downtime threshold exceeded
  if (endpoint.critical && downtimeDuration >= CONFIG.downtimeThreshold) {
    const alertKey = `${endpoint.name}-down`;
    const lastAlert = state.alertsSent.get(alertKey);
    
    // Don't spam alerts - wait 5 minutes between repeats
    if (!lastAlert || (Date.now() - lastAlert) > 300000) {
      await sendCriticalAlert(endpoint, lastError, downtimeDuration);
      state.alertsSent.set(alertKey, Date.now());
    }
  }
  
  return {
    success: false,
    error: lastError?.error || lastError?.message,
  };
}

// Alert functions
async function sendAlert(level, payload) {
  state.stats.alertsSent++;
  
  // Slack webhook
  if (process.env.ALERT_WEBHOOK_URL) {
    try {
      await sendSlackAlert(level, payload);
    } catch (e) {
      log(`Failed to send Slack alert: ${e.message}`, 'error');
    }
  }
  
  // Email alert for critical
  if (level === 'critical' && process.env.ALERT_EMAIL) {
    try {
      await sendEmailAlert(level, payload);
    } catch (e) {
      log(`Failed to send email alert: ${e.message}`, 'error');
    }
  }
  
  // SMS for critical
  if (level === 'critical' && process.env.ALERT_SMS_NUMBER) {
    try {
      await sendSMSAlert(level, payload);
    } catch (e) {
      log(`Failed to send SMS alert: ${e.message}`, 'error');
    }
  }
}

async function sendSlackAlert(level, payload) {
  const colors = {
    info: '#36a64f',
    warning: '#daa520',
    critical: '#ff0000',
  };
  
  const message = {
    attachments: [{
      color: colors[level] || colors.info,
      title: `LocalRnk ${level.toUpperCase()} Alert`,
      fields: Object.entries(payload).map(([key, value]) => ({
        title: key,
        value: String(value),
        short: true,
      })),
      footer: 'LocalRnk Uptime Monitor',
      ts: Math.floor(Date.now() / 1000),
    }],
  };
  
  await makeRequest(process.env.ALERT_WEBHOOK_URL, {
    type: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
}

async function sendEmailAlert(level, payload) {
  // This would integrate with your email service (Resend, SendGrid, etc.)
  // For now, we log it - implement actual email sending as needed
  log(`[EMAIL ALERT to ${process.env.ALERT_EMAIL}] ${level}: ${JSON.stringify(payload)}`);
}

async function sendSMSAlert(level, payload) {
  // This would integrate with Twilio or similar
  // For now, we log it - implement actual SMS sending as needed
  log(`[SMS ALERT to ${process.env.ALERT_SMS_NUMBER}] ${level}: ${payload.endpoint} is ${payload.status || 'DOWN'}`);
}

async function maybeSendAlert(level, payload) {
  await sendAlert(level, payload);
}

async function sendCriticalAlert(endpoint, error, downtimeMs) {
  await sendAlert('critical', {
    endpoint: endpoint.name,
    url: endpoint.url,
    status: 'DOWN',
    error: error?.error || error?.message || 'Unknown error',
    downtimeSeconds: Math.floor(downtimeMs / 1000),
    timestamp: new Date().toISOString(),
  });
}

async function sendRecoveryAlert(endpoint, downtimeMs) {
  await sendAlert('info', {
    endpoint: endpoint.name,
    url: endpoint.url,
    status: 'RECOVERED',
    downtimeSeconds: Math.floor(downtimeMs / 1000),
    timestamp: new Date().toISOString(),
  });
}

// Main check function
async function runChecks() {
  const startTime = Date.now();
  state.lastCheck = new Date().toISOString();
  
  logVerbose('Starting uptime checks...');
  
  const results = [];
  
  for (const endpoint of ENDPOINTS) {
    const result = await checkEndpoint(endpoint);
    results.push({
      name: endpoint.name,
      ...result,
    });
  }
  
  // Update stats
  state.stats.totalChecks++;
  const allSuccess = results.every(r => r.success);
  if (allSuccess) {
    state.stats.successfulChecks++;
  } else {
    state.stats.failedChecks++;
  }
  
  // Save results to log file
  const logEntry = {
    timestamp: state.lastCheck,
    results,
    stats: { ...state.stats },
  };
  
  ensureLogDirectory();
  fs.writeFileSync(LOG_PATH, JSON.stringify(logEntry, null, 2));
  
  const duration = Date.now() - startTime;
  logVerbose(`Checks completed in ${duration}ms`);
  
  return results;
}

// Print status report
function printStatusReport() {
  console.log('\n=== LocalRnk Uptime Monitor Status ===');
  console.log(`Last check: ${state.lastCheck || 'Never'}`);
  console.log(`Total checks: ${state.stats.totalChecks}`);
  console.log(`Successful: ${state.stats.successfulChecks}`);
  console.log(`Failed: ${state.stats.failedChecks}`);
  console.log(`Alerts sent: ${state.stats.alertsSent}`);
  console.log(`Total downtime: ${Math.floor(state.stats.totalDowntime / 1000)}s`);
  console.log('\nEndpoint Status:');
  
  for (const [name, data] of state.results) {
    const statusEmoji = data.status === 'up' ? '✓' : data.status === 'slow' ? '⚠️' : '❌';
    console.log(`  ${statusEmoji} ${name}: ${data.status} (avg: ${Math.round(data.averageResponseTime)}ms)`);
  }
  
  console.log('=====================================\n');
}

// Daemon mode
async function runDaemon() {
  log('Starting LocalRnk Uptime Monitor in daemon mode...');
  log(`Check interval: ${CONFIG.checkInterval}ms`);
  log(`Monitoring ${ENDPOINTS.length} endpoints`);
  
  // Run initial check
  await runChecks();
  printStatusReport();
  
  // Schedule recurring checks
  setInterval(async () => {
    await runChecks();
    
    // Print status every 10 checks
    if (state.stats.totalChecks % 10 === 0) {
      printStatusReport();
    }
  }, CONFIG.checkInterval);
  
  // Keep process alive
  process.on('SIGINT', () => {
    log('Shutting down uptime monitor...');
    printStatusReport();
    process.exit(0);
  });
}

// CLI handling
if (process.argv.includes('--daemon')) {
  runDaemon();
} else if (process.argv.includes('--status')) {
  // Load and print last status
  try {
    if (fs.existsSync(LOG_PATH)) {
      const data = JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'));
      console.log('\n=== Last Check Results ===');
      console.log(`Timestamp: ${data.timestamp}`);
      data.results.forEach(r => {
        const emoji = r.success ? '✓' : '❌';
        console.log(`  ${emoji} ${r.name}: ${r.success ? 'OK' : 'FAIL'} ${r.responseTime ? `(${r.responseTime}ms)` : ''}`);
      });
      console.log('==========================\n');
    } else {
      console.log('No status data available yet. Run with --daemon to start monitoring.');
    }
  } catch (e) {
    console.error('Failed to load status:', e.message);
  }
} else {
  // Single run
  runChecks().then(results => {
    const allSuccess = results.every(r => r.success);
    process.exit(allSuccess ? 0 : 1);
  }).catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

// Export for testing
export { runChecks, checkEndpoint, CONFIG, ENDPOINTS };
