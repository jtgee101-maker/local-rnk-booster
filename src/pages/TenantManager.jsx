import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, DollarSign, Activity } from 'lucide-react';

const colors = {
  brand: { DEFAULT: '#c8ff00', foreground: '#0a0a0f' }
};

export default function TenantManager() {
  const [stats, setStats] = useState({
    total_users: 0,
    total_leads: 0,
    total_orders: 0,
    total_revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [users, leads, orders] = await Promise.all([
        base44.entities.User.filter({}).catch(() => []),
        base44.entities.Lead.filter({}).catch(() => []),
        base44.entities.Order.filter({}).catch(() => [])
      ]);

      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

      setStats({
        total_users: users.length,
        total_leads: leads.length,
        total_orders: orders.length,
        total_revenue: totalRevenue
      });
    } catch (error) {
      console.error('Error loading tenant stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    { label: 'Total Users', value: stats.total_users, icon: Users, color: 'text-blue-400' },
    { label: 'Total Leads', value: stats.total_leads, icon: Building2, color: 'text-purple-400' },
    { label: 'Total Orders', value: stats.total_orders, icon: Activity, color: 'text-green-400' },
    { label: 'Total Revenue', value: `$${stats.total_revenue.toFixed(2)}`, icon: DollarSign, color: 'text-yellow-400' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-500/20">
            <Building2 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Tenant Management</h1>
            <p className="text-sm text-gray-400">LocalRank.ai Platform Overview</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="border-gray-800 bg-gray-900/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-800">
                    <metric.icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{metric.label}</p>
                    <p className="text-2xl font-bold text-white">{loading ? '...' : metric.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-gray-800 bg-gray-900/50">
          <CardHeader>
            <CardTitle className="text-white">Tenant Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div>
                <p className="text-sm text-gray-400">Tenant</p>
                <p className="text-white font-semibold">LocalRank.ai</p>
              </div>
              <Badge style={{backgroundColor: colors.brand.DEFAULT, color: colors.brand.foreground}}>
                Active
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Domain</p>
                <p className="text-white font-mono text-sm">localrank.ai</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Plan</p>
                <p className="text-white font-semibold">Enterprise</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}