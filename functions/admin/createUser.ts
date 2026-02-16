/**
 * Create a new user
 */

import { withErrorHandler, FunctionError, successResponse } from './utils/errorHandler';

// Type declarations for base44 global
declare const base44: {
  db: {
    collections: {
      users?: {
        findOne?: (query: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
        insertOne?: (data: Record<string, unknown>) => Promise<{ insertedId?: string; acknowledged?: boolean }>;
      };
      adminLogs?: {
        insertOne?: (data: Record<string, unknown>) => Promise<unknown>;
      };
    };
  };
  emails: {
    send: (data: { to: string; template: string; data: Record<string, unknown> }) => Promise<unknown>;
  };
};

// Type for request user
interface RequestUser {
  id?: string;
  _id?: string;
  role: string;
  name?: string;
}

// Type for request
interface CreateUserRequest {
  user?: RequestUser;
  data?: {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    status?: string;
    company?: string;
    sendWelcomeEmail?: boolean;
  };
}

// Type for new user
interface NewUser {
  name: string;
  email: string;
  role: string;
  status: string;
  company: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | undefined;
  emailVerified: boolean;
  passwordHash?: string;
  tempPassword?: boolean;
}

async function createUserHandler(request: CreateUserRequest) {
  try {
    // Verify admin access
    const currentUser = request.user;
    if (!currentUser || !['admin', 'super-admin'].includes(currentUser.role)) {
      return {
        success: false,
        error: 'Unauthorized: Admin access required'
      };
    }

    const { 
      name, 
      email, 
      password,
      role = 'user', 
      status = 'active',
      company = '',
      sendWelcomeEmail = true
    } = request.data || {};

    // Validation
    if (!email || !name) {
      return {
        success: false,
        error: 'Email and name are required'
      };
    }

    // Check if email already exists
    const existingUser = await base44.db.collections.users?.findOne?.({ email });
    if (existingUser) {
      return {
        success: false,
        error: 'User with this email already exists'
      };
    }

    // Validate role
    const validRoles = ['user', 'support', 'admin', 'super-admin'];
    if (!validRoles.includes(role)) {
      return {
        success: false,
        error: 'Invalid role specified'
      };
    }

    // Only super-admin can create other super-admins
    if (role === 'super-admin' && currentUser.role !== 'super-admin') {
      return {
        success: false,
        error: 'Only super admins can create super admin accounts'
      };
    }

    // Create user object
    const newUser: NewUser = {
      name,
      email: email.toLowerCase().trim(),
      role,
      status,
      company,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: currentUser.id || currentUser._id,
      emailVerified: false
    };

    // Handle password
    if (password) {
      // In real implementation, hash the password
      newUser.passwordHash = await hashPassword(password);
    } else {
      // Generate temporary password
      const tempPassword = generateTempPassword();
      newUser.passwordHash = await hashPassword(tempPassword);
      newUser.tempPassword = true;
    }

    // Insert user
    const result = await base44.db.collections.users?.insertOne?.(newUser);
    
    if (!result?.insertedId && !result?.acknowledged) {
      throw new Error('Failed to create user');
    }

    const userId = typeof result.insertedId === 'string' ? result.insertedId : String(result.insertedId);

    // Send welcome email if requested
    if (sendWelcomeEmail) {
      try {
        await base44.emails.send({
          to: email,
          template: 'welcome-new-user',
          data: {
            name,
            tempPassword: password || 'Check your email for setup instructions',
            loginUrl: `${process.env.APP_URL}/login`
          }
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Log admin action
    await logAdminAction({
      adminId: currentUser.id || currentUser._id,
      action: 'CREATE_USER',
      targetId: userId,
      targetType: 'user',
      details: { email, role }
    });

    return {
      success: true,
      data: {
        id: userId,
        name,
        email,
        role,
        status,
        message: 'User created successfully'
      }
    };

  } catch (error: unknown) {
    console.error('createUser error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user'
    };
  }
}

// Helper functions
async function hashPassword(password: string): Promise<string> {
  // In real implementation, use bcrypt or similar
  // This is a placeholder
  return `hashed_${password}`;
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

interface AdminActionParams {
  adminId?: string;
  action: string;
  targetId: string;
  targetType: string;
  details: Record<string, unknown>;
}

async function logAdminAction({ adminId, action, targetId, targetType, details }: AdminActionParams) {
  try {
    await base44.db.collections.adminLogs?.insertOne?.({
      adminId,
      action,
      targetId,
      targetType,
      details,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

export default withErrorHandler(createUserHandler);
