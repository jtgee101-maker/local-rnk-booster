import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Activity, CheckCircle2, AlertCircle, XCircle, RefreshCw, Loader2, Clock } from 'lucide-react';

export default function HealthCheckHistory() {
  const { data: checks = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['health-checks'],
    queryFn: async () => {
      const results = await base44.entities.HealthCheck.list('-created_date', 50);
      return results;
    },
    refetchInterval: 60000 // Refresh every minute
  });

  const runManualCheck = async () => {
    try {
      await base44.functions.invoke('admin/runHealthCheck', {});
      refetch();
    } catch (error) {
      console.error('Failed to run health check:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      case 'critical': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const latestCheck = checks[0];

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-[#c8ff00]" />
              <div>
                <CardTitle className="text-white">System Health Monitor</CardTitle>
                <CardDescription>Automated health checks run every hour</CardDescription>
              </div>
            </div>
            <Button
              onClick={runManualCheck}
              disabled={isRefetching}
              size="sm"
              className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold"
            >
              {isRefetching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Run Check
            </Button>
          </div>
        </CardHeader>
        {latestCheck && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg border ${
                latestCheck.overall_status === 'healthy' 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : latestCheck.overall_status === 'warning'
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(latestCheck.overall_status)}
                  <span className={`font-semibold ${getStatusColor(latestCheck.overall_status)}`}>
                    {latestCheck.overall_status.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(latestCheck.created_date).toLocaleString()}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="text-2xl font-bold text-green-400">{latestCheck.passed}</div>
                <div className="text-xs text-green-300">Passed</div>
              </div>

              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="text-2xl font-bold text-yellow-400">{latestCheck.warnings}</div>
                <div className="text-xs text-yellow-300">Warnings</div>
              </div>

              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="text-2xl font-bold text-red-400">{latestCheck.failures}</div>
                <div className="text-xs text-red-300">Failures</div>
              </div>
            </div>

            {/* Latest Check Details */}
            {latestCheck.checks && latestCheck.checks.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Latest Check Results:</h4>
                {latestCheck.checks.map((check, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      check.status === 'pass'
                        ? 'bg-green-500/5 border-green-500/20'
                        : check.status === 'warn'
                        ? 'bg-yellow-500/5 border-yellow-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(check.status === 'pass' ? 'healthy' : check.status === 'warn' ? 'warning' : 'critical')}
                        <span className="text-sm font-medium text-white">{check.name}</span>
                      </div>
                      <span className={`text-xs ${
                        check.status === 'pass' ? 'text-green-400' :
                        check.status === 'warn' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {check.message}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* History */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Check History
          </CardTitle>
          <CardDescription>Last 50 automated health checks</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#c8ff00]" />
            </div>
          ) : checks.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No health checks recorded yet</p>
          ) : (
            <div className="space-y-2">
              {checks.map((check, idx) => (
                <motion.div
                  key={check.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      check.overall_status === 'healthy' ? 'bg-green-500' :
                      check.overall_status === 'warning' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`} />
                    <span className="text-sm text-gray-400">
                      {new Date(check.created_date).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-green-400">{check.passed} passed</span>
                    <span className="text-yellow-400">{check.warnings} warnings</span>
                    <span className="text-red-400">{check.failures} failures</span>
                    <span className="text-gray-500">{check.execution_time_ms}ms</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}