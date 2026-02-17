/**
 * Update tenant status (activate, suspend, cancel)
 */

import { withErrorHandler, FunctionError, successResponse } from '../utils/errorHandler';

interface Tenant {
  id?: string;
  _id?: { toString(): string };
  status?: string;
  statusHistory?: Array<{
    from: string;
    to: string;
    changedAt: Date;
    changedBy: string;
    reason: string;
  }>;
  suspendedAt?: Date;
  suspensionReason?: string | null;
  cancelledAt?: Date;
  cancellationReason?: string;
  cancelledBy?: string;
  reactivatedAt?: Date;
  ownerId?: string;
  ownerEmail?: string;
}

interface UpdateTenantStatusRequest {
  user?: {
    role: string;
    id?: string;
    _id?: { toString(): string };
  };
  data?: {
    id?: string;
    status?: string;
    reason?: string;
    notifyOwner?: boolean;
  };
  base44?: {
    db: {
      collections: Record<string, {
        findOne?: (query: Record<string, unknown>) => Promise<Tenant | null>;
        updateOne?: (filter: Record<string, unknown>, update: Record<string, unknown>) => Promise<{ modifiedCount?: number; acknowledged?: boolean }>;
        updateMany?: (filter: Record<string, unknown>, update: Record<string, unknown>) => Promise<unknown>;
        create?: <T = Record<string, unknown>>(data: T) => Promise<T>;
      }>;
    };
  };
}

async function updateTenantStatusHandler(request: UpdateTenantStatusRequest) {
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
      id, 
      status, 
      reason = '',
      notifyOwner = true
    } = request.data || {};

    if (!id) {
      return {
        success: false,
        error: 'Tenant ID is required'
      };
    }

    if (!status) {
      return {
        success: false,
        error: 'Status is required'
      };
    }

    // Validate status
    const validStatuses = ['active', 'suspended', 'pending', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return {
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      };
    }

    // Find existing tenant
    const existingTenant = await base44.db.collections.tenants?.findOne?.({ 
      $or: [
        { _id: id },
        { id: id }
      ]
    });

    if (!existingTenant) {
      return {
        success: false,
        error: 'Tenant not found'
      };
    }

    const previousStatus = existingTenant.status;
    
    // Prevent unnecessary updates
    if (previousStatus === status) {
      return {
        success: false,
        error: `Tenant is already ${status}`
      };
    }

    const currentUserId = currentUser.id || currentUser._id?.toString?.();

    // Build update data
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
      updatedBy: currentUserId,
      statusHistory: [
        ...(existingTenant.statusHistory || []),
        {
          from: previousStatus,
          to: status,
          changedAt: new Date(),
          changedBy: currentUserId,
          reason
        }
      ]
    };

    // Add suspension/cancellation details
    if (status === 'suspended') {
      updateData.suspendedAt = new Date();
      updateData.suspensionReason = reason;
    } else if (status === 'cancelled') {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = reason;
      updateData.cancelledBy = currentUserId;
    } else if (status === 'active' && previousStatus === 'suspended') {
      updateData.reactivatedAt = new Date();
      updateData.suspensionReason = null;
    }

    // Perform update
    const result = await base44.db.collections.tenants?.updateOne?.(
      { $or: [{ _id: id }, { id: id }] },
      { $set: updateData }
    );

    if (!result?.modifiedCount && !result?.acknowledged) {
      throw new Error('Failed to update tenant status');
    }

    // Update all users in this tenant if suspending/cancelling
    if (status === 'suspended' || status === 'cancelled') {
      await base44.db.collections.users?.updateMany?.(
        { tenantId: id },
        { $set: { canLogin: false, statusUpdatedAt: new Date() } }
      );
    } else if (status === 'active') {
      await base44.db.collections.users?.updateMany?.(
        { tenantId: id },
        { $set: { canLogin: true, statusUpdatedAt: new Date() } }
      );
    }

    // Log admin action
    await logAdminAction({
      adminId: currentUserId,
      action: 'UPDATE_TENANT_STATUS',
      targetId: id,
      targetType: 'tenant',
      details: {
        from: previousStatus,
        to: status,
        reason
      }
    });

    // Notify tenant owner
    if (notifyOwner && existingTenant.owner?.email) {
      try {
        const templates = {
          active: 'tenant-activated',
          suspended: 'tenant-suspended',
          cancelled: 'tenant-cancelled',
          pending: 'tenant-pending'
        };

        await base44.emails.send({
          to: existingTenant.owner.email,
          template: templates[status],
          data: {
            tenantName: existingTenant.name,
            ownerName: existingTenant.owner.name,
            reason: reason || 'No reason provided',
            adminName: currentUser.name || 'Admin',
            supportUrl: `${process.env.APP_URL}/support`
          }
        });
      } catch (emailError) {
        console.error('Failed to send status change email:', emailError);
      }
    }

    return {
      success: true,
      data: {
        id,
        previousStatus,
        newStatus: status,
        updatedAt: updateData.updatedAt,
        message: `Tenant status updated to ${status}`
      }
    };

  } catch (error) {
    console.error('updateTenantStatus error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update tenant status'
    };
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

export default withErrorHandler(updateTenantStatusHandler);
