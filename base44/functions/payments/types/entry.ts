/**
 * Payment Gateway Types and Interfaces
 * Standardized types for all payment gateways
 */

export type PaymentGateway = 
  | 'stripe' 
  | 'whop' 
  | 'geeniuspay' 
  | 'nmi' 
  | 'payra' 
  | 'authorize' 
  | 'crypto' 
  | 'paypal';

export type TransactionType = 'one_time' | 'subscription' | 'payment_plan' | 'split';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'past_due' | 'trialing';

export interface PaymentRequest {
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  transactionType: TransactionType;
  customer: CustomerInfo;
  items: PaymentItem[];
  metadata?: Record<string, string>;
  successUrl?: string;
  cancelUrl?: string;
  splitConfig?: SplitPaymentConfig;
  subscriptionConfig?: SubscriptionConfig;
  paymentMethodId?: string;
  savePaymentMethod?: boolean;
}

export interface CustomerInfo {
  email: string;
  name?: string;
  phone?: string;
  address?: Address;
  customerId?: string;
  country?: string;
  ip?: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PaymentItem {
  name: string;
  description?: string;
  amount: number;
  quantity: number;
  sku?: string;
  category?: string;
}

export interface SplitPaymentConfig {
  parts: SplitPart[];
}

export interface SplitPart {
  gateway: PaymentGateway;
  percentage: number;
  amount: number;
}

export interface SubscriptionConfig {
  planId: string;
  interval: 'day' | 'week' | 'month' | 'year';
  intervalCount: number;
  trialDays?: number;
  setupFee?: number;
  billingCycles?: number;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  sessionId?: string;
  checkoutUrl?: string;
  status: PaymentStatus;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  error?: PaymentError;
  metadata?: Record<string, any>;
}

export interface PaymentError {
  code: string;
  message: string;
  gatewayErrorCode?: string;
  retryable: boolean;
}

export interface RefundRequest {
  transactionId: string;
  amount?: number;
  reason?: string;
  metadata?: Record<string, string>;
}

export interface RefundResponse {
  success: boolean;
  refundId?: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  error?: PaymentError;
}

export interface SubscriptionResponse {
  success: boolean;
  subscriptionId?: string;
  status: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  error?: PaymentError;
}

export interface GatewayConfig {
  id: PaymentGateway;
  name: string;
  enabled: boolean;
  testMode: boolean;
  apiKey?: string;
  apiSecret?: string;
  webhookSecret?: string;
  supportedCountries: string[];
  supportedCurrencies: string[];
  supportedMethods: PaymentMethod[];
  minAmount?: number;
  maxAmount?: number;
  processingFee: {
    percentage: number;
    fixed: number;
  };
  healthStatus: 'healthy' | 'degraded' | 'down' | 'unknown';
  lastHealthCheck?: Date;
}

export type PaymentMethod = 
  | 'card' 
  | 'bank_transfer' 
  | 'crypto' 
  | 'paypal' 
  | 'apple_pay' 
  | 'google_pay' 
  | 'sepa' 
  | 'ideal' 
  | 'giropay';

export interface RoutingRule {
  id: string;
  name: string;
  priority: number;
  conditions: RoutingCondition[];
  targetGateway: PaymentGateway;
  fallbackGateway?: PaymentGateway;
  enabled: boolean;
}

export interface RoutingCondition {
  type: 'country' | 'amount' | 'currency' | 'payment_method' | 'customer_type' | 'transaction_type';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'between';
  value: any;
}

export interface WebhookEvent {
  id: string;
  gateway: PaymentGateway;
  type: string;
  timestamp: Date;
  data: any;
  signature?: string;
  processed: boolean;
  processingError?: string;
}

export interface GatewayHealth {
  gateway: PaymentGateway;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  latency: number;
  lastChecked: Date;
  errorRate: number;
  message?: string;
}
