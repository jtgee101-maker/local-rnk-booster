import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, TrendingUp, CheckCircle, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function AdvancedErrorAnalytics() {
  const [selectedError, setSelectedError] = useState(null);
  const queryClient = useQueryClient();

  const { data: errorData, isLoading } = useQuery({
    queryKey: ['error-analytics'],
    queryFn: async () => {
      const errors = await base44.entities.ErrorLog.list('-created_date', 50);
      
      // Group by type
      const byType = errors.reduce((acc, err) => {
        acc[err.error_type] = (acc[err.error_type] || 0) + 1;
        return acc;
      }, {});

      // Calculate trends
      const last24h = errors.filter(e => {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return new Date(e.created_date) > dayAgo;
      });

      const prev24h = errors.filter(e => {
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return new Date(e.created_date) > twoDaysAgo && new Date(e.created_date) < dayAgo;
      });

      const trend = prev24h.length > 0 
        ? ((last24h.length - prev24h.length) / prev24h.length * 100).toFixed(1)
        : 0;

      return {
        total: errors.length,
        unresolved: errors.filter(e => !e.resolved).length,
        critical: errors.filter(e => e.severity === 'critical').length,
        last24h: last24h.length,
        trend,
        byType,
        recent: errors.slice(0, 10)
      };
    }
  });

  const resolveErrorMutation = useMutation({
    mutationFn: async (errorId) => {
      await base44.entities.ErrorLog.update(errorId, {
        resolved: true,
        resolved_date: new Date().toISOString(),
        resolved_by: 'admin'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['error-analytics'] });
      toast.success('Error marked as resolved');
      setSelectedError(null);
    }
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center text-gray-400">
          Analyzing errors...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-gray-400">Total Errors</span>
            </div>
            <div className="text-2xl font-bold text-white">{errorData?.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-400">Unresolved</span>
            </div>
            <div className="text-2xl font-bold text-white">{errorData?.unresolved}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-gray-400">Critical</span>
            </div>
            <div className="text-2xl font-bold text-white">{errorData?.critical}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">24h Trend</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {errorData?.trend > 0 ? '+' : ''}{errorData?.trend}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-sm text-gray-400">Recent Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {errorData?.recent.map((error) => (
              <div key={error.id} className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getSeverityColor(error.severity)}>
                        {error.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {error.error_type.replace(/_/g, ' ')}
                      </Badge>
                      {error.resolved && (
                        <Badge className="bg-green-500/20 text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Resolved
                        </Badge>
                      )}
                    </div>
                    <div className="text-white text-sm font-medium">{error.message}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(error.created_date).toLocaleString()}
                    </div>
                  </div>
                  {!error.resolved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveErrorMutation.mutate(error.id)}
                      className="text-green-400 border-green-400/30 hover:bg-green-400/10"
                    >
                      Resolve
                    </Button>
                  )}
                </div>
                
                {error.metadata && (
                  <div className="text-xs text-gray-400 mt-2">
                    Component: {error.metadata.component || 'Unknown'} • 
                    Action: {error.metadata.action || 'Unknown'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-sm text-gray-400">Errors by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(errorData?.byType || {}).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-2 bg-gray-900 rounded">
                <span className="text-white text-sm capitalize">{type.replace(/_/g, ' ')}</span>
                <Badge>{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}