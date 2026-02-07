/**
 * Delete a user (soft delete)
 */

import { withErrorHandler, FunctionError, successResponse } from './utils/errorHandler';
async function deleteUserHandler(request) {
  try {
    // Verify admin access
    const currentUser = request.user;
    if (!currentUser || !['admin', 'super-admin'].includes(currentUser.role)) {
      return {
        success: false,
        error: 'Unauthorized: Admin access required'
      };
    }

    const { id, hardDelete = false, reason = '' } = request.data || {};

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

    const currentUserId = currentUser.id || currentUser._id?.toString?.();
    const targetUserId = existingUser._id?.toString?.() || existingUser.id;

    // Prevent self-deletion
    if (currentUserId === targetUserId) {
      return {
        success: false,
        error: 'Cannot delete your own account'
      };
    }

    // Only super-admin can delete other admins
    if (['admin', 'super-admin'].includes(existingUser.role) && currentUser.role !== 'super-admin') {
      return {
        success: false,
        error: 'Only super admins can delete admin accounts'
      };
    }

    // Prevent deleting the last super-admin
    if (existingUser.role === 'super-admin') {
      const superAdminCount = await base44.db.collections.users?.count?.({ role: 'super-admin' });
      if (superAdminCount <= 1) {
        return {
          success: false,
          error: 'Cannot delete the last super admin account'
        };
      }
    }

    if (hardDelete) {
      // Permanent deletion
      await base44.db.collections.users?.deleteOne?.({ 
        $or: [{ _id: id }, { id: id }] 
      });
      
      // Clean up related data
      await cleanupUserData(id);
    } else {
      // Soft delete - mark as deleted
      await base44.db.collections.users?.updateOne?.(
        { $or: [{ _id: id }, { id: id }] },
        { 
          $set: {
            status: 'deleted',
            deletedAt: new Date(),
            deletedBy: currentUserId,
            deletionReason: reason,
            updatedAt: new Date()
          }
        }
      );
    }

    // Log admin action
    await logAdminAction({
      adminId: currentUserId,
      action: hardDelete ? 'HARD_DELETE_USER' : 'SOFT_DELETE_USER',
      targetId: id,
      targetType: 'user',
      details: { 
        email: existingUser.email,
        role: existingUser.role,
        reason,
        hardDelete
      }
    });

    // Send deletion notification
    try {
      await base44.emails.send({
        to: existingUser.email,
        template: 'account-deleted',
        data: { 
          name: existingUser.name,
          deletedBy: currentUser.name || 'Admin',
          reason: reason || 'No reason provided'
        }
      });
    } catch (emailError) {
      console.error('Failed to send deletion email:', emailError);
    }

    return {
      success: true,
      data: {
        id,
        hardDelete,
        message: hardDelete ? 'User permanently deleted' : 'User deactivated'
      }
    };

  } catch (error) {
    console.error('deleteUser error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete user'
    };
  }
}

// Helper to clean up user-related data
async function cleanupUserData(userId) {
  try {
    // Delete user's sessions
    await base44.db.collections.sessions?.deleteMany?.({ userId });
    
    // Delete user's API keys
    await base44.db.collections.apiKeys?.deleteMany?.({ userId });
    
    // Archive user's activity logs instead of deleting
    await base44.db.collections.activityLogs?.updateMany?.(
      { userId },
      { $set: { userDeleted: true, archivedAt: new Date() } }
    );
    
    // Note: Keep orders and billing records for compliance
  } catch (error) {
    console.error('Error cleaning up user data:', error);
  }
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

export default withErrorHandler(deleteUserHandler);
