/**
 * DELIVERABILITY MONITORING
 * 
 * Real-time email deliverability tracking and alerting:
 * - Bounce rate monitoring
 * - Spam complaint tracking
 * - Open/click rate analysis
 * - Reputation scoring
 * - Automated alerting
 * 
 * 200X Scale Features:
 * - Sub-minute alerting
 * - Historical trend analysis
 * - Provider comparison
 * - Automatic remediation suggestions
 */

import { getAllCircuitBreakerStatus } from './circuitBreaker.ts';

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type MetricType = 'bounce' | 'complaint' | 'open' | 'click' | 'delivery' | 'deferral';

interface DeliverabilityMetrics {
  totalSent: number;
  delivered: number;
  bounced: number;
  complained: number;
  opened: number;
  clicked: number;
  deferred: number;
  dropped: number;
}

interface RateMetrics {
  bounceRate: number;
  complaintRate: number;
  openRate: number;
  clickRate: number;
  deliveryRate: number;
}

interface AlertThreshold {
  metric: MetricType;
  warning: number;
  critical: number;
  windowMinutes: number;
}

interface DeliverabilityAlert {
  id: string;
  severity: AlertSeverity;
  metric: MetricType;
  message: string;
  currentValue: number;
  threshold: number;
  timestamp: string;
  acknowledged: boolean;
}

interface ReputationScore {
  overall: number;
  providerScores: Record<string, number>;
  factors: Array<{
    name: string;
    impact: number;
    score: number;
  }>;
  lastUpdated: string;
}

interface TrendData {
  timestamp: string;
  rates: RateMetrics;
  volume: number;
}

// Default alert thresholds (percentages)
const DEFAULT_THRESHOLDS: AlertThreshold[] = [
  { metric: 'bounce', warning: 5, critical: 10, windowMinutes: 60 },      // >5% bounce = warning, >10% = critical
  { metric: 'complaint', warning: 0.1, critical: 0.3, windowMinutes: 60 }, // >0.1% complaint = warning
  { metric: 'delivery', warning: 95, critical: 90, windowMinutes: 30 },   // <95% delivery = warning
  { metric: 'open', warning: 10, critical: 5, windowMinutes: 1440 },      // <10% open rate after 24h = warning
];

// Metrics storage (in production, use time-series database)
const metricsHistory: TrendData[] = [];
const activeAlerts: DeliverabilityAlert[] = [];
const alertHistory: DeliverabilityAlert[] = [];
const MAX_HISTORY_SIZE = 10000;

/**
 * Record email event for deliverability tracking
 */
export function recordEmailEvent(
  event: 'sent' | 'delivered' | 'bounced' | 'complained' | 'opened' | 'clicked' | 'deferred' | 'dropped',
  provider: string,
  metadata?: {
    bounceType?: 'hard' | 'soft';
    bounceReason?: string;
    emailDomain?: string;
  }
): void {
  const timestamp = Date.now();
  
  // Store event for analysis
  storeEvent({
    type: event,
    provider,
    timestamp,
    ...metadata
  });

  // Check for immediate alerts
  checkImmediateAlert(event, provider, metadata);
}

/**
 * Get current deliverability metrics
 */
export function getDeliverabilityMetrics(
  base44: any,
  timeWindowMinutes: number = 60
): Promise<DeliverabilityMetrics & RateMetrics & { alerts: DeliverabilityAlert[] }> {
  return calculateMetrics(base44, timeWindowMinutes);
}

/**
 * Get reputation score
 */
export function getReputationScore(
  base44: any
): Promise<ReputationScore> {
  return calculateReputationScore(base44);
}

/**
 * Get trend data
 */
export function getTrendData(
  hours: number = 24
): TrendData[] {
  const cutoff = Date.now() - (hours * 60 * 60 * 1000);
  return metricsHistory.filter(m => new Date(m.timestamp).getTime() > cutoff);
}

/**
 * Acknowledge alert
 */
export function acknowledgeAlert(alertId: string): boolean {
  const alert = activeAlerts.find(a => a.id === alertId);
  if (alert) {
    alert.acknowledged = true;
    return true;
  }
  return false;
}

/**
 * Get active alerts
 */
