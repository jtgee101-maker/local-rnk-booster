import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, DollarSign, TrendingUp, Download, Search, RefreshCw, UserCog, Mail, Bug, Repeat, Radio, MapPin, Shield, Activity } from 'lucide-react';
import UserManagement from '@/components/admin/UserManagement';
import EmailTracking from '@/components/admin/EmailTracking';
import ErrorMonitoring from '@/components/admin/ErrorMonitoring';
import LeadNurture from '@/components/admin/LeadNurture';
import FunnelModeControl from '@/components/admin/FunnelModeControl';
import LocationContentManager from '@/components/admin/LocationContentManager';
import SuperAdminControls from '@/components/admin/SuperAdminControls';
import RealTimeAnalytics from '@/components/admin/RealTimeAnalytics';

export default function AdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [refundingOrderId, setRefundingOrderId] = useState(null);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 500)
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500)
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const response = await base44.functions.invoke('admin/getAnalytics', {});
      return response.data;
    },
    refetchInterval: 30000 // Refresh every 30s
  });

  // Export functions
  const handleExportLeads = async () => {
    const response = await base44.functions.invoke('admin/exportLeads', {});
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const handleExportOrders = async () => {
    const response = await base44.functions.invoke('admin/exportOrders', {});
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const refundMutation = useMutation({
    mutationFn: async (orderId) => {
      const response = await base44.functions.invoke('admin/processRefund', { orderId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setRefundingOrderId(null);
    }
  });

  // Calculate metrics
  const totalLeads = leads.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const conversionRate = totalLeads > 0 ? ((completedOrders / totalLeads) * 100).toFixed(1) : 0;
  const avgOrderValue = completedOrders > 0 ? (totalRevenue / completedOrders).toFixed(2) : 0;

  // Filter data
  const filteredLeads = leads.filter(lead => 
    !searchTerm || 
    lead.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = orders.filter(order =>
    !searchTerm ||
    order.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScoreBadge = (score) => {
    if (score >= 70) return <Badge className="bg-green-500">Good</Badge>;
    if (score >= 50) return <Badge className="bg-yellow-500">Fair</Badge>;
    return <Badge className="bg-red-500">Poor</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Monitor leads, conversions, and revenue</p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4 mb-6">
          <Button onClick={() => queryClient.invalidateQueries()} variant="outline" className="gap-2 min-h-[44px] touch-manipulation">
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </Button>
          <Button onClick={handleExportLeads} variant="outline" className="gap-2 min-h-[44px] touch-manipulation">
            <Download className="w-4 h-4" />
            Export Leads
          </Button>
          <Button onClick={handleExportOrders} variant="outline" className="gap-2 min-h-[44px] touch-manipulation">
            <Download className="w-4 h-4" />
            Export Orders
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Leads</CardTitle>
              <Users className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalLeads}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Conversion Rate</CardTitle>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{conversionRate}%</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Avg Order Value</CardTitle>
              <DollarSign className="w-4 h-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${avgOrderValue}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search leads or orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="funnel" className="space-y-4">
          <TabsList className="bg-gray-800 border-gray-700 flex-wrap">
            <TabsTrigger value="live" className="data-[state=active]:bg-gray-700">
              <Activity className="w-4 h-4 mr-2" />
              Live
            </TabsTrigger>
            <TabsTrigger value="funnel" className="data-[state=active]:bg-gray-700">
              <Radio className="w-4 h-4 mr-2" />
              Funnel
            </TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-gray-700">
              Leads ({filteredLeads.length})
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-gray-700">
              Orders ({filteredOrders.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-gray-700">
              <UserCog className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="emails" className="data-[state=active]:bg-gray-700">
              <Mail className="w-4 h-4 mr-2" />
              Emails
            </TabsTrigger>
            <TabsTrigger value="errors" className="data-[state=active]:bg-gray-700">
              <Bug className="w-4 h-4 mr-2" />
              Errors
            </TabsTrigger>
            <TabsTrigger value="nurture" className="data-[state=active]:bg-gray-700">
              <Repeat className="w-4 h-4 mr-2" />
              Nurture
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-gray-700">
              <MapPin className="w-4 h-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="super" className="data-[state=active]:bg-gray-700">
              <Shield className="w-4 h-4 mr-2" />
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live">
            <RealTimeAnalytics />
          </TabsContent>

          <TabsContent value="funnel">
            <FunnelModeControl />
          </TabsContent>

          <TabsContent value="leads">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-400">Business</TableHead>
                      <TableHead className="text-gray-400">Email</TableHead>
                      <TableHead className="text-gray-400">Category</TableHead>
                      <TableHead className="text-gray-400">Score</TableHead>
                      <TableHead className="text-gray-400">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.slice(0, 50).map((lead) => (
                      <TableRow key={lead.id} className="border-gray-700 cursor-pointer hover:bg-gray-700/50" onClick={() => setSelectedLeadId(lead.id)}>
                        <TableCell className="text-white font-medium">{lead.business_name || 'N/A'}</TableCell>
                        <TableCell className="text-gray-300">{lead.email}</TableCell>
                        <TableCell className="text-gray-400">{lead.business_category?.replace(/_/g, ' ')}</TableCell>
                        <TableCell>{getScoreBadge(lead.health_score)}</TableCell>
                        <TableCell className="text-gray-400">{new Date(lead.created_date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-400">Email</TableHead>
                      <TableHead className="text-gray-400">Product</TableHead>
                      <TableHead className="text-gray-400">Amount</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Date</TableHead>
                      <TableHead className="text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.slice(0, 50).map((order) => (
                      <TableRow key={order.id} className="border-gray-700">
                        <TableCell className="text-gray-300">{order.email}</TableCell>
                        <TableCell className="text-white">{order.base_offer?.product || order.upsells?.[0]?.product || 'N/A'}</TableCell>
                        <TableCell className="text-green-400 font-bold">${order.total_amount}</TableCell>
                        <TableCell>
                          <Badge className={
                            order.status === 'completed' ? 'bg-green-500' : 
                            order.status === 'refunded' ? 'bg-red-500' : 
                            'bg-yellow-500'
                          }>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400">{new Date(order.created_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {order.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm('Are you sure you want to refund this order?')) {
                                  setRefundingOrderId(order.id);
                                  refundMutation.mutate(order.id);
                                }
                              }}
                              disabled={refundingOrderId === order.id}
                              className="min-h-[36px] touch-manipulation"
                            >
                              {refundingOrderId === order.id ? 'Processing...' : 'Refund'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid gap-6">
              {/* Today's Stats */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Today's Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-gray-400 text-sm mb-1">Leads</div>
                      <div className="text-2xl font-bold text-white">{analytics?.today?.leads || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm mb-1">Orders</div>
                      <div className="text-2xl font-bold text-white">{analytics?.today?.orders || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm mb-1">Revenue</div>
                      <div className="text-2xl font-bold text-green-400">${analytics?.today?.revenue || 0}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* A/B Test Results */}
              {analytics?.abTests && analytics.abTests.length > 0 && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">A/B Test Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {analytics.abTests.map((test) => (
                        <div key={test.testId} className="border-b border-gray-700 pb-4 last:border-0">
                          <div className="mb-3">
                            <h4 className="text-white font-semibold">{test.testName}</h4>
                            <div className="text-sm text-gray-400">{test.page} - {test.element}</div>
                          </div>
                          <div className="grid md:grid-cols-3 gap-4">
                            {Object.entries(test.variants).map(([variantId, stats]) => (
                              <div key={variantId} className="bg-gray-900 rounded-lg p-4">
                                <div className="text-gray-300 font-medium mb-2">{stats.name}</div>
                                <div className="text-sm text-gray-400 space-y-1">
                                  <div>Views: {stats.views}</div>
                                  <div>Conversions: {stats.conversions}</div>
                                  <div className="text-[#c8ff00] font-bold">CR: {stats.conversionRate}%</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Revenue Chart Data */}
              {analytics?.revenueByDay && Object.keys(analytics.revenueByDay).length > 0 && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Revenue Last 30 Days</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(analytics.revenueByDay)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .slice(0, 10)
                        .map(([date, revenue]) => (
                          <div key={date} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                            <span className="text-gray-400">{new Date(date).toLocaleDateString()}</span>
                            <span className="text-green-400 font-bold">${revenue.toFixed(2)}</span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="emails">
            <EmailTracking />
          </TabsContent>

          <TabsContent value="errors">
            <ErrorMonitoring />
          </TabsContent>

          <TabsContent value="nurture">
            <LeadNurture />
          </TabsContent>

          <TabsContent value="content">
            {selectedLeadId ? (
              <div>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedLeadId(null)}
                  className="mb-4"
                >
                  ← Back to Leads
                </Button>
                <LocationContentManager leadId={selectedLeadId} />
              </div>
            ) : (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Location-Specific Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">Select a lead from the Leads tab to view their location-specific content.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="super">
            <SuperAdminControls />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}