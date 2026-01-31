import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Mail, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EmailRetryManager() {
  const [retrying, setRetrying] = useState(null);
  const [bulkRetrying, setBulkRetrying] = useState(false);
  const [timeFilter, setTimeFilter] = useState('24');

  const { data: failedEmails = [], isLoading, refetch } = useQuery({
    queryKey: ['failed-emails', timeFilter],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - parseInt(timeFilter) * 3600000).toISOString();
      return base44.entities.EmailLog.filter({
        status: 'failed',
        created_date: { $gte: cutoff }
      });
    },
    staleTime: 30000
  });

  const handleRetryEmail = async (emailId) => {
    setRetrying(emailId);
    try {
      const response = await base44.functions.invoke('admin/retryFailedEmail', {
        email_log_id: emailId
      });

      if (response?.data?.success) {
        toast.success('Email resent successfully');
        refetch();
      } else {
        throw new Error(response?.data?.error || 'Retry failed');
      }
    } catch (error) {
      console.error('Retry failed:', error);
      toast.error(error.message || 'Failed to retry email');
    } finally {
      setRetrying(null);
    }
  };

  const handleBulkRetry = async () => {
    setBulkRetrying(true);
    try {
      const response = await base44.functions.invoke('admin/bulkRetryEmails', {
        status_filter: 'failed',
        max_retries: 3,
        hours_ago: parseInt(timeFilter)
      });

      if (response?.data?.success) {
        const data = response.data;
        toast.success(
          `Retried ${data.processed} emails: ${data.success_count} succeeded, ${data.fail_count} failed`
        );
        refetch();
      } else {
        throw new Error(response?.data?.error || 'Bulk retry failed');
      }
    } catch (error) {
      console.error('Bulk retry failed:', error);
      toast.error(error.message || 'Failed to bulk retry emails');
    } finally {
      setBulkRetrying(false);
    }
  };

  const eligibleEmails = failedEmails.filter(email => (email.resend_count || 0) < 3);

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-red-400" />
            Failed Email Recovery
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-32 bg-gray-900 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last Hour</SelectItem>
                <SelectItem value="24">Last 24h</SelectItem>
                <SelectItem value="168">Last 7d</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleBulkRetry}
              disabled={bulkRetrying || eligibleEmails.length === 0}
              size="sm"
              className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black gap-2"
            >
              {bulkRetrying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Retry All ({eligibleEmails.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 text-[#c8ff00] animate-spin mx-auto" />
          </div>
        ) : failedEmails.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3 opacity-50" />
            <p className="text-gray-400">No failed emails in this time period</p>
          </div>
        ) : (
          <div className="space-y-2">
            {failedEmails.slice(0, 10).map((email) => (
              <div
                key={email.id}
                className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span className="text-white font-medium truncate">{email.to}</span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">{email.subject}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {new Date(email.created_date).toLocaleString()}
                    </span>
                    {email.resend_count > 0 && (
                      <Badge variant="outline" className="text-xs border-yellow-600 text-yellow-400">
                        Retried {email.resend_count}x
                      </Badge>
                    )}
                  </div>
                  {email.error_message && (
                    <p className="text-xs text-red-400 mt-1 truncate">
                      {email.error_message}
                    </p>
                  )}
                </div>

                <Button
                  onClick={() => handleRetryEmail(email.id)}
                  disabled={retrying === email.id || (email.resend_count || 0) >= 3}
                  size="sm"
                  variant="outline"
                  className="ml-4 flex-shrink-0"
                >
                  {retrying === email.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (email.resend_count || 0) >= 3 ? (
                    'Max Retries'
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Retry
                    </>
                  )}
                </Button>
              </div>
            ))}

            {failedEmails.length > 10 && (
              <p className="text-center text-sm text-gray-500 pt-2">
                Showing 10 of {failedEmails.length} failed emails
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}