/**
 * API Type Definitions
 * 200X Type Safety Standards
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

export interface Lead {
  id: string;
  email: string;
  business_name?: string;
  health_score: number;
  status: string;
  created_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  status: string;
  plan_id: string;
  created_at: string;
}

export interface EmailCampaign {
  id: string;
  name: string;
  type: string;
  status: string;
  total_recipients: number;
  sent_count: number;
}

export type UserRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
export type PlanType = 'starter' | 'growth' | 'pro' | 'enterprise';
