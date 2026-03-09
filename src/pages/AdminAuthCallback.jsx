import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function AdminAuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your sign-in link...');

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (!token) {
        setStatus('invalid');
        setMessage('No sign-in link provided');
        return;
      }

      // Call backend verifier
      const response = await base44.functions.invoke('auth/verifyAdminMagicLink', {
        token
      });

      if (!response.data) {
        throw new Error('No response');
      }

      const result = response.data;

      if (result.status === 'success') {
        // Store session in localStorage — Base44's function proxy strips Set-Cookie headers
        // so server-side HttpOnly is not possible via functions.invoke(). Security is
        // enforced server-side: all admin functions verify user.role === 'admin'.
        localStorage.setItem('admin_session_token', result.session_token);
        localStorage.setItem('admin_session_expires', result.expires_at);

        setStatus('success');
        setMessage('Sign-in successful! Redirecting...');

        // Redirect after brief delay
        setTimeout(() => {
          navigate(createPageUrl('LaunchCommandCenter'));
        }, 1500);
      } else if (result.status === 'expired') {
        setStatus('expired');
        setMessage('This sign-in link has expired. Please request a new one.');
      } else if (result.status === 'invalid') {
        setStatus('invalid');
        setMessage('This sign-in link is invalid or has already been used.');
      } else {
        setStatus('error');
        setMessage('An error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      setStatus('error');
      setMessage('An error occurred while verifying your link.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-[#1a1a2e] border-gray-800">
          <CardContent className="pt-8">
            <div className="text-center space-y-6">
              {status === 'verifying' && (
                <>
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c8ff00]" />
                  </div>
                  <p className="text-gray-400">{message}</p>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="flex justify-center">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </div>
                  <p className="text-green-400 font-semibold">{message}</p>
                </>
              )}

              {status === 'expired' && (
                <>
                  <div className="flex justify-center">
                    <Clock className="w-12 h-12 text-yellow-500" />
                  </div>
                  <p className="text-yellow-400 font-semibold">{message}</p>
                  <a
                    href={createPageUrl('AdminLogin')}
                    className="inline-block mt-4 px-6 py-2 bg-[#c8ff00] text-[#0a0a0f] rounded-lg font-semibold hover:bg-[#b8e800] transition"
                  >
                    Request new link
                  </a>
                </>
              )}

              {status === 'invalid' && (
                <>
                  <div className="flex justify-center">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                  </div>
                  <p className="text-red-400 font-semibold">{message}</p>
                  <a
                    href={createPageUrl('AdminLogin')}
                    className="inline-block mt-4 px-6 py-2 bg-[#c8ff00] text-[#0a0a0f] rounded-lg font-semibold hover:bg-[#b8e800] transition"
                  >
                    Request new link
                  </a>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="flex justify-center">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                  </div>
                  <p className="text-red-400 font-semibold">{message}</p>
                  <a
                    href={createPageUrl('AdminLogin')}
                    className="inline-block mt-4 px-6 py-2 bg-[#c8ff00] text-[#0a0a0f] rounded-lg font-semibold hover:bg-[#b8e800] transition"
                  >
                    Try again
                  </a>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}