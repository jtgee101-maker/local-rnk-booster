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
      // Get session token from localStorage (where AdminAuthCallback stores it)
      const sessionToken = localStorage.getItem('admin_session_token');

      if (sessionToken) {
        // Revoke session in DB
        await base44.functions.invoke('auth/adminLogout', {
          session_token: sessionToken
        });
      }

      // Clear session storage
      localStorage.removeItem('admin_session_token');
      localStorage.removeItem('admin_session_expires');
      document.cookie = 'admin_session=; path=/; max-age=0;'; // clear legacy cookie too

      // Redirect to login
      navigate(createPageUrl('AdminLogin'));
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if logout fails
      localStorage.removeItem('admin_session_token');
      localStorage.removeItem('admin_session_expires');
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