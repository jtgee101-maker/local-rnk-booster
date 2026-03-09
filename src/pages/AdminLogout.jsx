import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

export default function AdminLogout() {
  const navigate = useNavigate();

  useEffect(() => {
    logout();
  }, []);

  const logout = async () => {
    try {
      // Get session token from cookie
      const sessionToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('admin_session='))
        ?.split('=')[1];

      if (sessionToken) {
        // Call backend logout
        await base44.functions.invoke('auth/adminLogout', {
          session_token: sessionToken
        });
      }

      // Clear cookie
      document.cookie = 'admin_session=; path=/; max-age=0;';

      // Redirect to login
      navigate(createPageUrl('AdminLogin'));
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if logout fails
      document.cookie = 'admin_session=; path=/; max-age=0;';
      navigate(createPageUrl('AdminLogin'));
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c8ff00]" />
    </div>
  );
}