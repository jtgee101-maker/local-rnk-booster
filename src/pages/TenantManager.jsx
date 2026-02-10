import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { Globe, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TenantManager() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ leads: 0, orders: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser?.role !== 'admin') {
          window.location.href = '/QuizGeenius';
          return;
        }
        setUser(currentUser);
        loadStats();
      } catch (err) {
        window.location.href = '/QuizGeenius';
      }
    };
    checkAuth();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [leads, orders, users] = await Promise.all([
        base44.entities.Lead.list(),
        base44.entities.Order.list(),
        base44.entities.User.list()
      ]);
      setStats({ leads: leads.length, orders: orders.length, users: users.length });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#c8ff00] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Globe className="w-8 h-8 text-[#c8ff00]" />
            Tenant Manager
          </h1>
          <Button onClick={loadStats} className="bg-[#c8ff00] text-black">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-[#1a1a2e] border-gray-800">
            <CardHeader>
              <CardTitle>Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-[#c8ff00]">{stats.users}</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a2e] border-gray-800">
            <CardHeader>
              <CardTitle>Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-emerald-400">{stats.leads}</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a2e] border-gray-800">
            <CardHeader>
              <CardTitle>Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-400">{stats.orders}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}