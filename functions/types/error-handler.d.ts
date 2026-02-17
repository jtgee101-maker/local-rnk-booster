/**
 * Error Handler Types
 */

export interface ErrorHandlerOptions {
  context?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface FunctionError extends Error {
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

export interface ErrorLogEntry {
  id?: string;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  context: string;
  user_id?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export function withDenoErrorHandler(
  handler: (req: Request) => Promise<Response> | Response
): (req: Request) => Promise<Response>;

export function validateRequired(
  data: Record<string, unknown>,
  fields: string[]
): void;

export function createError(
  message: string,
  code: string,
  statusCode: number,
  details?: Record<string, unknown>
): FunctionError;
