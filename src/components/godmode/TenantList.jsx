import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Globe, 
  Users, 
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  PauseCircle,
  Trash2,
  ExternalLink,
  Settings,
  TrendingUp,
  Database
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Status badge component with appropriate colors
const StatusBadge = ({ status }) => {
  const variants = {
    active: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle },
    pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: AlertCircle },
    suspended: { bg: 'bg-red-500/20', text: 'text-red-400', icon: PauseCircle },
    cancelled: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: XCircle },
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

// Health indicator component
const HealthIndicator = ({ status }) => {
  const colors = {
    healthy: 'bg-emerald-500',
    degraded: 'bg-amber-500',
    unhealthy: 'bg-red-500',
    unknown: 'bg-gray-500'
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${colors[status] || colors.unknown} animate-pulse`} />
      <span className="text-xs text-gray-400 capitalize">{status}</span>
    </div>
  );
};

// Tenant card component
const TenantCard = ({ tenant, onEdit, onDelete, onSuspend, onActivate }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 hover:border-[#00F2FF]/30 transition-all duration-300"
      style={{
        boxShadow: '0 4px 24px rgba(0, 242, 255, 0.05)'
      }}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00F2FF]/5 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00F2FF]/20 to-[#c8ff00]/20 flex items-center justify-center">
              <Globe className="w-6 h-6 text-[#00F2FF]" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">{tenant.name}</h3>
              <p className="text-sm text-gray-400">{tenant.subdomain}.localrnk.io</p>
            </div>
          </div>
          <StatusBadge status={tenant.status} />
        </div>
        
        {/* Domain info */}
        {tenant.custom_domain && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-gray-800/50 rounded-lg">
            <Globe className="w-4 h-4 text-[#c8ff00]" />
            <span className="text-sm text-gray-300">{tenant.custom_domain}</span>
            {tenant.domain_verified ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 ml-auto" />
            )}
          </div>
        )}
        
        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-900/50 rounded-xl p-3 text-center">
            <Users className="w-4 h-4 text-[#00F2FF] mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{tenant.active_users || 0}</p>
            <p className="text-xs text-gray-500">Users</p>
          </div>
          <div className="bg-gray-900/50 rounded-xl p-3 text-center">
            <Database className="w-4 h-4 text-[#c8ff00] mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{tenant.current_audits || 0}</p>
            <p className="text-xs text-gray-500">Audits</p>
          </div>
          <div className="bg-gray-900/50 rounded-xl p-3 text-center">
            <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{tenant.plan_id || 'starter'}</p>
            <p className="text-xs text-gray-500">Plan</p>
          </div>
        </div>
        
        {/* Health indicator */}
        <div className="flex items-center justify-between mb-4 pt-4 border-t border-gray-800/50">
          <HealthIndicator status={tenant.health_status || 'unknown'} />
          <span className="text-xs text-gray-500">
            Updated {tenant.last_check_at ? new Date(tenant.last_check_at).toLocaleDateString() : 'N/A'}
          </span>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#00F2FF] hover:text-[#00F2FF] hover:bg-[#00F2FF]/10"
            onClick={() => onEdit(tenant)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
              <DropdownMenuItem 
                className="text-gray-300 focus:text-white focus:bg-gray-800"
                onClick={() => window.open(`https://${tenant.subdomain}.localrnk.io`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Site
              </DropdownMenuItem>
              
              {tenant.status === 'active' ? (
                <DropdownMenuItem 
                  className="text-amber-400 focus:text-amber-400 focus:bg-gray-800"
                  onClick={() => onSuspend(tenant.id)}
                >
                  <PauseCircle className="w-4 h-4 mr-2" />
                  Suspend
                </DropdownMenuItem>
              ) : tenant.status === 'suspended' ? (
                <DropdownMenuItem 
                  className="text-emerald-400 focus:text-emerald-400 focus:bg-gray-800"
                  onClick={() => onActivate(tenant.id)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Activate
                </DropdownMenuItem>
              ) : null}
              
              <DropdownMenuSeparator className="bg-gray-800" />
              
              <DropdownMenuItem 
                className="text-red-400 focus:text-red-400 focus:bg-gray-800"
                onClick={() => onDelete(tenant.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
};

// Create tenant modal
const CreateTenantModal = ({ isOpen, onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    plan_id: 'starter'
  });
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await base44.entities.Tenant.create({
        ...formData,
        slug: formData.subdomain.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        status: 'active'
      });
      
      onCreated();
      onClose();
      setFormData({ name: '', subdomain: '', plan_id: 'starter' });
    } catch (error) {
      console.error('Error creating tenant:', error);
      alert('Failed to create tenant');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Tenant</DialogTitle>
          <DialogDescription className="text-gray-400">
            Set up a new white-label tenant for your client.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Tenant Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., ACME Corp"
              className="bg-gray-800 border-gray-700 text-white"
              required
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Subdomain</label>
            <div className="flex">
              <Input
                value={formData.subdomain}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') 
                }))}
                placeholder="acme-corp"
                className="bg-gray-800 border-gray-700 text-white rounded-r-none"
                required
              />
              <span className="bg-gray-800 border border-l-0 border-gray-700 text-gray-400 px-4 py-2 rounded-r-md flex items-center text-sm">
                .localrnk.io
              </span>
            </div>
          </div>
          
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Plan</label>
            <select
              value={formData.plan_id}
              onChange={(e) => setFormData(prev => ({ ...prev, plan_id: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2"
            >
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Tenant'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Main TenantList component
export default function TenantList() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Fetch tenants
  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await base44.entities.Tenant.list({
        sort: { field: 'created_at', direction: 'desc' }
      });
      
      // Enrich with health data
      const enrichedTenants = await Promise.all(
        response.map(async (tenant) => {
          try {
            const health = await base44.entities.TenantHealthCheck.filter(
              { tenant_id: tenant.id },
              { sort: { field: 'created_at', direction: 'desc' }, limit: 1 }
            );
            return { ...tenant, ...health[0] };
          } catch {
            return tenant;
          }
        })
      );
      
      setTenants(enrichedTenants);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTenants();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchTenants, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Filter tenants
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = 
      tenant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.subdomain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.custom_domain?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Actions
  const handleEdit = (tenant) => {
    // Navigate to tenant detail or open edit modal
    window.location.href = `/godmode/tenants/${tenant.id}`;
  };
  
  const handleSuspend = async (tenantId) => {
    if (!confirm('Are you sure you want to suspend this tenant?')) return;
    
    try {
      await base44.entities.Tenant.update(tenantId, { status: 'suspended' });
      fetchTenants();
    } catch (error) {
      console.error('Error suspending tenant:', error);
      alert('Failed to suspend tenant');
    }
  };
  
  const handleActivate = async (tenantId) => {
    try {
      await base44.entities.Tenant.update(tenantId, { status: 'active' });
      fetchTenants();
    } catch (error) {
      console.error('Error activating tenant:', error);
      alert('Failed to activate tenant');
    }
  };
  
  const handleDelete = async (tenantId) => {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) return;
    
    try {
      await base44.entities.Tenant.delete(tenantId);
      fetchTenants();
    } catch (error) {
      console.error('Error deleting tenant:', error);
      alert('Failed to delete tenant');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Tenants</h1>
          <p className="text-gray-400 mt-1">Manage your white-label tenants</p>
        </div>
        
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Tenant
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tenants..."
            className="pl-10 bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500"
          />
        </div>
        
        <div className="flex gap-2">
          {['all', 'active', 'pending', 'suspended'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={statusFilter === status 
                ? 'bg-[#00F2FF]/20 text-[#00F2FF] border-[#00F2FF]/50' 
                : 'border-gray-700 text-gray-400 hover:text-white'
              }
            >
              <span className="capitalize">{status}</span>
            </Button>
          ))}
        </div>
      </div>
      
      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tenants', value: tenants.length, color: '#00F2FF' },
          { label: 'Active', value: tenants.filter(t => t.status === 'active').length, color: '#10b981' },
          { label: 'Pending', value: tenants.filter(t => t.status === 'pending').length, color: '#f59e0b' },
          { label: 'Suspended', value: tenants.filter(t => t.status === 'suspended').length, color: '#ef4444' },
        ].map((stat) => (
          <div 
            key={stat.label}
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-4"
          >
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>
      
      {/* Tenants grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#00F2FF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="text-center py-16 bg-gray-900/30 border border-gray-800/50 rounded-2xl">
          <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No tenants found</h3>
          <p className="text-gray-400 mb-6">Get started by creating your first tenant</p>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Tenant
          </Button>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredTenants.map((tenant) => (
              <TenantCard
                key={tenant.id}
                tenant={tenant}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSuspend={handleSuspend}
                onActivate={handleActivate}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
      
      {/* Create modal */}
      <CreateTenantModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={fetchTenants}
      />
    </div>
  );
}
