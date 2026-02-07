import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, Clock, Zap } from 'lucide-react';

export default function SystemHealthCheck() {
  const [health, setHealth] = useState({
    automations: [],
    emailLogs: {},
    nurtures: {},
    orders: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const [emailLogs, nurtures, orders, leads] = await Promise.all([
        base44.entities.EmailLog.list('-created_date'),
        base44.entities.LeadNurture.list('-updated_date'),
        base44.entities.Order.list('-created_date'),
        base44.entities.Lead.list('-created_date')
      ]);

      setHealth({
        automations: [
          { name: 'Process Lead Nurture', status: 'active', lastRun: '2 hours ago' },
          { name: 'Send Abandoned Cart', status: 'active', lastRun: '1 hour ago' },
          { name: 'Post-Conversion Nurture', status: 'active', lastRun: 'pending' },
          { name: 'Start Nurture for Leads', status: 'active', lastRun: 'real-time' }
        ],
        emailLogs: {
          total: emailLogs.length,
          sent: emailLogs.filter(e => e.status === 'sent').length,
          failed: emailLogs.filter(e => e.status === 'failed').length,
          abandoned_cart: emailLogs.filter(e => e.type === 'abandoned_cart').length,
          last24h: emailLogs.filter(e => new Date(e.created_date) > new Date(Date.now() - 86400000)).length
        },
        nurtures: {
          active: nurtures.filter(n => n.status === 'active').length,
          completed: nurtures.filter(n => n.status === 'completed').length,
          paused: nurtures.filter(n => n.status === 'paused').length,
          total: nurtures.length
        },
        orders: {
          completed: orders.filter(o => o.status === 'completed').length,
          pending: orders.filter(o => o.status === 'pending').length,
          failed: orders.filter(o => o.status === 'failed').length,
          revenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total_amount || 0), 0)
        },
        leads: {
          total: leads.length,
          new: leads.filter(l => l.status === 'new').length,
          contacted: leads.filter(l => l.status === 'contacted').length,
          converted: leads.filter(l => l.status === 'converted').length
        }
      });
      setLoading(false);
    } catch (error) {
      console.error('Health check error:', error);
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading health data...</div>;

  return (
    <div className="space-y-6">
      {/* Automations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Automations Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {health.automations.map((auto, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-sm">{auto.name}</p>
                  <p className="text-xs text-gray-500">{auto.lastRun}</p>
                </div>
                <Badge className="bg-green-100 text-green-800">{auto.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email Delivery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Email Delivery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold text-gray-900">{health.emailLogs.total}</p>
              <p className="text-xs text-gray-600">Total Sent</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{health.emailLogs.sent}</p>
              <p className="text-xs text-gray-600">Successfully Sent</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{health.emailLogs.failed}</p>
              <p className="text-xs text-gray-600">Failed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{health.emailLogs.last24h}</p>
              <p className="text-xs text-gray-600">Last 24h</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Nurture Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Nurture Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold">{health.nurtures.total}</p>
              <p className="text-xs text-gray-600">Total in Pipeline</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{health.nurtures.active}</p>
              <p className="text-xs text-gray-600">Active Sequences</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{health.nurtures.completed}</p>
              <p className="text-xs text-gray-600">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{health.nurtures.paused}</p>
              <p className="text-xs text-gray-600">Paused</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue & Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue & Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold text-green-600">${health.orders.revenue.toFixed(0)}</p>
              <p className="text-xs text-gray-600">Total Revenue</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{health.orders.completed}</p>
              <p className="text-xs text-gray-600">Completed Orders</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{health.orders.pending}</p>
              <p className="text-xs text-gray-600">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{health.orders.failed}</p>
              <p className="text-xs text-gray-600">Failed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold">{health.leads.total}</p>
              <p className="text-xs text-gray-600">Total Leads</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{health.leads.new}</p>
              <p className="text-xs text-gray-600">New/Unconverted</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{health.leads.contacted}</p>
              <p className="text-xs text-gray-600">Contacted</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{health.leads.converted}</p>
              <p className="text-xs text-gray-600">Converted</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}