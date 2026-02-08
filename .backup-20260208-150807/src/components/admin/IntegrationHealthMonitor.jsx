import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle, AlertTriangle, XCircle, Mail, MapPin, CreditCard, Zap } from 'lucide-react';

export default function IntegrationHealthMonitor() {
  const { data: health, isLoading } = useQuery({
    queryKey: ['integration-health'],
    queryFn: async () => {
      const checks = {
        resend: { status: 'unknown', lastCheck: null, error: null },
        googleMaps: { status: 'unknown', lastCheck: null, error: null },
        stripe: { status: 'unknown', lastCheck: null, error: null },
        base44: { status: 'operational', lastCheck: new Date(), error: null }
      };

      // Check Resend by trying to send a test (or checking recent emails)
      try {
        const recentEmails = await base44.entities.EmailLog.list('-created_date', 10);
        const recentFailures = recentEmails.filter(e => e.status === 'failed').length;
        checks.resend = {
          status: recentFailures > 5 ? 'degraded' : 'operational',
          lastCheck: new Date(),
          error: recentFailures > 5 ? `${recentFailures} recent failures` : null,
          sentLast24h: recentEmails.filter(e => {
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return new Date(e.created_date) > dayAgo;
          }).length
        };
      } catch (error) {
        checks.resend = { status: 'error', lastCheck: new Date(), error: error.message };
      }

      // Check Google Maps (verify we have leads with place_id)
      try {
        const leadsWithMaps = await base44.entities.Lead.list('', 5);
        const hasMapData = leadsWithMaps.some(l => l.place_id);
        checks.googleMaps = {
          status: hasMapData ? 'operational' : 'warning',
          lastCheck: new Date(),
          error: hasMapData ? null : 'No recent map data',
          leadsWithData: leadsWithMaps.filter(l => l.place_id).length
        };
      } catch (error) {
        checks.googleMaps = { status: 'error', lastCheck: new Date(), error: error.message };
      }

      // Check Stripe (verify we have recent orders)
      try {
        const recentOrders = await base44.entities.Order.list('-created_date', 10);
        const completedOrders = recentOrders.filter(o => o.status === 'completed').length;
        checks.stripe = {
          status: recentOrders.length > 0 ? 'operational' : 'warning',
          lastCheck: new Date(),
          error: null,
          ordersLast24h: recentOrders.filter(o => {
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return new Date(o.created_date) > dayAgo;
          }).length
        };
      } catch (error) {
        checks.stripe = { status: 'error', lastCheck: new Date(), error: error.message };
      }

      return checks;
    },
    refetchInterval: 60000 // Refresh every minute
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'degraded':
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Zap className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'degraded':
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const integrations = health ? [
    {
      name: 'Resend Email',
      icon: Mail,
      status: health.resend.status,
      lastCheck: health.resend.lastCheck,
      error: health.resend.error,
      metrics: health.resend.sentLast24h ? `${health.resend.sentLast24h} sent (24h)` : null
    },
    {
      name: 'Google Maps API',
      icon: MapPin,
      status: health.googleMaps.status,
      lastCheck: health.googleMaps.lastCheck,
      error: health.googleMaps.error,
      metrics: health.googleMaps.leadsWithData ? `${health.googleMaps.leadsWithData} leads enriched` : null
    },
    {
      name: 'Stripe Payments',
      icon: CreditCard,
      status: health.stripe.status,
      lastCheck: health.stripe.lastCheck,
      error: health.stripe.error,
      metrics: health.stripe.ordersLast24h ? `${health.stripe.ordersLast24h} orders (24h)` : null
    },
    {
      name: 'Base44 Platform',
      icon: Zap,
      status: health.base44.status,
      lastCheck: health.base44.lastCheck,
      error: health.base44.error,
      metrics: 'Database operational'
    }
  ] : [];

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center text-gray-400">
          Checking integrations...
        </CardContent>
      </Card>
    );
  }

  const allOperational = integrations.every(i => i.status === 'operational');
  const hasErrors = integrations.some(i => i.status === 'error');

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm">Integration Health</CardTitle>
          <Badge className={allOperational ? 'bg-green-500/20 text-green-400' : hasErrors ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}>
            {allOperational ? 'All Systems Go' : hasErrors ? 'Issues Detected' : 'Degraded'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {integrations.map((integration, i) => {
            const Icon = integration.icon;
            return (
              <div
                key={i}
                className={`p-4 rounded-lg border ${getStatusColor(integration.status)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-900 rounded-lg">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{integration.name}</div>
                      {integration.metrics && (
                        <div className="text-xs text-gray-400 mt-0.5">{integration.metrics}</div>
                      )}
                    </div>
                  </div>
                  {getStatusIcon(integration.status)}
                </div>

                {integration.error && (
                  <div className="text-xs text-red-300 mt-2 bg-red-900/20 p-2 rounded">
                    {integration.error}
                  </div>
                )}

                {integration.lastCheck && (
                  <div className="text-xs text-gray-500 mt-2">
                    Last checked: {new Date(integration.lastCheck).toLocaleTimeString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}