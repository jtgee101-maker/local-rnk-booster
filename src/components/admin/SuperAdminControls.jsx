import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Database, Zap, AlertTriangle, CheckCircle, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function SuperAdminControls() {
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningAction, setRunningAction] = useState(null);

  useEffect(() => {
    checkSystemHealth();
  }, []);

  const checkSystemHealth = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('admin/runHealthCheck', {});
      setSystemHealth(response.data);
    } catch (error) {
      console.error('Health check failed:', error);
      toast.error('Failed to check system health');
    } finally {
      setLoading(false);
    }
  };

  const runDataCleanup = async () => {
    if (!confirm('This will remove duplicate and invalid records. Continue?')) return;
    
    setRunningAction('cleanup');
    try {
      const response = await base44.functions.invoke('admin/cleanupInvalidLeads', {});
      toast.success(`Cleanup complete: ${response.data.cleaned} records processed`);
      await checkSystemHealth();
    } catch (error) {
      toast.error('Cleanup failed');
    } finally {
      setRunningAction(null);
    }
  };

  const validateEnvironment = async () => {
    setRunningAction('validate');
    try {
      const response = await base44.functions.invoke('validateEnvironmentConfig', {});
      if (response.data.valid) {
        toast.success('Environment configuration is valid');
      } else {
        toast.error(`Configuration issues: ${response.data.issues.join(', ')}`);
      }
    } catch (error) {
      toast.error('Validation failed');
    } finally {
      setRunningAction(null);
    }
  };

  const testCriticalPaths = async () => {
    setRunningAction('test');
    try {
      const response = await base44.functions.invoke('testCriticalPaths', {});
      const passed = response.data.results.filter(r => r.passed).length;
      const total = response.data.results.length;
      
      if (passed === total) {
        toast.success(`All ${total} critical paths passed`);
      } else {
        toast.error(`${total - passed} of ${total} tests failed`);
      }
    } catch (error) {
      toast.error('Testing failed');
    } finally {
      setRunningAction(null);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#c8ff00]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-[#c8ff00]" />
              <CardTitle className="text-white">Super Admin Controls</CardTitle>
            </div>
            <Badge className={
              systemHealth?.overall_status === 'healthy' 
                ? 'bg-green-500' 
                : systemHealth?.overall_status === 'warning' 
                ? 'bg-yellow-500' 
                : 'bg-red-500'
            }>
              {systemHealth?.overall_status?.toUpperCase() || 'UNKNOWN'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {systemHealth && (
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white font-semibold">Passed</span>
                </div>
                <div className="text-3xl font-bold text-green-400">{systemHealth.passed || 0}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-semibold">Warnings</span>
                </div>
                <div className="text-3xl font-bold text-yellow-400">{systemHealth.warnings || 0}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="text-white font-semibold">Failures</span>
                </div>
                <div className="text-3xl font-bold text-red-400">{systemHealth.failures || 0}</div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={checkSystemHealth}
              disabled={runningAction === 'health'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${runningAction === 'health' ? 'animate-spin' : ''}`} />
              Refresh Health Check
            </Button>
            <Button
              onClick={validateEnvironment}
              disabled={!!runningAction}
              variant="outline"
            >
              <Database className="w-4 h-4 mr-2" />
              {runningAction === 'validate' ? 'Validating...' : 'Validate Config'}
            </Button>
            <Button
              onClick={testCriticalPaths}
              disabled={!!runningAction}
              variant="outline"
            >
              <Zap className="w-4 h-4 mr-2" />
              {runningAction === 'test' ? 'Testing...' : 'Test Critical Paths'}
            </Button>
            <Button
              onClick={runDataCleanup}
              disabled={!!runningAction}
              variant="destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {runningAction === 'cleanup' ? 'Cleaning...' : 'Cleanup Database'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Health Check Details */}
      {systemHealth?.checks && systemHealth.checks.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Detailed Health Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemHealth.checks.map((check, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 ${
                    check.status === 'pass'
                      ? 'bg-green-500/10 border-green-500/30'
                      : check.status === 'warning'
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {check.status === 'pass' ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <AlertTriangle className={`w-5 h-5 ${check.status === 'warning' ? 'text-yellow-400' : 'text-red-400'}`} />
                        )}
                        <h4 className="text-white font-semibold">{check.name}</h4>
                      </div>
                      <p className="text-gray-400 text-sm">{check.message}</p>
                      {check.details && (
                        <div className="mt-2 text-xs text-gray-500">
                          {JSON.stringify(check.details)}
                        </div>
                      )}
                    </div>
                    <Badge
                      className={
                        check.status === 'pass'
                          ? 'bg-green-500'
                          : check.status === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }
                    >
                      {check.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}