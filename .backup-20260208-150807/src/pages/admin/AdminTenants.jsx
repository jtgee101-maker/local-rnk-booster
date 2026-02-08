import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/layouts/AdminLayout';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

// Icons
import {
  Search,
  Filter,
  MoreHorizontal,
  Building2,
  Users,
  Mail,
  MapPin,
  CreditCard,
  Activity,
  CheckCircle2,
  XCircle,
  PauseCircle,
  RefreshCw,
  ExternalLink,
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Status Badge Component
const StatusBadge = ({ status }) => {
  const configs = {
    active: {
      icon: CheckCircle2,
      className: 'bg-green-500/10 text-green-500 border-green-500/20',
      label: 'Active'
    },
    suspended: {
      icon: PauseCircle,
      className: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      label: 'Suspended'
    },
    pending: {
      icon: Activity,
      className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      label: 'Pending'
    },
    cancelled: {
      icon: XCircle,
      className: 'bg-red-500/10 text-red-500 border-red-500/20',
      label: 'Cancelled'
    }
  };

  const config = configs[status] || configs.pending;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`flex items-center gap-1 w-fit ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};

// Plan Badge Component
const PlanBadge = ({ plan }) => {
  const styles = {
    free: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    starter: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    professional: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    enterprise: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  };

  return (
    <Badge variant="outline" className={`capitalize ${styles[plan] || styles.starter}`}>
      {plan}
    </Badge>
  );
};

// Mock tenants data
const generateMockTenants = (count = 30) => {
  const statuses = ['active', 'suspended', 'pending', 'cancelled'];
  const plans = ['free', 'starter', 'professional', 'enterprise'];
  const industries = ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Education', 'Real Estate', 'Construction'];
  
  const companyNames = [
    'Acme Corporation', 'TechStart Inc', 'Global Solutions LLC', 'Digital Dynamics', 'Cloud Nine Services',
    'DataFlow Systems', 'SmartSystems Co', 'InnovateLabs', 'FutureTech Partners', 'Peak Performance',
    'Summit Enterprises', 'Horizon Digital', 'Pinnacle Solutions', 'Vertex Technologies', 'Apex Innovations',
    'Stellar Systems', 'Nova Digital', 'Quantum Leap', 'Synergy Works', 'Momentum Labs',
    'Catalyst Group', 'Blueprint Tech', 'Fusion Dynamics', 'Nexus Solutions', 'Helix Innovations',
    'Orbit Systems', 'Zenith Digital', 'Prism Technologies', 'Atlas Solutions', 'Echo Innovations'
  ];

  return companyNames.slice(0, count).map((name, i) => ({
    id: `tenant-${i + 1}`,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    plan: plans[Math.floor(Math.random() * plans.length)],
    industry: industries[Math.floor(Math.random() * industries.length)],
    createdAt: new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    users: Math.floor(Math.random() * 50) + 1,
    monthlyRevenue: Math.floor(Math.random() * 5000) + 99,
    mrr: Math.floor(Math.random() * 5000) + 99,
    domain: `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.localrnk.com`,
    customDomain: Math.random() > 0.7 ? `app.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : null,
    owner: {
      name: `Owner ${i + 1}`,
      email: `owner${i + 1}@example.com`
    },
    location: {
      city: ['New York', 'San Francisco', 'Austin', 'Chicago', 'Seattle', 'Denver', 'Boston', 'Miami'][Math.floor(Math.random() * 8)],
      country: 'USA'
    },
    usage: {
      storage: Math.floor(Math.random() * 100),
      apiCalls: Math.floor(Math.random() * 1000000),
      bandwidth: Math.floor(Math.random() * 500)
    }
  }));
};