export function getActiveAlerts(): DeliverabilityAlert[] {
  return activeAlerts.filter(a => !a.acknowledged);
}

/**
 * Update alert thresholds
 */
export function updateThresholds(thresholds: Partial<AlertThreshold>[]): void {
  thresholds.forEach(update => {
    const existing = DEFAULT_THRESHOLDS.find(t => t.metric === update.metric);
    if (existing) {
      Object.assign(existing, update);
    }
  });
}

// ============================================================
// INTERNAL FUNCTIONS
// ============================================================

interface StoredEvent {
  type: string;
  provider: string;
  timestamp: number;
  bounceType?: string;
  bounceReason?: string;
  emailDomain?: string;
}

const eventStore: StoredEvent[] = [];

function storeEvent(event: StoredEvent): void {
  eventStore.push(event);
  
  // Cleanup old events (keep last 24 hours)
  const cutoff = Date.now() - (24 * 60 * 60 * 1000);
  while (eventStore.length > 0 && eventStore[0].timestamp < cutoff) {
    eventStore.shift();
  }
}

async function calculateMetrics(
  base44: any,
  timeWindowMinutes: number
): Promise<DeliverabilityMetrics & RateMetrics & { alerts: DeliverabilityAlert[] }> {
  const cutoff = Date.now() - (timeWindowMinutes * 60 * 1000);
  const recentEvents = eventStore.filter(e => e.timestamp > cutoff);

  // Count events
  const metrics: DeliverabilityMetrics = {
    totalSent: recentEvents.filter(e => e.type === 'sent').length,
    delivered: recentEvents.filter(e => e.type === 'delivered').length,
    bounced: recentEvents.filter(e => e.type === 'bounced').length,
    complained: recentEvents.filter(e => e.type === 'complained').length,
    opened: recentEvents.filter(e => e.type === 'opened').length,
    clicked: recentEvents.filter(e => e.type === 'clicked').length,
    deferred: recentEvents.filter(e => e.type === 'deferred').length,
    dropped: recentEvents.filter(e => e.type === 'dropped').length,
  };

  // Calculate rates
  const rates: RateMetrics = {
    bounceRate: metrics.totalSent > 0 ? (metrics.bounced / metrics.totalSent) * 100 : 0,
    complaintRate: metrics.totalSent > 0 ? (metrics.complained / metrics.totalSent) * 100 : 0,
    openRate: metrics.delivered > 0 ? (metrics.opened / metrics.delivered) * 100 : 0,
    clickRate: metrics.opened > 0 ? (metrics.clicked / metrics.opened) * 100 : 0,
    deliveryRate: metrics.totalSent > 0 ? (metrics.delivered / metrics.totalSent) * 100 : 0,
  };

  // Also fetch from database for complete picture
  try {
    const dbMetrics = await fetchDatabaseMetrics(base44, timeWindowMinutes);
    mergeMetrics(metrics, rates, dbMetrics);
  } catch (error) {
    console.error('[Deliverability] Failed to fetch DB metrics:', error);
  }

  // Check thresholds and create alerts
  const newAlerts = checkThresholds(rates, timeWindowMinutes);
  
  return {
    ...metrics,
    ...rates,
    alerts: [...activeAlerts, ...newAlerts]
  };
}

async function fetchDatabaseMetrics(
  base44: any,
  timeWindowMinutes: number
): Promise<any> {
  try {
    const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000).toISOString();
    
    const logs = await base44.asServiceRole.entities.EmailLog.filter({
      created_date: { $gte: since }
    }, '-created_date', 5000);

    return {
      totalSent: logs.length,
      delivered: logs.filter((l: any) => l.status === 'sent' || l.status === 'delivered').length,
      bounced: logs.filter((l: any) => l.status === 'bounced').length,
      complained: logs.filter((l: any) => l.status === 'complained').length,
      opened: logs.filter((l: any) => l.opened_at).length,
      clicked: logs.filter((l: any) => l.clicked_at).length,
    };
  } catch (error) {
    return null;
  }
}

