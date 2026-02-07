import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler';

/**
 * Setup Production Admin User
 * Creates or verifies admin user and sets up admin access key
 */
Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const adminSetup = {
      timestamp: new Date().toISOString(),
      currentUser: {
        email: user.email,
        role: user.role,
        isAdmin: user.role === 'admin'
      },
      checks: {
        adminAccessKey: { status: 'unknown', value: null },
        adminUserVerified: { status: 'pass', value: user.email },
        dashboardAccess: { status: 'pass', value: true }
      },
      setup: {
        needsAdminInvite: false,
        adminAccessConfigured: Deno.env.get('ADMIN_ACCESS_KEY') !== undefined,
        nextSteps: []
      }
    };

    // Check admin access key
    const adminKey = Deno.env.get('ADMIN_ACCESS_KEY');
    if (adminKey) {
      adminSetup.checks.adminAccessKey = {
        status: 'pass',
        value: `${adminKey.substring(0, 4)}...${adminKey.substring(adminKey.length - 4)}`
      };
    } else {
      adminSetup.checks.adminAccessKey = {
        status: 'fail',
        value: 'Not configured'
      };
      adminSetup.setup.nextSteps.push('Set ADMIN_ACCESS_KEY in environment variables');
    }

    // Verify admin can access admin features
    try {
      await base44.asServiceRole.entities.ErrorLog.list(undefined, 1);
      adminSetup.checks.dashboardAccess = {
        status: 'pass',
        value: 'Admin can access restricted entities'
      };
    } catch (error) {
      adminSetup.checks.dashboardAccess = {
        status: 'fail',
        value: 'Cannot access admin entities: ' + error.message
      };
    }

    if (adminSetup.setup.nextSteps.length === 0) {
      adminSetup.status = 'production-ready';
      adminSetup.setup.readyForDeployment = true;
    } else {
      adminSetup.status = 'needs-configuration';
      adminSetup.setup.readyForDeployment = false;
    }

    return Response.json(adminSetup);
  } catch (error) {
    console.error('Admin setup error:', error);
    return Response.json({ 
      error: error.message,
      status: 'failed'
    }, { status: 500 });
  }
});