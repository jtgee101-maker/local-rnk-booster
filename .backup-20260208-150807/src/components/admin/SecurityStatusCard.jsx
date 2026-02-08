import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Shield, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SecurityStatusCard() {
  const [validating, setValidating] = useState(false);

  const { data: securityStatus, isLoading, refetch } = useQuery({
    queryKey: ['security-status'],
    queryFn: async () => {
      const response = await base44.functions.invoke('admin/validateSecurityConfig', {});
      return response.data;
    },
    staleTime: 60000,
    retry: 1
  });

  const handleRevalidate = async () => {
    setValidating(true);
    try {
      await refetch();
      toast.success('Security validation completed');
    } catch (error) {
      toast.error('Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'fail': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getOverallBadge = (status) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border">Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border">Warning</Badge>;
      case 'critical':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#c8ff00]" />
            Security Status
          </CardTitle>
          <Button
            onClick={handleRevalidate}
            disabled={validating || isLoading}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            {validating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Revalidate
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 text-[#c8ff00] animate-spin mx-auto" />
          </div>
        ) : securityStatus?.success ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
              <span className="text-gray-300 font-medium">Overall Status</span>
              {getOverallBadge(securityStatus.overall_status)}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{securityStatus.passed}</div>
                <div className="text-xs text-gray-400 mt-1">Passed</div>
              </div>
              <div className="text-center p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">{securityStatus.warnings}</div>
                <div className="text-xs text-gray-400 mt-1">Warnings</div>
              </div>
              <div className="text-center p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="text-2xl font-bold text-red-400">{securityStatus.critical_issues}</div>
                <div className="text-xs text-gray-400 mt-1">Critical</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Security Checks</h4>
              {securityStatus.checks?.map((check, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 bg-gray-900/30 rounded border border-gray-700"
                >
                  {getStatusIcon(check.status)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium">{check.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{check.message}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs text-gray-500 text-center pt-2">
              Last checked: {new Date(securityStatus.timestamp).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3 opacity-50" />
            <p className="text-gray-400">Failed to load security status</p>
            <Button onClick={handleRevalidate} size="sm" variant="outline" className="mt-3">
              Retry
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}