import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const adminEmail = 'jtgee101@gmail.com';
    
    // Invite admin user with admin role
    await base44.users.inviteUser(adminEmail, 'admin');
    
    return Response.json({ 
      success: true, 
      message: `Admin user ${adminEmail} invited successfully`,
      email: adminEmail,
      role: 'admin'
    });
  } catch (error) {
    // If user already exists, that's fine
    if (error.message?.includes('already exists') || error.message?.includes('already invited')) {
      return Response.json({ 
        success: true, 
        message: 'Admin user already exists',
        email: 'jtgee101@gmail.com'
      });
    }
    
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});