function mergeMetrics(
  metrics: DeliverabilityMetrics,
  rates: RateMetrics,
  dbMetrics: any
): void {
  if (!dbMetrics) return;

  // Use the higher of the two counts
  metrics.totalSent = Math.max(metrics.totalSent, dbMetrics.totalSent);
  metrics.delivered = Math.max(metrics.delivered, dbMetrics.delivered);
  metrics.bounced = Math.max(metrics.bounced, dbMetrics.bounced);
  metrics.complained = Math.max(metrics.complained, dbMetrics.complained);
  metrics.opened = Math.max(metrics.opened, dbMetrics.opened);
  metrics.clicked = Math.max(metrics.clicked, dbMetrics.clicked);

  // Recalculate rates
  rates.bounceRate = metrics.totalSent > 0 ? (metrics.bounced / metrics.totalSent) * 100 : 0;
  rates.complaintRate = metrics.totalSent > 0 ? (metrics.complained / metrics.totalSent) * 100 : 0;
  rates.openRate = metrics.delivered > 0 ? (metrics.opened / metrics.delivered) * 100 : 0;
  rates.clickRate = metrics.opened > 0 ? (metrics.clicked / metrics.opened) * 100 : 0;
  rates.deliveryRate = metrics.totalSent > 0 ? (metrics.delivered / metrics.totalSent) * 100 : 0;
}

function checkThresholds(rates: RateMetrics, windowMinutes: number): DeliverabilityAlert[] {
  const newAlerts: DeliverabilityAlert[] = [];

  DEFAULT_THRESHOLDS.forEach(threshold => {
    const currentValue = getRateValue(rates, threshold.metric);
    let severity: AlertSeverity | null = null;

    if (threshold.metric === 'delivery' || threshold.metric === 'open') {
      // For these metrics, lower is worse
      if (currentValue < threshold.critical) severity = 'critical';
      else if (currentValue < threshold.warning) severity = 'warning';
    } else {
      // For bounce/complaint, higher is worse
      if (currentValue > threshold.critical) severity = 'critical';
      else if (currentValue > threshold.warning) severity = 'warning';
    }

    if (severity && !hasActiveAlert(threshold.metric)) {
      const alert: DeliverabilityAlert = {
        id: crypto.randomUUID(),
        severity,
        metric: threshold.metric,
        message: generateAlertMessage(threshold.metric, currentValue, severity),
        currentValue,
        threshold: threshold.metric === 'delivery' || threshold.metric === 'open' 
          ? threshold.warning 
          : threshold.warning,
        timestamp: new Date().toISOString(),
        acknowledged: false
      };

      activeAlerts.push(alert);
      newAlerts.push(alert);

      console.log(`[Deliverability] ALERT: ${severity} - ${alert.message}`);
    }
  });

  return newAlerts;
}

function getRateValue(rates: RateMetrics, metric: MetricType): number {
  switch (metric) {
    case 'bounce': return rates.bounceRate;
    case 'complaint': return rates.complaintRate;
    case 'open': return rates.openRate;
    case 'click': return rates.clickRate;
    case 'delivery': return rates.deliveryRate;
    default: return 0;
  }
}

function hasActiveAlert(metric: MetricType): boolean {
  return activeAlerts.some(a => a.metric === metric && !a.acknowledged);
}

function generateAlertMessage(metric: MetricType, value: number, severity: AlertSeverity): string {
  const messages: Record<MetricType, string> = {
    bounce: `Bounce rate is ${value.toFixed(2)}% - ${severity === 'critical' ? 'CRITICAL' : 'Warning'} threshold exceeded`,
    complaint: `Spam complaint rate is ${value.toFixed(2)}% - ${severity === 'critical' ? 'CRITICAL' : 'Warning'} threshold exceeded`,
    open: `Open rate is ${value.toFixed(2)}% - below ${severity} threshold`,
    click: `Click rate is ${value.toFixed(2)}% - below ${severity} threshold`,
    delivery: `Delivery rate is ${value.toFixed(2)}% - below ${severity} threshold`,
    deferral: `High deferral rate detected`
  };
  return messages[metric];
}

