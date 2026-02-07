import { createClient, createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Alert channels
export enum AlertChannel {
  EMAIL = 'email',
  SMS = 'sms',
  SLACK = 'slack',
  DISCORD = 'discord',
  WEBHOOK = 'webhook',
}

// Alert severity
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// Alert status
export enum AlertStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
}

// Alert interface
interface Alert {
  id?: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  details?: Record<string, unknown>;
  channels: AlertChannel[];
  recipients: string[];
  status: AlertStatus;
  sentAt?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  errorCount?: number;
  metadata?: Record<string, unknown>;
}

// Alert configuration
interface AlertConfig {
  // Thresholds
  errorRateThreshold: number; // Percentage (0-100)
  errorRateWindowMinutes: number;
  apiDownThreshold: number; // Number of failed health checks
  responseTimeThreshold: number; // Milliseconds
  
  // Cooldown periods
  alertCooldownMinutes: number;
  
  // Default recipients
  defaultEmailRecipients: string[];
  defaultSmsRecipients: string[];
  
  // External services
  slackWebhookUrl?: string;
  discordWebhookUrl?: string;
  twilioPhoneNumber?: string;
}

// Default configuration
const DEFAULT_CONFIG: AlertConfig = {
  errorRateThreshold: 5, // 5% error rate
  errorRateWindowMinutes: 5,
  apiDownThreshold: 3,
  responseTimeThreshold: 5000, // 5 seconds
  alertCooldownMinutes: 15,
  defaultEmailRecipients: [],
  defaultSmsRecipients: [],
};

// Alert history for deduplication
const recentAlerts = new Map<string, number>();

// Clean up old alert history
setInterval(() => {
  const cutoff = Date.now() - (DEFAULT_CONFIG.alertCooldownMinutes * 60 * 1000);
  for (const [key, timestamp] of recentAlerts.entries()) {
    if (timestamp < cutoff) {
      recentAlerts.delete(key);
    }
  }
}, 60000);

// Check if alert should be sent (rate limiting)
function shouldSendAlert(alertKey: string, cooldownMinutes: number): boolean {
  const lastSent = recentAlerts.get(alertKey);
  if (!lastSent) return true;
  
  const cooldownMs = cooldownMinutes * 60 * 1000;
  return Date.now() - lastSent > cooldownMs;
}

// Mark alert as sent
function markAlertSent(alertKey: string): void {
  recentAlerts.set(alertKey, Date.now());
}

