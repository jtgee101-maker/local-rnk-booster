import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { Globe, Users, Activity, Database, RefreshCw, Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantManager() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuthAndLoadTenants();
  }, []);

  const checkAuthAndLoadTenants = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = '/';
        return;
      }
      setUser(currentUser);
      await loadTenants();
    } catch (error) {
      console.error('Auth error:', error);
      window.location.href = '/';
    }
  };

  const loadTenants = async () => {
    try {
      setLoading(true);
      
      const [leads, orders] = await Promise.all([
        base44.entities.Lead.list(),
        base44.entities.Order.list()
      ]);

      const mainTenant = {
        id: '1',
        name: 'LocalRank.ai',
        subdomain: 'app',
        custom_domain: 'localrank.ai',
        status: 'active',
        plan_id: 'enterprise',
        domain_verified: true,
        active_users: await base44.entities.User.list().then(u => u.length).catch(() => 1),
        total_leads: leads.length,
        total_orders: orders.length,
        health_status: 'healthy',
        created_date: new Date().toISOString(),
        last_activity: new Date().toISOString()
      };

      setTenants([mainTenant]);
    } catch (error) {
      console.error('Failed to load tenants:', error);
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const StatusBadge = ({ status }) => {
    const variants = {
      active: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle },
      pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: AlertCircle },
      suspended: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle },
    };
    
    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;
    
    return (
      <Badge className={`${variant.bg} ${variant.text} border-0 flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tenant.subdomain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: 'Total Tenants', value: tenants.length, color: '#c8ff00' },
    { label: 'Active', value: tenants.filter(t => t.status === 'active').length, color: '#10b981' },
    { label: 'Pending', value: tenants.filter(t => t.status === 'pending').length, color: '#f59e0b' },
    { label: 'Suspended', value: tenants.filter(t => t.status === 'suspended').length, color: '#ef4444' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#c8ff00] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Globe className="w-8 h-8 text-[#c8ff00]" />
              Tenant Manager
            </h1>
            <p className="text-gray-400 mt-2">Manage platform tenants and organizations</p>
          </div>
          <Button onClick={loadTenants} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, idx) => (
            <Card key={idx} className="bg-[#1a1a2e] border-gray-800">
              <CardContent className="p-4">
                <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-6 bg-[#1a1a2e] border-gray-800">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tenants..."
                  className="pl-10 bg-[#0a0a0f] border-gray-700 text-white"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'active', 'pending', 'suspended'].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className={statusFilter === status ? 'bg-[#c8ff00] text-black' : ''}
                  >
                    <span className="capitalize">{status}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTenants.map((tenant) => (
            <Card key={tenant.id} className="bg-[#1a1a2e] border-gray-800 hover:border-[#c8ff00]/30 transition-all">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#c8ff00]/20 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-[#c8ff00]" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tenant.name}</CardTitle>
                      <p className="text-sm text-gray-400">{tenant.subdomain}</p>
                    </div>
                  </div>
                  <StatusBadge status={tenant.status} />
                </div>
                
                {tenant.custom_domain && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0f] rounded-lg">
                    <Globe className="w-4 h-4 text-[#c8ff00]" />
                    <span className="text-sm text-gray-300">{tenant.custom_domain}</span>
                    {tenant.domain_verified && (
                      <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto" />
                    )}
                  </div>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-[#0a0a0f] rounded-lg p-3 text-center">
                    <Users className="w-4 h-4 text-[#c8ff00] mx-auto mb-1" />
                    <p className="text-lg font-bold text-white">{tenant.active_users}</p>
                    <p className="text-xs text-gray-500">Users</p>
                  </div>
                  <div className="bg-[#0a0a0f] rounded-lg p-3 text-center">
                    <Activity className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-white">{tenant.total_leads}</p>
                    <p className="text-xs text-gray-500">Leads</p>
                  </div>
                  <div className="bg-[#0a0a0f] rounded-lg p-3 text-center">
                    <Database className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-white">{tenant.total_orders}</p>
                    <p className="text-xs text-gray-500">Orders</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-gray-400">Healthy</span>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">{tenant.plan_id}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTenants.length === 0 && (
          <Card className="bg-[#1a1a2e] border-gray-800">
            <CardContent className="py-12 text-center">
              <Globe className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No tenants found</h3>
              <p className="text-gray-400">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}