function checkImmediateAlert(
  event: string,
  provider: string,
  metadata?: any
): void {
  // Immediate alerts for critical events
  if (event === 'bounced' && metadata?.bounceType === 'hard') {
    // Check if we need to alert about high hard bounce rate
    const recentHardBounces = eventStore.filter(e => 
      e.type === 'bounced' && 
      e.bounceType === 'hard' &&
      e.timestamp > Date.now() - 60000
    ).length;

    if (recentHardBounces > 10 && !hasActiveAlert('bounce')) {
      const alert: DeliverabilityAlert = {
        id: crypto.randomUUID(),
        severity: 'critical',
        metric: 'bounce',
        message: `High hard bounce rate detected: ${recentHardBounces} in last minute`,
        currentValue: recentHardBounces,
        threshold: 10,
        timestamp: new Date().toISOString(),
        acknowledged: false
      };
      activeAlerts.push(alert);
    }
  }

  if (event === 'complained') {
    // Immediate alert for any spam complaint
    if (!hasActiveAlert('complaint')) {
      const alert: DeliverabilityAlert = {
        id: crypto.randomUUID(),
        severity: 'warning',
        metric: 'complaint',
        message: `Spam complaint received from ${provider}`,
        currentValue: 1,
        threshold: 0.1,
        timestamp: new Date().toISOString(),
        acknowledged: false
      };
      activeAlerts.push(alert);
    }
  }
}

async function calculateReputationScore(base44: any): Promise<ReputationScore> {
  // Get metrics from different time windows
  const lastHour = await calculateMetrics(base44, 60);
  const lastDay = await calculateMetrics(base44, 1440);
  const lastWeek = await calculateMetrics(base44, 10080);

  // Calculate component scores (0-100)
  const bounceScore = Math.max(0, 100 - (lastWeek.bounceRate * 10));
  const complaintScore = Math.max(0, 100 - (lastWeek.complaintRate * 200));
  const deliveryScore = lastWeek.deliveryRate;
  const engagementScore = (lastWeek.openRate + lastWeek.clickRate) / 2;

  // Weighted overall score
  const overall = Math.round(
    (bounceScore * 0.3) +
    (complaintScore * 0.3) +
    (deliveryScore * 0.25) +
    (engagementScore * 0.15)
  );

  // Provider scores
  const circuitStatus = getAllCircuitBreakerStatus();
  const providerScores: Record<string, number> = {};
  
  Object.entries(circuitStatus).forEach(([provider, status]) => {
    providerScores[provider] = status.health;
  });

  return {
    overall,
    providerScores,
    factors: [
      { name: 'Bounce Rate', impact: 30, score: Math.round(bounceScore) },
      { name: 'Complaint Rate', impact: 30, score: Math.round(complaintScore) },
      { name: 'Delivery Rate', impact: 25, score: Math.round(deliveryScore) },
      { name: 'Engagement', impact: 15, score: Math.round(engagementScore) }
    ],
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Get remediation suggestions based on current metrics
 */
export function getRemediationSuggestions(metrics: RateMetrics): string[] {
  const suggestions: string[] = [];

  if (metrics.bounceRate > 5) {
    suggestions.push('🔧 High bounce rate detected. Review email list hygiene and remove invalid addresses.');
    suggestions.push('📧 Implement double opt-in for new subscribers.');
  }

  if (metrics.complaintRate > 0.1) {
    suggestions.push('⚠️ Spam complaints detected. Review email content and sending frequency.');
    suggestions.push('📋 Ensure clear unsubscribe links are visible.');
  }

  if (metrics.openRate < 15) {
    suggestions.push('📬 Low open rate. A/B test subject lines and sender names.');
    suggestions.push('⏰ Review send times based on subscriber timezone.');
  }

  if (metrics.deliveryRate < 95) {
    suggestions.push('🚫 Delivery issues detected. Check SPF/DKIM/DMARC configuration.');
    suggestions.push('🔍 Review sender reputation with major ISPs.');
  }

  return suggestions;
}

/**
 * Generate health report
 */
export async function generateHealthReport(
  base44: any
): Promise<{
  timestamp: string;
  reputation: ReputationScore;
  metrics: any;
  alerts: DeliverabilityAlert[];
  suggestions: string[];
}> {
  const metrics = await getDeliverabilityMetrics(base44, 1440); // Last 24 hours
  const reputation = await getReputationScore(base44);
  const suggestions = getRemediationSuggestions(metrics);

  return {
    timestamp: new Date().toISOString(),
    reputation,
    metrics,
    alerts: getActiveAlerts(),
    suggestions
  };
}

export { DEFAULT_THRESHOLDS };
