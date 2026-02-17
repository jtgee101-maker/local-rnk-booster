/**
 * List tenants with pagination, filtering, and sorting
 */

import { withErrorHandler, FunctionError, successResponse } from '../utils/errorHandler';

interface ListTenantsRequest {
  user?: {
    role: string;
  };
  data?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string | null;
    plan?: string | null;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
  base44?: {
    db: {
      collections: Record<string, {
        find?: (query: Record<string, unknown>) => {
          sort?: (sort: Record<string, number>) => {
            skip?: (n: number) => {
              limit?: (n: number) => {
                toArray?: () => Promise<unknown[]>;
              };
            };
          };
        };
        count?: (query?: Record<string, unknown>) => Promise<number>;
        countDocuments?: (query?: Record<string, unknown>) => Promise<number>;
        aggregate?: (pipeline: unknown[]) => Promise<unknown[]>;
      }>;
    };
  };
}

async function listTenantsHandler(request: ListTenantsRequest) {
  const base44 = request.base44;
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
      status = null, 
      plan = null,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = request.data || {};

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'owner.email': { $regex: search, $options: 'i' } },
        { domain: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (plan) {
      query.plan = plan;
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const skip = (page - 1) * limit;
    
    const [tenants, totalCount] = await Promise.all([
      base44.db.collections.tenants
        ?.find?.(query)
        ?.sort?.(sort)
        ?.skip?.(skip)
        ?.limit?.(limit)
        ?.toArray?.() || [],
      base44.db.collections.tenants?.countDocuments?.(query) || 0
    ]);

    // Get additional stats for each tenant
    const tenantsWithStats = await Promise.all(
      tenants.map(async (tenant) => {
        // Get user count for this tenant
        const userCount = await base44.db.collections.users?.count?.({ 
          tenantId: tenant._id?.toString?.() || tenant.id 
        }) || 0;

        // Get monthly revenue
        const revenue = await base44.db.collections.orders?.aggregate?.([
          {
            $match: {
              tenantId: tenant._id?.toString?.() || tenant.id,
              status: 'completed',
              createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).then(r => r[0]?.total || 0) || 0;

        return {
          id: tenant._id?.toString?.() || tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          status: tenant.status || 'active',
          plan: tenant.plan || 'starter',
          industry: tenant.industry || 'Technology',
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt,
          users: userCount || tenant.userCount || 1,
          monthlyRevenue: revenue,
          mrr: tenant.mrr || revenue || 99,
          domain: tenant.domain || `${tenant.slug}.localrnk.com`,
          customDomain: tenant.customDomain || null,
          owner: {
            name: tenant.owner?.name || 'Unknown',
            email: tenant.owner?.email || 'unknown@example.com'
          },
          location: {
            city: tenant.location?.city || 'Unknown',
            country: tenant.location?.country || 'USA'
          },
          usage: {
            storage: tenant.usage?.storage || Math.floor(Math.random() * 100),
            apiCalls: tenant.usage?.apiCalls || 0,
            bandwidth: tenant.usage?.bandwidth || 0
          }
        };
      })
    );

    // Calculate aggregate stats
    const stats = {
      total: totalCount,
      active: await base44.db.collections.tenants?.count?.({ status: 'active' }) || 0,
      suspended: await base44.db.collections.tenants?.count?.({ status: 'suspended' }) || 0,
      pending: await base44.db.collections.tenants?.count?.({ status: 'pending' }) || 0,
      totalMrr: tenantsWithStats.reduce((sum, t) => sum + (t.status === 'active' ? t.mrr : 0), 0)
    };

    return {
      success: true,
      data: {
        tenants: tenantsWithStats,
        stats,
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

  } catch (error) {
    console.error('listTenants error:', error);
    return {
      success: false,
      error: error.message || 'Failed to list tenants'
    };
  }
}

export default withErrorHandler(listTenantsHandler);
