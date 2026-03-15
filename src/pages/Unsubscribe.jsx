import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

export default function Unsubscribe() {
  const [status, setStatus] = useState('loading'); // loading | success | already | error
  const [email, setEmail] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (!emailParam) {
      setStatus('error');
      return;
    }
    setEmail(emailParam);
    handleUnsubscribe(emailParam);
  }, []);

  const handleUnsubscribe = async (emailAddr) => {
    try {
      // Mark all active nurtures as completed for this email
      const nurtures = await base44.entities.LeadNurture.filter({ email: emailAddr, status: 'active' });
      await Promise.all(nurtures.map(n =>
        base44.entities.LeadNurture.update(n.id, { status: 'completed' })
      ));

      // Mark lead as unsubscribed
      const leads = await base44.entities.Lead.filter({ email: emailAddr });
      if (leads.length > 0) {
        await base44.entities.Lead.update(leads[0].id, { workflow_stage: 'unsubscribed' });
      }

      // Mark all email logs as unsubscribed
      const logs = await base44.entities.EmailLog.filter({ to: emailAddr, status: 'sent' });
      await Promise.all(logs.map(l =>
        base44.entities.EmailLog.update(l.id, {
          is_unsubscribed: true,
          status: 'unsubscribed',
          unsubscribed_at: new Date().toISOString()
        })
      ));

      setStatus('success');
    } catch (err) {
      console.error('Unsubscribe error:', err);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
            <p className="text-gray-400">Processing your request...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">You've been unsubscribed</h1>
              <p className="text-gray-400">
                <span className="text-gray-300">{email}</span> has been removed from all LocalRank.ai email sequences.
              </p>
            </div>
            <p className="text-gray-500 text-sm">
              You won't receive any more marketing emails. If you have questions, contact us at{' '}
              <a href="mailto:support@localrank.ai" className="text-purple-400 hover:underline">
                support@localrank.ai
              </a>
            </p>
            <a
              href="/"
              className="inline-block mt-4 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors"
            >
              Back to LocalRank.ai
            </a>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
              <p className="text-gray-400">
                We couldn't process your unsubscribe request. Please email us directly at{' '}
                <a href="mailto:support@localrank.ai" className="text-purple-400 hover:underline">
                  support@localrank.ai
                </a>{' '}
                and we'll remove you manually within 24 hours.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}