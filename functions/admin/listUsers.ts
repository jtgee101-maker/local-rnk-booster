/**
 * List users with pagination, filtering, and sorting support
 */

import { withErrorHandler, FunctionError, successResponse } from './utils/errorHandler';

// Type declarations for base44 global
declare const base44: {
  db: {
    collections: {
      users?: {
        find?: (query: Record<string, unknown>) => {
          sort?: (sort: Record<string, number>) => {
            skip?: (n: number) => {
              limit?: (n: number) => {
                toArray?: () => Promise<Array<Record<string, unknown>>>;
              };
            };
          };
        };
        countDocuments?: (query: Record<string, unknown>) => Promise<number>;
      };
    };
  };
};

// Type for request user
interface RequestUser {
  id?: string;
  _id?: string;
  role: string;
}

// Type for request
interface ListUsersRequest {
  user?: RequestUser;
  data?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string | null;
    status?: string | null;
    sortBy?: string;
    sortOrder?: string;
  };
}

async function listUsersHandler(request: ListUsersRequest) {
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
      page = 1, 
      limit = 50, 
      search = '', 
      role = null, 
      status = null,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = request.data || {};

    // Build query
    const query: Record<string, unknown> = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (status) {
      query.status = status;
    }

    // Build sort
    const sort: Record<string, number> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const skip = (page - 1) * limit;
    
    const usersQuery = base44.db.collections.users?.find?.(query);
    const sortedQuery = usersQuery?.sort?.(sort);
    const skippedQuery = sortedQuery?.skip?.(skip);
    const limitedQuery = skippedQuery?.limit?.(limit);
    
    const [users, totalCount] = await Promise.all([
      limitedQuery?.toArray?.() || Promise.resolve([]),
      base44.db.collections.users?.countDocuments?.(query) || Promise.resolve(0)
    ]);

    // Format user data (remove sensitive fields)
    const formattedUsers = users.map((user: Record<string, unknown>) => ({
      id: (user._id as { toString?: () => string })?.toString?.() || user.id,
      name: user.name || user.displayName || 'Unknown',
      email: user.email,
      role: user.role || 'user',
      status: user.status || 'active',
      company: user.company || user.organization || '-',
      createdAt: user.createdAt || user.created_at,
      lastLogin: user.lastLoginAt || user.last_login,
      avatar: user.avatar || user.profileImage || null,
      tenantId: user.tenantId || user.tenant_id || null
    }));

    return {
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page * limit < totalCount,
          hasPrevPage: page > 1
        }
      }
    };

  } catch (error: unknown) {
    console.error('listUsers error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list users'
    };
  }
}

export default withErrorHandler(listUsersHandler);
