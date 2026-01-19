import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, TrendingUp, AlertCircle, Mail, Zap } from 'lucide-react';

export default function AdminMetrics() {
  const { data: leads = [] } = useQuery({
    queryKey: ['admin-leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 100),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 100),
  });

  const { data: emailLogs = [] } = useQuery({
    queryKey: ['admin-emails'],
    queryFn: () => base44.entities.EmailLog.list('-created_date', 100),
  });

  const { data: nurtures = [] } = useQuery({
    queryKey: ['admin-nurtures'],
    queryFn: () => base44.entities.LeadNurture.filter({ status: 'active' }, '-created_date', 50),
  });

  const metrics = [
    {
      title: 'Total Leads',
      value: leads.length,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'Total Revenue',
      value: `$${orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total_amount || 0), 0).toFixed(0)}`,
      icon: DollarSign,
      color: 'text-green-400',
      bg: 'bg-green-500/10'
    },
    {
      title: 'Conversion Rate',
      value: `${leads.length > 0 ? ((orders.filter(o => o.status === 'completed').length / leads.length) * 100).toFixed(1) : 0}%`,
      icon: TrendingUp,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10'
    },
    {
      title: 'Active Nurtures',
      value: nurtures.filter(n => n.status === 'active').length,
      icon: Zap,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10'
    },
    {
      title: 'Emails Sent (24h)',
      value: emailLogs.filter(e => new Date(e.created_date) > new Date(Date.now() - 86400000)).length,
      icon: Mail,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10'
    },
    {
      title: 'Email Failures',
      value: emailLogs.filter(e => e.status === 'failed').length,
      icon: AlertCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
        return (
          <Card key={idx} className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">{metric.title}</p>
                  <p className="text-xl font-bold text-white">{metric.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${metric.bg}`}>
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}