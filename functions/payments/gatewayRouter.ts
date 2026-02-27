/**
 * Gateway Router - Routes payments to the appropriate gateway
 * Handles fallback logic, load balancing, and intelligent routing
 */

import { 
  PaymentGateway, 
  PaymentRequest, 
  PaymentResponse, 
  GatewayConfig, 
  RoutingRule,
  TransactionType,
  GatewayHealth 
} from './types';
import { FunctionError } from '../utils/errorHandler';

// Default gateway configurations
// PRIORITY ORDER: GeeniusPay → NMI → Payra → CryptoProcessing → Others
const DEFAULT_GATEWAYS: GatewayConfig[] = [
  // PRIMARY: GeeniusPay (Card processing priority #1)
  {
    id: 'geeniuspay',
    name: 'GeeniusPay',
    enabled: true, // ENABLED for demo
    testMode: true, // DEMO MODE - no real charges
    supportedCountries: ['US', 'CA', 'GB', 'EU'],
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    supportedMethods: ['card', 'crypto'],
    processingFee: { percentage: 2.5, fixed: 0.25 },
    healthStatus: 'healthy'
  },
  // SECONDARY: NMI (Card processing priority #2)
  {
    id: 'nmi',
    name: 'NMI',
    enabled: true, // ENABLED for demo
    testMode: true, // DEMO MODE - no real charges
    supportedCountries: ['US', 'CA', 'GB', 'AU'],
    supportedCurrencies: ['USD', 'CAD', 'GBP', 'AUD'],
    supportedMethods: ['card', 'bank_transfer'],
    processingFee: { percentage: 2.2, fixed: 0.20 },
    healthStatus: 'healthy'
  },
  // TERTIARY: Payra (Card processing priority #3)
  {
    id: 'payra',
    name: 'Payra',
    enabled: true, // ENABLED for demo
    testMode: true, // DEMO MODE - no real charges
    supportedCountries: ['US', 'CA', 'GB', 'AU', 'EU'],
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    supportedMethods: ['card', 'bank_transfer'],
    processingFee: { percentage: 2.4, fixed: 0.25 },
    healthStatus: 'healthy'
  },
  // CRYPTO: CryptoProcessing (All crypto payments)
  {
    id: 'cryptoprocessing',
    name: 'CryptoProcessing',
    enabled: true, // ENABLED for demo
    testMode: true, // DEMO MODE - no real transactions
    supportedCountries: ['GLOBAL'],
    supportedCurrencies: ['USD', 'EUR', 'BTC', 'ETH', 'USDT', 'USDC', 'LTC', 'BCH'],
    supportedMethods: ['crypto'],
    processingFee: { percentage: 1.0, fixed: 0 },
    healthStatus: 'healthy'
  },
  // FALLBACK: Stripe (If others fail)
  {
    id: 'stripe',
    name: 'Stripe',
    enabled: false, // DISABLED - needs KYC
    testMode: true,
    supportedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'IE', 'LU'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF'],
    supportedMethods: ['card', 'apple_pay', 'google_pay', 'sepa', 'ideal', 'giropay'],
    processingFee: { percentage: 2.9, fixed: 0.30 },
    healthStatus: 'unknown'
  },
  // OTHERS: Available for later activation
  {
    id: 'whop',
    name: 'Whop',
    enabled: false,
    testMode: true,
    supportedCountries: ['US', 'CA', 'GB', 'AU'],
    supportedCurrencies: ['USD'],
    supportedMethods: ['card', 'crypto'],
    processingFee: { percentage: 3.0, fixed: 0 },
    healthStatus: 'unknown'
  },
  {
    id: 'authorize',
    name: 'Authorize.net',
    enabled: false,
    testMode: true,
    supportedCountries: ['US', 'CA', 'GB', 'AU'],
    supportedCurrencies: ['USD', 'CAD'],
    supportedMethods: ['card', 'bank_transfer', 'paypal'],
    processingFee: { percentage: 2.9, fixed: 0.30 },
    healthStatus: 'unknown'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    enabled: false,
    testMode: true,
    supportedCountries: ['GLOBAL'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    supportedMethods: ['paypal', 'card'],
    processingFee: { percentage: 3.49, fixed: 0.49 },
    healthStatus: 'unknown'
  }
];

// Default routing rules
// PRIORITY: GeeniusPay → NMI → Payra → CryptoProcessing
const DEFAULT_ROUTING_RULES: RoutingRule[] = [
  {
    id: 'crypto_preference',
    name: 'Crypto Payment → CryptoProcessing',
    priority: 100,
    conditions: [
      { type: 'payment_method', operator: 'equals', value: 'crypto' }
    ],
    targetGateway: 'cryptoprocessing',
    fallbackGateway: 'geeniuspay', // Fallback to GeeniusPay (supports crypto)
    enabled: true
  },
  {
    id: 'card_priority_geeniuspay',
    name: 'Card Payment → GeeniusPay (Priority #1)',
    priority: 95,
    conditions: [
      { type: 'payment_method', operator: 'equals', value: 'card' }
    ],
    targetGateway: 'geeniuspay',
    fallbackGateway: 'nmi',
    enabled: true
  },
  {
    id: 'card_fallback_nmi',
    name: 'Card Payment → NMI (Priority #2)',
    priority: 94,
    conditions: [
      { type: 'payment_method', operator: 'equals', value: 'card' }
    ],
    targetGateway: 'nmi',
    fallbackGateway: 'payra',
    enabled: true
  },
  {
    id: 'card_fallback_payra',
    name: 'Card Payment → Payra (Priority #3)',
    priority: 93,
    conditions: [
      { type: 'payment_method', operator: 'equals', value: 'card' }
    ],
    targetGateway: 'payra',
    fallbackGateway: 'stripe',
    enabled: true
  },
  {
    id: 'paypal_preference',
    name: 'PayPal Payment Preference',
    priority: 50,
    conditions: [
      { type: 'payment_method', operator: 'equals', value: 'paypal' }
    ],
    targetGateway: 'paypal',
    fallbackGateway: 'geeniuspay',
    enabled: false // Disabled until PayPal configured
  },
  {
    id: 'eu_geeniuspay',
    name: 'EU Customers → GeeniusPay',
    priority: 80,
    conditions: [
      { type: 'country', operator: 'in', value: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH'] }
    ],
    targetGateway: 'geeniuspay',
    fallbackGateway: 'payra',
    enabled: true
  },
  {
    id: 'uk_payra',
    name: 'UK Customers → Payra',
    priority: 70,
    conditions: [
      { type: 'country', operator: 'equals', value: 'GB' }
    ],
    targetGateway: 'payra',
    fallbackGateway: 'stripe',
    enabled: true
  },
  {
    id: 'subscription_stripe',
    name: 'Subscriptions → Stripe',
    priority: 60,
    conditions: [
      { type: 'transaction_type', operator: 'equals', value: 'subscription' }
    ],
    targetGateway: 'stripe',
    fallbackGateway: 'paypal',
    enabled: true
  },
  {
    id: 'default_stripe',
    name: 'Default → Stripe',
    priority: 0,
    conditions: [],
    targetGateway: 'stripe',
    fallbackGateway: 'paypal',
    enabled: true
  }
];

export class GatewayRouter {
  private gateways: Map<PaymentGateway, GatewayConfig>;
  private routingRules: RoutingRule[];
  private healthStatus: Map<PaymentGateway, GatewayHealth>;
  private defaultGateway: PaymentGateway = 'stripe';

  constructor() {
    this.gateways = new Map();
    this.healthStatus = new Map();
    
    // Initialize with defaults
    DEFAULT_GATEWAYS.forEach(g => this.gateways.set(g.id, g));
    this.routingRules = [...DEFAULT_ROUTING_RULES];
  }

  /**
   * Update gateway configuration
   */
  updateGateway(config: GatewayConfig): void {
    this.gateways.set(config.id, { ...this.gateways.get(config.id), ...config });
  }

  /**
   * Get gateway configuration
   */
  getGateway(gateway: PaymentGateway): GatewayConfig | undefined {
    return this.gateways.get(gateway);
  }

  /**
   * Get all enabled gateways
   */
  getEnabledGateways(): GatewayConfig[] {
    return Array.from(this.gateways.values()).filter(g => g.enabled);
  }

  /**
   * Set default gateway
   */
  setDefaultGateway(gateway: PaymentGateway): void {
    if (!this.gateways.has(gateway)) {
      throw new FunctionError(`Unknown gateway: ${gateway}`, 400, 'BAD_REQUEST');
    }
    this.defaultGateway = gateway;
  }

  /**
   * Get default gateway
   */
  getDefaultGateway(): PaymentGateway {
    return this.defaultGateway;
  }

  /**
   * Update routing rules
   */
  updateRoutingRules(rules: RoutingRule[]): void {
    this.routingRules = rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get routing rules
   */
  getRoutingRules(): RoutingRule[] {
    return this.routingRules;
  }

  /**
   * Update health status for a gateway
   */
  updateHealthStatus(health: GatewayHealth): void {
    this.healthStatus.set(health.gateway, health);
    const gateway = this.gateways.get(health.gateway);
    if (gateway) {
      gateway.healthStatus = health.status;
      gateway.lastHealthCheck = health.lastChecked;
    }
  }

  /**
   * Get health status for all gateways
   */
  getAllHealthStatus(): GatewayHealth[] {
    return Array.from(this.healthStatus.values());
  }

  /**
   * Check if gateway is available
   */
  isGatewayAvailable(gateway: PaymentGateway): boolean {
    const config = this.gateways.get(gateway);
    const health = this.healthStatus.get(gateway);
    
    if (!config || !config.enabled) return false;
    if (health && health.status === 'down') return false;
    
    return true;
  }

  /**
   * Route payment to appropriate gateway
   */
  routePayment(request: PaymentRequest): { gateway: PaymentGateway; fallback?: PaymentGateway } {
    // If gateway explicitly specified and available, use it
    if (request.gateway && this.isGatewayAvailable(request.gateway)) {
      return { gateway: request.gateway };
    }

    // Evaluate routing rules
    for (const rule of this.routingRules) {
      if (!rule.enabled) continue;
      
      if (this.matchesConditions(request, rule.conditions)) {
        if (this.isGatewayAvailable(rule.targetGateway)) {
          return { 
            gateway: rule.targetGateway,
            fallback: rule.fallbackGateway 
          };
        } else if (rule.fallbackGateway && this.isGatewayAvailable(rule.fallbackGateway)) {
          return { gateway: rule.fallbackGateway };
        }
      }
    }

    // Fallback to default
    if (this.isGatewayAvailable(this.defaultGateway)) {
      return { gateway: this.defaultGateway };
    }

    // Last resort - find any available gateway
    const available = this.getEnabledGateways().find(g => this.isGatewayAvailable(g.id));
    if (available) {
      return { gateway: available.id };
    }

    throw new FunctionError('No payment gateways available', 503, 'SERVICE_UNAVAILABLE');
  }

  /**
   * Check if request matches routing conditions
   */
  private matchesConditions(request: PaymentRequest, conditions: any[]): boolean {
    if (conditions.length === 0) return true;
    
    return conditions.every(condition => {
      const value = this.getConditionValue(request, condition.type);
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'not_equals':
          return value !== condition.value;
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(value);
        case 'not_in':
          return Array.isArray(condition.value) && !condition.value.includes(value);
        case 'greater_than':
          return typeof value === 'number' && value > condition.value;
        case 'less_than':
          return typeof value === 'number' && value < condition.value;
        case 'between':
          return typeof value === 'number' && 
                 Array.isArray(condition.value) && 
                 value >= condition.value[0] && 
                 value <= condition.value[1];
        default:
          return false;
      }
    });
  }

  /**
   * Get value from request for condition evaluation
   */
  private getConditionValue(request: PaymentRequest, type: string): any {
    switch (type) {
      case 'country':
        return request.customer?.country;
      case 'amount':
        return request.amount;
      case 'currency':
        return request.currency;
      case 'payment_method':
        // Infer from items or metadata
        return request.metadata?.payment_method;
      case 'customer_type':
        return request.metadata?.customer_type;
      case 'transaction_type':
        return request.transactionType;
      default:
        return undefined;
    }
  }

  /**
   * Validate gateway can handle the request
   */
  validateGatewaySupport(gateway: PaymentGateway, request: PaymentRequest): void {
    const config = this.gateways.get(gateway);
    if (!config) {
      throw new FunctionError(`Unknown gateway: ${gateway}`, 400, 'BAD_REQUEST');
    }

    if (!config.enabled) {
      throw new FunctionError(`Gateway ${gateway} is disabled`, 400, 'BAD_REQUEST');
    }

    // Check currency support
    if (!config.supportedCurrencies.includes(request.currency)) {
      throw new FunctionError(
        `Gateway ${gateway} does not support currency ${request.currency}`,
        400,
        'BAD_REQUEST'
      );
    }

    // Check country support
    if (request.customer?.country && 
        !config.supportedCountries.includes('GLOBAL') &&
        !config.supportedCountries.includes(request.customer.country)) {
      throw new FunctionError(
        `Gateway ${gateway} does not support country ${request.customer.country}`,
        400,
        'BAD_REQUEST'
      );
    }

    // Check amount limits
    if (config.minAmount && request.amount < config.minAmount) {
      throw new FunctionError(
        `Amount ${request.amount} is below minimum ${config.minAmount} for ${gateway}`,
        400,
        'BAD_REQUEST'
      );
    }

    if (config.maxAmount && request.amount > config.maxAmount) {
      throw new FunctionError(
        `Amount ${request.amount} exceeds maximum ${config.maxAmount} for ${gateway}`,
        400,
        'BAD_REQUEST'
      );
    }
  }

  /**
   * Calculate processing fee for gateway
   */
  calculateFee(gateway: PaymentGateway, amount: number): number {
    const config = this.gateways.get(gateway);
    if (!config) return 0;
    
    return (amount * config.processingFee.percentage / 100) + config.processingFee.fixed;
  }

  /**
   * Get gateway instance for processing
   */
  getGatewayInstance(gateway: PaymentGateway) {
    // This will be used by unified checkout to get the actual gateway implementation
    return {
      id: gateway,
      config: this.gateways.get(gateway)
    };
  }
}

// Singleton instance
export const gatewayRouter = new GatewayRouter();
