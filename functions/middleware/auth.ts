import { createClient } from 'npm:@base44/sdk@0.8.6';
import { z } from 'npm:zod@3.24.2';

// JWT configuration
const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = 24 * 60 * 60 * 1000; // 24 hours
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 days

// Role definitions
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  ANALYST = 'analyst',
  MARKETER = 'marketer',
}

// Role hierarchy (higher index = more permissions)
const ROLE_HIERARCHY = [
  UserRole.USER,
  UserRole.ANALYST,
  UserRole.MARKETER,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
];

// Permission definitions
export enum Permission {
  READ_ANALYTICS = 'read:analytics',
  WRITE_CAMPAIGNS = 'write:campaigns',
  DELETE_CAMPAIGNS = 'delete:campaigns',
  MANAGE_USERS = 'manage:users',
  MANAGE_SETTINGS = 'manage:settings',
  VIEW_ADMIN_PANEL = 'view:admin_panel',
  MANAGE_BILLING = 'manage:billing',
  EXPORT_DATA = 'export:data',
  SEND_BROADCASTS = 'send:broadcasts',
  MANAGE_INTEGRATIONS = 'manage:integrations',
  VIEW_AUDIT_LOGS = 'view:audit_logs',
}

// Role to permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.READ_ANALYTICS,
  ],
  [UserRole.ANALYST]: [
    Permission.READ_ANALYTICS,
    Permission.EXPORT_DATA,
  ],
  [UserRole.MARKETER]: [
    Permission.READ_ANALYTICS,
    Permission.WRITE_CAMPAIGNS,
    Permission.EXPORT_DATA,
    Permission.SEND_BROADCASTS,
  ],
  [UserRole.ADMIN]: [
    Permission.READ_ANALYTICS,
    Permission.WRITE_CAMPAIGNS,
    Permission.DELETE_CAMPAIGNS,
    Permission.MANAGE_USERS,
    Permission.MANAGE_SETTINGS,
    Permission.VIEW_ADMIN_PANEL,
    Permission.MANAGE_BILLING,
    Permission.EXPORT_DATA,
    Permission.SEND_BROADCASTS,
    Permission.MANAGE_INTEGRATIONS,
  ],
  [UserRole.SUPER_ADMIN]: [
    Permission.READ_ANALYTICS,
    Permission.WRITE_CAMPAIGNS,
    Permission.DELETE_CAMPAIGNS,
    Permission.MANAGE_USERS,
    Permission.MANAGE_SETTINGS,
    Permission.VIEW_ADMIN_PANEL,
    Permission.MANAGE_BILLING,
    Permission.EXPORT_DATA,
    Permission.SEND_BROADCASTS,
    Permission.MANAGE_INTEGRATIONS,
    Permission.VIEW_AUDIT_LOGS,
  ],
};

// JWT Payload interface
interface JWTPayload {
  sub: string; // user ID
  email: string;
  role: UserRole;
  permissions: Permission[];
  iat: number;
  exp: number;
  jti: string; // JWT ID for token revocation
}

// Session store (in production, use Redis)
const activeSessions = new Map<string, { userId: string; expiresAt: number }>();
const revokedTokens = new Set<string>();

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [jti, session] of activeSessions.entries()) {
    if (session.expiresAt <= now) {
      activeSessions.delete(jti);
    }
  }
  // Also clear old revoked tokens (keep for 24 hours)
  if (revokedTokens.size > 10000) {
    revokedTokens.clear();
  }
}, 60000);

// Simple JWT functions (in production, use a proper JWT library)
function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  const padding = '='.repeat((4 - str.length % 4) % 4);
  return atob(str.replace(/-/g, '+').replace(/_/g, '/') + padding);
}

async function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp' | 'jti'>): Promise<{ token: string; jti: string }> {
  const jti = crypto.randomUUID();
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + Math.floor(JWT_EXPIRES_IN / 1000);
  
  const fullPayload: JWTPayload = {
    ...payload,
    iat,
    exp,
    jti,
  };
  
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  
  const data = `${encodedHeader}.${encodedPayload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const encodedSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
  
  const token = `${data}.${encodedSignature}`;
  
  // Store session
  activeSessions.set(jti, {
    userId: payload.sub,
    expiresAt: exp * 1000,
  });
  
  return { token, jti };
}

async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
    
    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      return null;
    }
    
    // Check if token is revoked
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload;
    if (revokedTokens.has(payload.jti)) {
      return null;
    }
    
    // Verify signature
    const data = `${encodedHeader}.${encodedPayload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signatureBytes = Uint8Array.from(
      base64UrlDecode(encodedSignature),
      c => c.charCodeAt(0)
    );
    
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(data));
    
    if (!isValid) {
      return null;
    }
    
    // Check expiration
    if (payload.exp * 1000 < Date.now()) {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

// Extract token from request
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Also check cookie
  const cookie = req.headers.get('cookie');
  if (cookie) {
    const match = cookie.match(/auth_token=([^;]+)/);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

// Authenticate request
export interface AuthContext {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  token: string;
}

export async function authenticate(req: Request): Promise<{ success: true; user: AuthContext } | { success: false; response: Response }> {
  const token = extractToken(req);
  
  if (!token) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }
  
  const payload = await verifyJWT(token);
  
  if (!payload) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'WWW-Authenticate': 'Bearer' } }
      ),
    };
  }
  
  return {
    success: true,
    user: {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
      token,
    },
  };
}

