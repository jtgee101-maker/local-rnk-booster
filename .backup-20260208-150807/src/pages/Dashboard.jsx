import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Users, DollarSign, TrendingUp, MapPin, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import GMBHealthCard from '@/components/dashboard/GMBHealthCard';
import CriticalIssuesCard from '@/components/dashboard/CriticalIssuesCard';

export default function DashboardPage() {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth error:', error);
      }
    };
    checkAuth();
  }, []);

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date'),
    enabled: !!user
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
    enabled: !!user
  });

  const stats = {
    totalLeads: leads.length,
    totalOrders: orders.length,
    revenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    conversionRate: leads.length > 0 ? ((orders.length / leads.length) * 100).toFixed(1) : 0
  };

  const categoryColors = {
    home_services: 'bg-blue-100 text-blue-800',
    medical: 'bg-green-100 text-green-800',
    retail: 'bg-purple-100 text-purple-800',
    professional: 'bg-orange-100 text-orange-800',
    other: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor your GMB audit funnel performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Leads</CardTitle>
                <Users className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLeads}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Orders</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.revenue.toFixed(2)}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.conversionRate}%</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Latest Lead Details */}
        {leads.length > 0 && leads[0].health_score && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Latest Lead: {leads[0].business_name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GMBHealthCard lead={leads[0]} />
              <CriticalIssuesCard issues={leads[0].critical_issues} />
            </div>
          </div>
        )}

        {/* Recent Leads Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>All Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>GMB Score</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Reviews</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">No leads yet</TableCell>
                  </TableRow>
                ) : (
                  leads.slice(0, 10).map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{lead.business_name || '-'}</div>
                          <div className="text-xs text-gray-500">{lead.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.address ? (
                          <div className="flex items-start gap-2 max-w-xs">
                            <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-gray-600">{lead.address}</span>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={categoryColors[lead.business_category] || 'bg-gray-100'}>
                          {lead.business_category?.replace(/_/g, ' ') || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lead.health_score ? (
                          <span className={`font-semibold ${
                            lead.health_score >= 70 ? 'text-green-600' : 
                            lead.health_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {lead.health_score}/100
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {lead.gmb_rating ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-medium">{lead.gmb_rating.toFixed(1)}</span>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {lead.gmb_reviews_count !== undefined ? (
                          <span className="text-sm">{lead.gmb_reviews_count}</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-gray-500">
                          {format(new Date(lead.created_date), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">No orders yet</TableCell>
                  </TableRow>
                ) : (
                  orders.slice(0, 10).map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.email}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        ${order.total_amount?.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {format(new Date(order.created_date), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}