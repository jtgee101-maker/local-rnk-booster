import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminOrdersSection({ expanded = false }) {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders-section'],
    queryFn: () => base44.entities.Order.list('-created_date', expanded ? 200 : 50),
  });

  const refundMutation = useMutation({
    mutationFn: async (orderId) => {
      const response = await base44.functions.invoke('admin/processRefund', { orderId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders-section'] });
      toast.success('Refund processed');
    }
  });

  const handleExport = () => {
    const csv = [
      ['Email', 'Amount', 'Status', 'Created'].join(','),
      ...orders.map(o => [
        o.email,
        o.total_amount,
        o.status,
        new Date(o.created_date).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700 col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Orders {expanded && `(${orders.length})`}</CardTitle>
        <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-400">Email</TableHead>
                <TableHead className="text-gray-400">Amount</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Created</TableHead>
                {expanded && <TableHead className="text-gray-400">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={expanded ? 5 : 4} className="text-center text-gray-500">Loading...</TableCell>
                </TableRow>
              ) : orders.slice(0, expanded ? 50 : 10).map((order) => (
                <TableRow key={order.id} className="border-gray-700">
                  <TableCell className="text-gray-400 text-sm">{order.email}</TableCell>
                  <TableCell className="text-green-400 font-bold">${order.total_amount?.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={
                      order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      order.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-400 text-sm">
                    {new Date(order.created_date).toLocaleDateString()}
                  </TableCell>
                  {expanded && (
                    <TableCell>
                      {order.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm('Refund this order?')) {
                              refundMutation.mutate(order.id);
                            }
                          }}
                          disabled={refundMutation.isPending}
                        >
                          Refund
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}