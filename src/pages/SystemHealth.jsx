import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, CheckCircle, AlertCircle, XCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const colors = {
  brand: { DEFAULT: '#c8ff00', foreground: '#0a0a0f' }
};

export default function SystemHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const response = await base44.functions.invoke('admin/getSystemStatus', {});
      setHealth(response.data);
    } catch (error) {
      console.error('Error checking system health:', error);
      setHealth({
        health: { status: 'critical', score: 0 },
        metrics: {},
        error: error.message
      });
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'critical': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-gray-400">Checking system health...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-500/20">
              <Activity className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">System Health</h1>
              <p className="text-sm text-gray-400">Real-time platform monitoring</p>
            </div>
          </div>
          <Button
            onClick={checkHealth}
            disabled={checking}
            variant="outline"
            className="border-gray-700 text-gray-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Overall Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`border ${getStatusColor(health?.health?.status)} bg-gray-900/50`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(health?.health?.status)}
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      System Status: {health?.health?.status?.toUpperCase()}
                    </h2>
                    <p className="text-sm text-gray-400">Health Score: {health?.health?.score}/100</p>
                  </div>
                </div>
                <Badge 
                  className={getStatusColor(health?.health?.status)}
                  style={health?.health?.status === 'healthy' ? {backgroundColor: colors.brand.DEFAULT, color: colors.brand.foreground, border: 'none'} : {}}
                >
                  {health?.health?.status === 'healthy' ? 'All Systems Operational' : 'Issues Detected'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Leads', value: health?.metrics?.total_leads || 0, color: 'text-blue-400' },
            { label: 'Total Orders', value: health?.metrics?.total_orders || 0, color: 'text-green-400' },
            { label: 'Unresolved Errors', value: health?.metrics?.unresolved_errors || 0, color: 'text-red-400' },
            { label: 'Failed Emails', value: health?.metrics?.failed_emails || 0, color: 'text-orange-400' }
          ].map((metric) => (
            <Card key={metric.label} className="border-gray-800 bg-gray-900/50">
              <CardContent className="p-4">
                <p className="text-sm text-gray-400 mb-1">{metric.label}</p>
                <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card className="border-gray-800 bg-gray-900/50">
          <CardHeader>
            <CardTitle className="text-white">Last 24 Hours</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">New Leads</span>
                <span className="text-white font-bold text-xl">{health?.metrics?.recent_leads_24h || 0}</span>
              </div>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">New Orders</span>
                <span className="text-white font-bold text-xl">{health?.metrics?.recent_orders_24h || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Automations */}
        <Card className="border-gray-800 bg-gray-900/50">
          <CardHeader>
            <CardTitle className="text-white">Active Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-300">Email Automations</span>
              <Badge style={{backgroundColor: colors.brand.DEFAULT, color: colors.brand.foreground}}>
                {health?.metrics?.active_automations || 0} Active
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-300">GeeNius Workflow</span>
              <Badge style={{backgroundColor: colors.brand.DEFAULT, color: colors.brand.foreground}}>
                Running
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-300">Lead Scoring Engine</span>
              <Badge style={{backgroundColor: colors.brand.DEFAULT, color: colors.brand.foreground}}>
                Operational
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}