// Tenant Details Modal
const TenantDetailsModal = ({ tenant, isOpen, onClose, onUpdateStatus }) => {
  if (!tenant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 bg-slate-100">
                <AvatarFallback className="text-lg font-bold text-slate-600">
                  {tenant.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl">{tenant.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={tenant.status} />
                  <PlanBadge plan={tenant.plan} />
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">Owner Email</span>
                  </div>
                  <p className="font-medium">{tenant.owner.email}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Team Size</span>
                  </div>
                  <p className="font-medium">{tenant.users} users</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">Location</span>
                  </div>
                  <p className="font-medium">{tenant.location.city}, {tenant.location.country}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Building2 className="w-4 h-4" />
                    <span className="text-sm">Industry</span>
                  </div>
                  <p className="font-medium">{tenant.industry}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Domain Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Subdomain</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-slate-100 px-2 py-1 rounded text-sm">{tenant.domain}</code>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {tenant.customDomain && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Custom Domain</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-slate-100 px-2 py-1 rounded text-sm">{tenant.customDomain}</code>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Created: {new Date(tenant.createdAt).toLocaleDateString()}</span>
              <span>Last Updated: {new Date(tenant.updatedAt).toLocaleDateString()}</span>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly recurring revenue and payment history</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold">${tenant.mrr}</p>
                    <p className="text-sm text-slate-500">MRR</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold">${tenant.monthlyRevenue}</p>
                    <p className="text-sm text-slate-500">This Month</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold">${tenant.mrr * 12}</p>
                    <p className="text-sm text-slate-500">ARR</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Storage</span>
                    <span className="text-sm font-medium">{tenant.usage.storage}%</span>
                  </div>
                  <Progress value={tenant.usage.storage} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">API Calls</span>
                    <span className="text-sm font-medium">{tenant.usage.apiCalls.toLocaleString()}</span>
                  </div>
                  <Progress value={Math.min(tenant.usage.apiCalls / 10000, 100)} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Bandwidth</span>
                    <span className="text-sm font-medium">{tenant.usage.bandwidth} GB</span>
                  </div>
                  <Progress value={Math.min(tenant.usage.bandwidth / 5, 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => onUpdateStatus(tenant.id, 'active')}
                  disabled={tenant.status === 'active'}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Activate Tenant
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => onUpdateStatus(tenant.id, 'suspended')}
                  disabled={tenant.status === 'suspended'}
                >
                  <PauseCircle className="w-4 h-4 mr-2" />
                  Suspend Tenant
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-red-500 hover:text-red-600"
                  onClick={() => onUpdateStatus(tenant.id, 'cancelled')}
                  disabled={tenant.status === 'cancelled'}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Subscription
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button>
            <ExternalLink className="w-4 h-4 mr-2" />
            View Full Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function AdminTenants() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTenants, setSelectedTenants] = useState(new Set());
  const [viewingTenant, setViewingTenant] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState(null);

  // Fetch tenants
  const { data: tenants = [], isLoading, refetch } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      try {
        const result = await base44.functions.call('admin/listTenants');
        return result?.tenants || generateMockTenants(30);
      } catch (error) {
        return generateMockTenants(30);
      }
    }
  });

  // Update tenant status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return await base44.functions.call('admin/updateTenantStatus', { id, status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant status updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update tenant status: ' + error.message);
    }
  });

  // Delete tenant mutation
  const deleteTenantMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.functions.call('admin/deleteTenant', { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant deleted successfully');
      setIsDeleteDialogOpen(false);
      setTenantToDelete(null);
    },
    onError: (error) => {
      toast.error('Failed to delete tenant: ' + error.message);
    }
  });

  // Filter and sort tenants
  const filteredTenants = useMemo(() => {
    let result = [...tenants];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(tenant => 
        tenant.name.toLowerCase().includes(query) ||
        tenant.owner.email.toLowerCase().includes(query) ||
        tenant.domain.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(tenant => tenant.status === statusFilter);
    }

    // Plan filter
    if (planFilter !== 'all') {
      result = result.filter(tenant => tenant.plan === planFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'createdAt' || sortField === 'updatedAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else if (sortField === 'mrr') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      } else {
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return result;
  }, [tenants, searchQuery, statusFilter, planFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredTenants.length / pageSize);
  const paginatedTenants = filteredTenants.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Handle select all
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTenants(new Set(paginatedTenants.map(t => t.id)));
    } else {
      setSelectedTenants(new Set());
    }
  };

  // Handle select tenant
  const handleSelectTenant = (tenantId, checked) => {
    const newSelected = new Set(selectedTenants);
    if (checked) {
      newSelected.add(tenantId);
    } else {
      newSelected.delete(tenantId);
    }
    setSelectedTenants(newSelected);
  };

  // Handle delete
  const handleDelete = (tenant) => {
    setTenantToDelete(tenant);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (tenantToDelete) {
      deleteTenantMutation.mutate(tenantToDelete.id);
    }
  };

  // Handle status update
  const handleUpdateStatus = (tenantId, status) => {
    updateStatusMutation.mutate({ id: tenantId, status });
  };

  // Sort indicator
  const SortIndicator = ({ field }) => {
    if (sortField !== field) return <div className="w-4" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  // Calculate stats
  const stats = useMemo(() => ({
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    suspended: tenants.filter(t => t.status === 'suspended').length,
    totalMrr: tenants.reduce((sum, t) => sum + (t.status === 'active' ? t.mrr : 0), 0)
  }), [tenants]);

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tenant Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage customer tenants, subscriptions, and account status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Building2 className="w-4 h-4 mr-2" />
            Add Tenant
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Tenants</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Suspended</p>
                <p className="text-2xl font-bold text-amber-600">{stats.suspended}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                <PauseCircle className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total MRR</p>
                <p className="text-2xl font-bold">${stats.totalMrr.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, or domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={paginatedTenants.length > 0 && selectedTenants.size === paginatedTenants.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Tenant
                      <SortIndicator field="name" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => handleSort('plan')}
                  >
                    <div className="flex items-center gap-1">
                      Plan
                      <SortIndicator field="plan" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <SortIndicator field="status" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => handleSort('users')}
                  >
                    <div className="flex items-center gap-1">
                      Users
                      <SortIndicator field="users" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => handleSort('mrr')}
                  >
                    <div className="flex items-center gap-1">
                      MRR
                      <SortIndicator field="mrr" />
                    </div>
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                    </TableCell>
                  </TableRow>
                ) : paginatedTenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No tenants found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTenants.map((tenant) => (
                    <TableRow key={tenant.id} className={selectedTenants.has(tenant.id) ? 'bg-slate-50 dark:bg-slate-800/50' : ''}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedTenants.has(tenant.id)}
                          onCheckedChange={(checked) => handleSelectTenant(tenant.id, checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 bg-slate-100">
                            <AvatarFallback className="text-sm font-bold text-slate-600">
                              {tenant.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{tenant.name}</p>
                            <p className="text-xs text-slate-500">{tenant.owner.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <PlanBadge plan={tenant.plan} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={tenant.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="text-sm">{tenant.users}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">${tenant.mrr}</span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setViewingTenant(tenant)}>
                              <Building2 className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Open Dashboard
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {tenant.status !== 'active' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(tenant.id, 'active')}>
                                <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            {tenant.status !== 'suspended' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(tenant.id, 'suspended')}>
                                <PauseCircle className="w-4 h-4 mr-2 text-amber-500" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              className="text-red-500"
                              onClick={() => handleDelete(tenant)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredTenants.length)} of {filteredTenants.length} tenants
              </span>
              <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-slate-500">per page</span>
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={currentPage === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      {/* Tenant Details Modal */}
      <TenantDetailsModal
        tenant={viewingTenant}
        isOpen={!!viewingTenant}
        onClose={() => setViewingTenant(null)}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tenant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{tenantToDelete?.name}</strong> and all associated data including users, settings, and history. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTenantToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteTenantMutation.isPending ? 'Deleting...' : 'Delete Tenant'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
