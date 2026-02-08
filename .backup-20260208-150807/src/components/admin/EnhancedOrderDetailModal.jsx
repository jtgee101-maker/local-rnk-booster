import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import { Package, User, Mail, Calendar, 
  CheckCircle, XCircle, AlertCircle, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export default function EnhancedOrderDetailModal({ order, open, onClose, onUpdate }) {
  const [processing, setProcessing] = useState(false);

  if (!order) return null;

  const handleRefund = async () => {
    if (!confirm(`Process refund of $${order.total_amount}?`)) return;

    setProcessing(true);
    try {
      const response = await base44.functions.invoke('admin/processRefund', {
        order_id: order.id,
        amount: order.total_amount
      });

      if (response?.data?.success || response?.success) {
        toast.success('Refund processed successfully');
        onUpdate && onUpdate();
        onClose();
      } else {
        throw new Error(response?.data?.error || 'Refund failed');
      }
    } catch (error) {
      console.error('Refund failed:', error);
      toast.error('Refund failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
      case 'refunded': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'refunded': return <RefreshCw className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl mb-2">Order Details</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(order.status)}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1">{order.status}</span>
                </Badge>
                <span className="text-gray-400 text-sm">
                  {new Date(order.created_date).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#c8ff00]">
                ${order.total_amount}
              </div>
              <div className="text-xs text-gray-400">Total Amount</div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="items">Order Items</TabsTrigger>
            <TabsTrigger value="payment">Payment Details</TabsTrigger>
            <TabsTrigger value="customer">Customer Info</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm text-gray-400">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Order ID</div>
                    <div className="text-white font-mono text-sm">{order.id}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Created</div>
                    <div className="text-white">
                      {new Date(order.created_date).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Email</div>
                    <div className="text-white">{order.email}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Lead ID</div>
                    <div className="text-white font-mono text-sm">{order.lead_id || 'N/A'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {order.status === 'refunded' && (
              <Card className="bg-red-500/10 border-red-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-red-400 mb-2">
                    <RefreshCw className="w-4 h-4" />
                    <span className="font-semibold">Refunded</span>
                  </div>
                  {order.refund_amount && (
                    <div className="text-sm text-gray-300">
                      Amount: ${order.refund_amount}
                    </div>
                  )}
                  {order.refund_date && (
                    <div className="text-xs text-gray-400">
                      Date: {new Date(order.refund_date).toLocaleString()}
                    </div>
                  )}
                  {order.refund_id && (
                    <div className="text-xs text-gray-500 font-mono mt-1">
                      Refund ID: {order.refund_id}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Order Items Tab */}
          <TabsContent value="items" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm text-gray-400">Base Offer</CardTitle>
              </CardHeader>
              <CardContent>
                {order.base_offer && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="text-white font-medium">
                          {order.base_offer.product || 'GMB Optimization & Audit'}
                        </div>
                        <div className="text-xs text-gray-400">Base Product</div>
                      </div>
                    </div>
                    <div className="text-white font-bold">
                      ${order.base_offer.price || 99}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {order.order_bumps && order.order_bumps.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-400">Order Bumps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.order_bumps.map((bump, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-purple-400" />
                        <div>
                          <div className="text-white">{bump.product}</div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {bump.selected ? 'Selected' : 'Not selected'}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-white">${bump.price}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {order.upsells && order.upsells.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-400">Upsells</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.upsells.map((upsell, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-green-400" />
                        <div>
                          <div className="text-white">{upsell.product}</div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {upsell.accepted ? 'Accepted' : 'Declined'}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-white">${upsell.price}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between items-center p-4 bg-gray-800 border border-gray-700 rounded-lg">
              <span className="text-white font-semibold">Total</span>
              <span className="text-2xl font-bold text-[#c8ff00]">
                ${order.total_amount}
              </span>
            </div>
          </TabsContent>

          {/* Payment Details Tab */}
          <TabsContent value="payment" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm text-gray-400">Stripe Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.stripe_session_id && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Checkout Session ID</div>
                    <div className="text-white font-mono text-xs break-all">
                      {order.stripe_session_id}
                    </div>
                  </div>
                )}
                {order.stripe_payment_intent && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Payment Intent ID</div>
                    <div className="text-white font-mono text-xs break-all">
                      {order.stripe_payment_intent}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-500 mb-1">Payment Status</div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {order.status === 'completed' && !order.refund_id && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-400">Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleRefund}
                    disabled={processing}
                    variant="outline"
                    className="w-full text-red-400 hover:text-red-300 border-red-500/50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Process Refund
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Customer Info Tab */}
          <TabsContent value="customer" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm text-gray-400">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-white">{order.email}</span>
                </div>
                {order.lead_id && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-300 text-sm">
                      Lead ID: <span className="font-mono">{order.lead_id}</span>
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-300 text-sm">
                    Order Date: {new Date(order.created_date).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}