import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { base44 } from '@/api/base44Client';
import { Activity, Database, Mail, CreditCard, AlertCircle, CheckCircle, XCircle, RefreshCw, TrendingUp, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function SystemHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuthAndLoadHealth();
  }, []);

  const checkAuthAndLoadHealth = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = '/';
        return;
      }
      setUser(currentUser);
      await runHealthCheck();
    } catch (error) {
      console.error('Auth error:', error);
      window.location.href = '/';
    }
  };

  const runHealthCheck = async () => {
    try {
      setLoading(true);
      
      // Run comprehensive health checks
      const checks = [];
      
      // Database check
      try {
        const leads = await base44.entities.Lead.list();
        checks.push({
          name: 'Database Connection',
          status: 'healthy',
          message: `Connected - ${leads.length} leads`,
          icon: Database,
          color: '#10b981'
        });
      } catch (err) {
        checks.push({
          name: 'Database Connection',
          status: 'unhealthy',
          message: 'Failed to connect',
          icon: Database,
          color: '#ef4444'
        });
      }

      // Email system check
      try {
        const emailLogs = await base44.entities.EmailLog.list();
        const recentFailed = emailLogs.filter(e => e.status === 'failed' && new Date(e.created_date) > new Date(Date.now() - 86400000));
        checks.push({
          name: 'Email System',
          status: recentFailed.length > 10 ? 'degraded' : 'healthy',
          message: `${recentFailed.length} failures in 24h`,
          icon: Mail,
          color: recentFailed.length > 10 ? '#f59e0b' : '#10b981'
        });
      } catch (err) {
        checks.push({
          name: 'Email System',
          status: 'unknown',
          message: 'Unable to check',
          icon: Mail,
          color: '#6b7280'
        });
      }

      // Payment system check
      try {
        const orders = await base44.entities.Order.list();
        const recentFailed = orders.filter(o => o.status === 'failed' && new Date(o.created_date) > new Date(Date.now() - 86400000));
        checks.push({
          name: 'Payment System',
          status: recentFailed.length > 5 ? 'degraded' : 'healthy',
          message: `${recentFailed.length} failures in 24h`,
          icon: CreditCard,
          color: recentFailed.length > 5 ? '#f59e0b' : '#10b981'
        });
      } catch (err) {
        checks.push({
          name: 'Payment System',
          status: 'unknown',
          message: 'Unable to check',
          icon: CreditCard,
          color: '#6b7280'
        });
      }

      // Error tracking check
      try {
        const errors = await base44.entities.ErrorLog.list();
        const criticalErrors = errors.filter(e => e.severity === 'critical' && !e.resolved);
        checks.push({
          name: 'Error Tracking',
          status: criticalErrors.length > 5 ? 'unhealthy' : 'healthy',
          message: `${criticalErrors.length} unresolved critical errors`,
          icon: AlertCircle,
          color: criticalErrors.length > 5 ? '#ef4444' : '#10b981'
        });
      } catch (err) {
        checks.push({
          name: 'Error Tracking',
          status: 'unknown',
          message: 'Unable to check',
          icon: AlertCircle,
          color: '#6b7280'
        });
      }

      // Automation check
      try {
        const automations = await base44.entities.LeadNurture.filter({ status: 'active' });
        checks.push({
          name: 'Automation System',
          status: 'healthy',
          message: `${automations.length} active sequences`,
          icon: Zap,
          color: '#10b981'
        });
      } catch (err) {
        checks.push({
          name: 'Automation System',
          status: 'unknown',
          message: 'Unable to check',
          icon: Zap,
          color: '#6b7280'
        });
      }

      // API performance check
      const apiStart = Date.now();
      await base44.entities.ConversionEvent.list();
      const apiTime = Date.now() - apiStart;
      checks.push({
        name: 'API Performance',
        status: apiTime > 2000 ? 'degraded' : 'healthy',
        message: `${apiTime}ms response time`,
        icon: TrendingUp,
        color: apiTime > 2000 ? '#f59e0b' : '#10b981'
      });

      // Calculate overall health score
      const healthyCount = checks.filter(c => c.status === 'healthy').length;
      const totalCount = checks.length;
      const score = Math.round((healthyCount / totalCount) * 100);
      
      let overallStatus = 'healthy';
      if (score < 50) overallStatus = 'unhealthy';
      else if (score < 80) overallStatus = 'degraded';

      setHealth({
        score,
        status: overallStatus,
        checks,
        timestamp: new Date().toISOString()
      });
      
      setLastCheck(new Date());
      toast.success('Health check completed');
    } catch (error) {
      console.error('Health check failed:', error);
      toast.error('Failed to run health check');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'degraded': return <AlertCircle className="w-5 h-5 text-amber-400" />;
      case 'unhealthy': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      case 'degraded': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'unhealthy': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  if (loading && !health) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#c8ff00] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Activity className="w-8 h-8 text-[#c8ff00]" />
              System Health
            </h1>
            <p className="text-gray-400 mt-2">Monitor platform health and performance</p>
          </div>
          <Button onClick={runHealthCheck} disabled={loading} className="gap-2 bg-[#c8ff00] text-black hover:bg-[#c8ff00]/90">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Run Check
          </Button>
        </div>

        {health && (
          <>
            <Card className="mb-6 bg-[#1a1a2e] border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-3">
                      Overall Status
                      {getStatusIcon(health.status)}
                    </CardTitle>
                    <CardDescription>
                      Last checked: {lastCheck?.toLocaleTimeString()}
                    </CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(health.status)} text-lg px-4 py-2`}>
                    {health.score}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={health.score} className="h-3" />
                <div className="flex justify-between mt-2 text-sm text-gray-400">
                  <span>{health.checks.filter(c => c.status === 'healthy').length} / {health.checks.length} checks passing</span>
                  <span className="capitalize">{health.status}</span>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {health.checks.map((check, idx) => {
                const Icon = check.icon;
                return (
                  <Card key={idx} className="bg-[#1a1a2e] border-gray-800">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${check.color}20` }}>
                            <Icon className="w-6 h-6" style={{ color: check.color }} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{check.name}</CardTitle>
                            <p className="text-sm text-gray-400 mt-1">{check.message}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(check.status)}>
                          {check.status}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>

            <Card className="mt-6 bg-[#1a1a2e] border-gray-800">
              <CardHeader>
                <CardTitle>Health History</CardTitle>
                <CardDescription>Recent health check results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p>Health history tracking coming soon</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}