// Check if user has required permission
export function hasPermission(user: AuthContext, permission: Permission): boolean {
  return user.permissions.includes(permission);
}

// Check if user has required role (or higher in hierarchy)
export function hasRole(user: AuthContext, requiredRole: UserRole): boolean {
  const userRoleIndex = ROLE_HIERARCHY.indexOf(user.role);
  const requiredRoleIndex = ROLE_HIERARCHY.indexOf(requiredRole);
  return userRoleIndex >= requiredRoleIndex;
}

// Require permission middleware
export function requirePermission(permission: Permission) {
  return async (req: Request, user: AuthContext): Promise<Response | null> => {
    if (!hasPermission(user, permission)) {
      return new Response(
        JSON.stringify({ 
          error: 'Forbidden', 
          message: `Permission '${permission}' required` 
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return null;
  };
}

// Require role middleware
export function requireRole(role: UserRole) {
  return async (req: Request, user: AuthContext): Promise<Response | null> => {
    if (!hasRole(user, role)) {
      return new Response(
        JSON.stringify({ 
          error: 'Forbidden', 
          message: `Role '${role}' or higher required` 
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return null;
  };
}

// Generate tokens for user
export async function generateTokens(user: {
  _id: string;
  email: string;
  role: UserRole;
}): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  
  const { token: accessToken } = await signJWT({
    sub: user._id,
    email: user.email,
    role: user.role,
    permissions,
  });
  
  // Generate refresh token (simpler, just a UUID)
  const refreshToken = crypto.randomUUID();
  
  // Store refresh token (in production, use database)
  activeSessions.set(`refresh:${refreshToken}`, {
    userId: user._id,
    expiresAt: Date.now() + REFRESH_TOKEN_EXPIRES_IN,
  });
  
  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_EXPIRES_IN,
  };
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<{ success: true; tokens: { accessToken: string; refreshToken: string; expiresIn: number } } | { success: false; error: string }> {
  const sessionKey = `refresh:${refreshToken}`;
  const session = activeSessions.get(sessionKey);
  
  if (!session || session.expiresAt <= Date.now()) {
    return { success: false, error: 'Invalid or expired refresh token' };
  }
  
  // In production, fetch user from database
  // For now, we'll need the user data passed in
  return { success: false, error: 'User data required for refresh' };
}

// Revoke token (logout)
export function revokeToken(token: string): void {
  try {
    const [, encodedPayload] = token.split('.');
    if (encodedPayload) {
      const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload;
      revokedTokens.add(payload.jti);
      activeSessions.delete(payload.jti);
    }
  } catch {
    // Invalid token, ignore
  }
}

// Revoke all user sessions
export function revokeAllUserSessions(userId: string): void {
  for (const [jti, session] of activeSessions.entries()) {
    if (session.userId === userId) {
      revokedTokens.add(jti);
      activeSessions.delete(jti);
    }
  }
}

// Create authentication middleware
export function createAuthMiddleware(options: {
  requiredPermission?: Permission;
  requiredRole?: UserRole;
} = {}) {
  return async (req: Request): Promise<{ success: true; user: AuthContext } | { success: false; response: Response }> => {
    const authResult = await authenticate(req);
    
    if (!authResult.success) {
      return authResult;
    }
    
    const { user } = authResult;
    
    // Check permission if required
    if (options.requiredPermission && !hasPermission(user, options.requiredPermission)) {
      return {
        success: false,
        response: new Response(
          JSON.stringify({ 
            error: 'Forbidden', 
            message: `Permission '${options.requiredPermission}' required` 
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        ),
      };
    }
    
    // Check role if required
    if (options.requiredRole && !hasRole(user, options.requiredRole)) {
      return {
        success: false,
        response: new Response(
          JSON.stringify({ 
            error: 'Forbidden', 
            message: `Role '${options.requiredRole}' or higher required` 
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        ),
      };
    }
    
    return { success: true, user };
  };
}