// Send email alert
async function sendEmailAlert(
  alert: Alert,
  recipients: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // This would integrate with your email service (Resend, SendGrid, etc.)
    // For now, we'll use a simple webhook approach
    
    const response = await fetch(`${Deno.env.get('APP_URL')}/.netlify/functions/broadcastEmail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: recipients,
        subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
            <h2 style="color: ${getSeverityColor(alert.severity)};">${alert.title}</h2>
            <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
            <p><strong>Type:</strong> ${alert.type}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            <hr style="margin: 20px 0;" />
            <p>${alert.message}</p>
            ${alert.details ? `
              <h3>Details:</h3>
              <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;">
                ${JSON.stringify(alert.details, null, 2)}
              </pre>
            ` : ''}
          </div>
        `,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Email API responded with ${response.status}`);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Send SMS alert
async function sendSmsAlert(
  alert: Alert,
  recipients: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // This would integrate with Twilio or similar SMS service
    // For now, we'll return success (implement based on your SMS provider)
    
    const message = `[${alert.severity.toUpperCase()}] ${alert.title}: ${alert.message.slice(0, 100)}...`;
    
    // Example Twilio integration:
    // const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    // const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    // const fromNumber = DEFAULT_CONFIG.twilioPhoneNumber;
    
    // for (const to of recipients) {
    //   await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
    //       'Content-Type': 'application/x-www-form-urlencoded',
    //     },
    //     body: new URLSearchParams({
    //       To: to,
    //       From: fromNumber!,
    //       Body: message,
    //     }),
    //   });
    // }
    
    console.log('[SMS ALERT]', { recipients, message });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Send Slack alert
async function sendSlackAlert(alert: Alert): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = DEFAULT_CONFIG.slackWebhookUrl || Deno.env.get('SLACK_WEBHOOK_URL');
  if (!webhookUrl) {
    return { success: false, error: 'Slack webhook URL not configured' };
  }
  
  try {
    const color = getSeverityColor(alert.severity);
    
    const payload = {
      attachments: [{
        color: color.replace('#', ''),
        title: alert.title,
        text: alert.message,
        fields: [
          { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
          { title: 'Type', value: alert.type, short: true },
          { title: 'Time', value: new Date().toISOString(), short: true },
          ...(alert.details ? [{
            title: 'Details',
            value: '```' + JSON.stringify(alert.details, null, 2) + '```',
            short: false,
          }] : []),
        ],
        footer: 'LocalRank Monitoring',
        ts: Math.floor(Date.now() / 1000),
      }],
    };
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Slack API responded with ${response.status}`);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Send Discord alert
async function sendDiscordAlert(alert: Alert): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = DEFAULT_CONFIG.discordWebhookUrl || Deno.env.get('DISCORD_WEBHOOK_URL');
  if (!webhookUrl) {
    return { success: false, error: 'Discord webhook URL not configured' };
  }
  
  try {
    const color = parseInt(getSeverityColor(alert.severity).replace('#', ''), 16);
    
    const payload = {
      embeds: [{
        title: alert.title,
        description: alert.message,
        color: color,
        fields: [
          { name: 'Severity', value: alert.severity.toUpperCase(), inline: true },
          { name: 'Type', value: alert.type, inline: true },
          { name: 'Time', value: new Date().toISOString(), inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'LocalRank Monitoring' },
      }],
    };
    
    if (alert.details) {
      payload.embeds[0].fields.push({
        name: 'Details',
        value: '```json\n' + JSON.stringify(alert.details, null, 2).slice(0, 1000) + '\n```',
        inline: false,
      });
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Discord API responded with ${response.status}`);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Send webhook alert
async function sendWebhookAlert(alert: Alert): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = Deno.env.get('ALERT_WEBHOOK_URL');
  if (!webhookUrl) {
    return { success: true }; // Not configured, skip
  }
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alert,
        timestamp: new Date().toISOString(),
        source: 'localrank-monitoring',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Webhook responded with ${response.status}`);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Get color based on severity
function getSeverityColor(severity: AlertSeverity): string {
  switch (severity) {
    case AlertSeverity.CRITICAL:
      return '#dc2626'; // Red
    case AlertSeverity.ERROR:
      return '#ea580c'; // Orange
    case AlertSeverity.WARNING:
      return '#ca8a04'; // Yellow
    case AlertSeverity.INFO:
    default:
      return '#2563eb'; // Blue
  }
}

// Main send alert function
export async function sendAlert(
  alert: Omit<Alert, 'id' | 'status' | 'sentAt'>,
  req?: Request
): Promise<{ success: boolean; alertId?: string; errors?: string[] }> {
  const errors: string[] = [];
  
  try {
    // Check cooldown
    const alertKey = `${alert.type}:${alert.severity}`;
    if (!shouldSendAlert(alertKey, DEFAULT_CONFIG.alertCooldownMinutes)) {
      return { success: true }; // Alert on cooldown
    }
    
    // Create alert record
    const fullAlert: Alert = {
      ...alert,
      status: AlertStatus.PENDING,
    };
    
    // Store in database if request available
    let alertId: string | undefined;
    if (req) {
      try {
        const base44 = createClientFromRequest(req);
        const result = await base44.asServiceRole.entities.Alert.create({
          type: fullAlert.type,
          severity: fullAlert.severity,
          title: fullAlert.title,
          message: fullAlert.message,
          details: fullAlert.details,
          channels: fullAlert.channels,
          recipients: fullAlert.recipients,
          status: fullAlert.status,
          metadata: fullAlert.metadata,
        });
        alertId = result._id;
      } catch (dbError) {
        console.error('Failed to store alert:', dbError);
      }
    }
    
    // Send to each channel
    for (const channel of alert.channels) {
      let result: { success: boolean; error?: string };
      
      switch (channel) {
        case AlertChannel.EMAIL:
          result = await sendEmailAlert(fullAlert, alert.recipients);
          break;
        case AlertChannel.SMS:
          result = await sendSmsAlert(fullAlert, alert.recipients);
          break;
        case AlertChannel.SLACK:
          result = await sendSlackAlert(fullAlert);
          break;
        case AlertChannel.DISCORD:
          result = await sendDiscordAlert(fullAlert);
          break;
        case AlertChannel.WEBHOOK:
          result = await sendWebhookAlert(fullAlert);
          break;
        default:
          result = { success: false, error: `Unknown channel: ${channel}` };
      }
      
      if (!result.success) {
        errors.push(`${channel}: ${result.error}`);
      }
    }
    
    // Update alert status
    const finalStatus = errors.length === alert.channels.length 
      ? AlertStatus.FAILED 
      : AlertStatus.SENT;
    
    if (alertId && req) {
      try {
        const base44 = createClientFromRequest(req);
        await base44.asServiceRole.entities.Alert.update(alertId, {
          status: finalStatus,
          sent_at: new Date().toISOString(),
          error_count: errors.length,
        });
      } catch (dbError) {
        console.error('Failed to update alert status:', dbError);
      }
    }
    
    // Mark as sent for cooldown
    if (finalStatus === AlertStatus.SENT) {
      markAlertSent(alertKey);
    }
    
    return {
      success: finalStatus === AlertStatus.SENT,
      alertId,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    return {
      success: false,
      errors: [(error as Error).message],
    };
  }
}

// Check and alert on error rate
export async function checkErrorRate(
  req: Request,
  errorCount: number,
  totalRequests: number
): Promise<void> {
  const errorRate = (errorCount / totalRequests) * 100;
  
  if (errorRate >= DEFAULT_CONFIG.errorRateThreshold) {
    await sendAlert({
      type: 'error_rate_threshold',
      severity: errorRate >= 10 ? AlertSeverity.CRITICAL : AlertSeverity.ERROR,
      title: 'High Error Rate Detected',
      message: `Error rate is ${errorRate.toFixed(2)}% (${errorCount} errors out of ${totalRequests} requests)`,
      details: {
        errorRate,
        errorCount,
        totalRequests,
        threshold: DEFAULT_CONFIG.errorRateThreshold,
        windowMinutes: DEFAULT_CONFIG.errorRateWindowMinutes,
      },
      channels: [AlertChannel.EMAIL, AlertChannel.SLACK],
      recipients: DEFAULT_CONFIG.defaultEmailRecipients,
    }, req);
  }
}

// Check and alert on API health
export async function checkApiHealth(
  req: Request,
  healthStatus: { healthy: boolean; failedChecks: string[] }
): Promise<void> {
  if (!healthStatus.healthy) {
    await sendAlert({
      type: 'api_health_check_failed',
      severity: AlertSeverity.CRITICAL,
      title: 'API Health Check Failed',
      message: `API health check failed. Failed components: ${healthStatus.failedChecks.join(', ')}`,
      details: {
        failedChecks: healthStatus.failedChecks,
        timestamp: new Date().toISOString(),
      },
      channels: [AlertChannel.EMAIL, AlertChannel.SMS, AlertChannel.SLACK],
      recipients: [...DEFAULT_CONFIG.defaultEmailRecipients, ...DEFAULT_CONFIG.defaultSmsRecipients],
    }, req);
  }
}

// Acknowledge alert
export async function acknowledgeAlert(
  req: Request,
  alertId: string,
  acknowledgedBy: string
): Promise<{ success: boolean }> {
  try {
    const base44 = createClientFromRequest(req);
    await base44.asServiceRole.entities.Alert.update(alertId, {
      status: AlertStatus.ACKNOWLEDGED,
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: acknowledgedBy,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to acknowledge alert:', error);
    return { success: false };
  }
}

// Resolve alert
export async function resolveAlert(
  req: Request,
  alertId: string
): Promise<{ success: boolean }> {
  try {
    const base44 = createClientFromRequest(req);
    await base44.asServiceRole.entities.Alert.update(alertId, {
      status: AlertStatus.RESOLVED,
      resolved_at: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to resolve alert:', error);
    return { success: false };
  }
}

// Get alert history
export async function getAlertHistory(
  req: Request,
  options: {
    status?: AlertStatus;
    severity?: AlertSeverity;
    type?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ alerts: Alert[]; total: number }> {
  try {
    const base44 = createClientFromRequest(req);
    
    const filter: Record<string, unknown> = {};
    if (options.status) filter.status = options.status;
    if (options.severity) filter.severity = options.severity;
    if (options.type) filter.type = options.type;
    
    const alerts = await base44.asServiceRole.entities.Alert.filter(filter, {
      sort: { field: 'created_at', direction: 'desc' },
      limit: options.limit || 100,
      offset: options.offset || 0,
    });
    
    // Get total count
    const allAlerts = await base44.asServiceRole.entities.Alert.filter(filter);
    
    return {
      alerts: alerts.map(a => ({
        id: a._id,
        type: a.type,
        severity: a.severity,
        title: a.title,
        message: a.message,
        details: a.details,
        channels: a.channels,
        recipients: a.recipients,
        status: a.status,
        sentAt: a.sent_at,
        acknowledgedAt: a.acknowledged_at,
        acknowledgedBy: a.acknowledged_by,
        resolvedAt: a.resolved_at,
        errorCount: a.error_count,
        metadata: a.metadata,
      })),
      total: allAlerts.length,
    };
  } catch (error) {
    console.error('Failed to get alert history:', error);
    throw error;
  }
}

// Main handler for Netlify function
Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const result = await sendAlert(body, req);
    return Response.json(result);
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
});