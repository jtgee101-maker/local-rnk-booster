/**
 * List users with pagination, filtering, and sorting support
 */
export default async function listUsers(request) {
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
    const query = {};
    
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
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const skip = (page - 1) * limit;
    
    const [users, totalCount] = await Promise.all([
      base44.db.collections.users
        ?.find?.(query)
        ?.sort?.(sort)
        ?.skip?.(skip)
        ?.limit?.(limit)
        ?.toArray?.() || [],
      base44.db.collections.users?.countDocuments?.(query) || 0
    ]);

    // Format user data (remove sensitive fields)
    const formattedUsers = users.map(user => ({
      id: user._id?.toString?.() || user.id,
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

  } catch (error) {
    console.error('listUsers error:', error);
    return {
      success: false,
      error: error.message || 'Failed to list users'
    };
  }
}
