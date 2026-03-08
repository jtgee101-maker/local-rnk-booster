import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminAuthCallback() {
  const [status, setStatus] = useState('loading'); // loading, success, expired, invalid
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (!token) {
        setStatus('invalid');
        setMessage('No sign-in link provided.');
        return;
      }

      const response = await base44.functions.invoke('auth/verifyAdminMagicLink', {
        token: token
      });

      if (response.data.success) {
        // Store session token in localStorage or secure cookie
        localStorage.setItem('admin_session_token', response.data.session_token);
        localStorage.setItem('admin_email', response.data.email);
        localStorage.setItem('admin_session_expires', response.data.expires_at);

        setStatus('success');
        setMessage('You have been signed in successfully!');

        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/LaunchCommandCenter');
        }, 2000);
      } else {
        setStatus(response.data.reason || 'invalid');
        setMessage(response.data.message || 'Failed to sign in.');
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      setStatus('invalid');
      setMessage('An error occurred while verifying your sign-in link.');
    }
  };

  const statusConfigs = {
    loading: {
      icon: <Clock className="w-12 h-12 text-blue-400 animate-spin" />,
      title: 'Verifying...',
      description: 'Checking your sign-in link...'
    },
    success: {
      icon: <CheckCircle2 className="w-12 h-12 text-green-400" />,
      title: 'Signed In!',
      description: 'Redirecting to Admin Control Center...',
      bgColor: 'from-green-900/20 to-green-900/5'
    },
    expired: {
      icon: <AlertCircle className="w-12 h-12 text-yellow-400" />,
      title: 'Link Expired',
      description: 'Your sign-in link has expired. Please request a new one.',
      bgColor: 'from-yellow-900/20 to-yellow-900/5'
    },
    invalid: {
      icon: <AlertCircle className="w-12 h-12 text-red-400" />,
      title: 'Invalid Link',
      description: 'This sign-in link is invalid or has already been used.',
      bgColor: 'from-red-900/20 to-red-900/5'
    }
  };

  const config = statusConfigs[status] || statusConfigs.invalid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center mb-4">{config.icon}</div>
          <CardTitle className="text-white">{config.title}</CardTitle>
          <p className="text-gray-400 text-sm">{message || config.description}</p>
        </CardHeader>

        <CardContent>
          <div className={`p-4 rounded-lg bg-gradient-to-r ${config.bgColor || 'from-gray-900/50 to-gray-900/30'} border border-gray-700`}>
            {status === 'success' && (
              <p className="text-green-300 text-sm text-center">
                ✓ Admin session created. You will be redirected shortly.
              </p>
            )}
            {status === 'expired' && (
              <div className="space-y-3">
                <p className="text-yellow-300 text-sm">Your link expired after 10 minutes.</p>
                <button
                  onClick={() => window.location.href = '/admin-login'}
                  className="w-full px-4 py-2 bg-[#c8ff00] text-black hover:bg-[#b8ef00] rounded font-semibold text-sm transition"
                >
                  Request New Link
                </button>
              </div>
            )}
            {status === 'invalid' && (
              <div className="space-y-3">
                <p className="text-red-300 text-sm">This link is invalid or has already been used.</p>
                <button
                  onClick={() => window.location.href = '/admin-login'}
                  className="w-full px-4 py-2 bg-[#c8ff00] text-black hover:bg-[#b8ef00] rounded font-semibold text-sm transition"
                >
                  Back to Sign-In
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}