/**
 * Update an existing user
 */
export default async function updateUser(request) {
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
      id,
      name, 
      email, 
      role, 
      status,
      company,
      password,
      emailVerified
    } = request.data || {};

    if (!id) {
      return {
        success: false,
        error: 'User ID is required'
      };
    }

    // Find existing user
    const existingUser = await base44.db.collections.users?.findOne?.({ 
      $or: [
        { _id: id },
        { id: id }
      ]
    });

    if (!existingUser) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Check permissions for role changes
    if (role && role !== existingUser.role) {
      // Only super-admin can change to/from super-admin
      if (role === 'super-admin' || existingUser.role === 'super-admin') {
        if (currentUser.role !== 'super-admin') {
          return {
            success: false,
            error: 'Only super admins can manage super admin roles'
          };
        }
      }

      // Admins can't promote users to admin
      if (role === 'admin' && currentUser.role === 'admin') {
        // This is allowed for regular admins
      }
    }

    // Check if trying to modify own account's role
    const currentUserId = currentUser.id || currentUser._id?.toString?.();
    const targetUserId = existingUser._id?.toString?.() || existingUser.id;
    
    if (currentUserId === targetUserId && role && role !== currentUser.role) {
      return {
        success: false,
        error: 'Cannot change your own role'
      };
    }

    // Build update object
    const updateData = {
      updatedAt: new Date(),
      updatedBy: currentUserId
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (company !== undefined) updateData.company = company;
    if (emailVerified !== undefined) updateData.emailVerified = emailVerified;

    // Handle password update
    if (password) {
      updateData.passwordHash = await hashPassword(password);
      updateData.passwordChangedAt = new Date();
      updateData.tempPassword = false;
    }

    // Check for email conflict if changing email
    if (email && email !== existingUser.email) {
      const emailExists = await base44.db.collections.users?.findOne?.({ 
        email: email.toLowerCase().trim(),
        _id: { $ne: existingUser._id }
      });
      
      if (emailExists) {
        return {
          success: false,
          error: 'Email is already in use by another user'
        };
      }
    }

    // Perform update
    const result = await base44.db.collections.users?.updateOne?.(
      { $or: [{ _id: id }, { id: id }] },
      { $set: updateData }
    );

    if (!result?.modifiedCount && !result?.acknowledged) {
      throw new Error('Failed to update user');
    }

    // Log admin action
    await logAdminAction({
      adminId: currentUserId,
      action: 'UPDATE_USER',
      targetId: id,
      targetType: 'user',
      details: { 
        changes: Object.keys(updateData).filter(k => !['updatedAt', 'updatedBy'].includes(k))
      }
    });

    // Send notification email if status changed
    if (status && status !== existingUser.status) {
      try {
        const template = status === 'suspended' ? 'account-suspended' : 'account-activated';
        await base44.emails.send({
          to: existingUser.email,
          template,
          data: { name: existingUser.name }
        });
      } catch (emailError) {
        console.error('Failed to send status change email:', emailError);
      }
    }

    return {
      success: true,
      data: {
        id,
        ...updateData,
        message: 'User updated successfully'
      }
    };

  } catch (error) {
    console.error('updateUser error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update user'
    };
  }
}

// Helper functions
async function hashPassword(password) {
  return `hashed_${password}`;
}

async function logAdminAction({ adminId, action, targetId, targetType, details }) {
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
