import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, Zap, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleRequestLink = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('auth/requestAdminMagicLink', {
        email: email
      });

      if (response.data.success) {
        setSent(true);
        toast.success('Check your inbox for the sign-in link');
      } else {
        toast.error(response.data.message || 'Failed to send sign-in link');
      }
    } catch (error) {
      console.error('Error requesting magic link:', error);
      toast.error('Failed to send sign-in link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#c8ff00]/20 mx-auto">
            <Zap className="w-6 h-6 text-[#c8ff00]" />
          </div>
          <CardTitle className="text-center text-white">Admin Sign-In</CardTitle>
          <p className="text-center text-gray-400 text-sm">
            {sent
              ? 'Check your email for the secure sign-in link'
              : 'Enter your email to receive a secure sign-in link'}
          </p>
        </CardHeader>

        <CardContent>
          {!sent ? (
            <form onSubmit={handleRequestLink} className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 block mb-2">Email</label>
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-[#c8ff00] text-black hover:bg-[#b8ef00] font-semibold gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Secure Link
                  </>
                )}
              </Button>

              <div className="p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
                <p className="text-xs text-gray-400 leading-relaxed">
                  We'll send you a one-time sign-in link via email. The link expires in 10 minutes and can only be used once.
                </p>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-900/20 border border-green-700/50 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-300 font-medium text-sm">Link sent!</p>
                  <p className="text-green-200/70 text-xs mt-1">
                    Check your inbox for an email from admin@localrank.ai
                  </p>
                </div>
              </div>

              <div className="p-3 bg-gray-900/50 border border-gray-700 rounded-lg space-y-2 text-xs text-gray-400">
                <p>• Link expires in 10 minutes</p>
                <p>• It can only be used once</p>
                <p>• Check your spam folder if you don't see it</p>
              </div>

              <Button
                onClick={() => {
                  setSent(false);
                  setEmail('');
                }}
                variant="outline"
                className="w-full border-gray-700 text-gray-300"
              >
                Back
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}