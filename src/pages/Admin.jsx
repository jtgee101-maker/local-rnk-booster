import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, DollarSign, TrendingUp, AlertCircle, Mail, Calendar } from 'lucide-react';

export default function AdminPage() {
  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 100)
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 100)
  });

  // Calculate metrics
  const totalLeads = leads.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const conversionRate = totalLeads > 0 ? ((completedOrders / totalLeads) * 100).toFixed(1) : 0;
  const avgOrderValue = completedOrders > 0 ? (totalRevenue / completedOrders).toFixed(2) : 0;

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

        {/* Tabs */}
        <Tabs defaultValue="leads" className="space-y-4">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="leads" className="data-[state=active]:bg-gray-700">Leads</TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-gray-700">Orders</TabsTrigger>
          </TabsList>

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
                    {leads.slice(0, 20).map((lead) => (
                      <TableRow key={lead.id} className="border-gray-700">
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.slice(0, 20).map((order) => (
                      <TableRow key={order.id} className="border-gray-700">
                        <TableCell className="text-gray-300">{order.email}</TableCell>
                        <TableCell className="text-white">{order.base_offer?.product || order.upsells?.[0]?.product || 'N/A'}</TableCell>
                        <TableCell className="text-green-400 font-bold">${order.total_amount}</TableCell>
                        <TableCell>
                          <Badge className={order.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400">{new Date(order.created_date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}