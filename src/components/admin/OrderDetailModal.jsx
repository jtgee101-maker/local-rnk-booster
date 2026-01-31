import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { 
  DollarSign, Mail, Calendar, CreditCard, Package, 
  AlertCircle, CheckCircle2, Loader2, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export default function OrderDetailModal({ order, open, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);

  if (!order) return null;

  const handleRefund = async () => {
    if (!confirm(`Refund $${order.total_amount?.toFixed(2)} to ${order.email}?`)) {
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('admin/processRefund', { orderId: order.id });
      toast.success('Refund processed successfully');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Refund failed:', error);
      toast.error('Refund failed: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'refunded': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const totalAmount = order.total_amount || 0;
  const baseOffer = order.base_offer || {};
  const orderBumps = order.order_bumps || [];
  const upsells = order.upsells || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl flex items-center gap-3 mb-2">
                <DollarSign className="w-6 h-6 text-green-400" />
                Order Details
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Order ID:</span>
                <code className="text-gray-300 bg-gray-800 px-2 py-0.5 rounded text-xs">
                  {order.id.slice(0, 8)}...
                </code>
              </div>
            </div>
            <Badge className={`${getStatusColor(order.status)} border px-3 py-1`}>
              {order.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Customer Info */}
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Customer Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">{order.email}</span>
              </div>
              {order.lead_id && (
                <div className="text-xs text-gray-500">
                  Lead ID: {order.lead_id}
                </div>
              )}
            </div>
          </div>

          {/* Order Breakdown */}
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Order Breakdown</h3>
            
            {/* Base Offer */}
            {baseOffer.product && (
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">{baseOffer.product}</span>
                </div>
                <span className="text-white font-semibold">${baseOffer.price?.toFixed(2) || '0.00'}</span>
              </div>
            )}

            {/* Order Bumps */}
            {orderBumps.filter(b => b.selected).map((bump, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">{bump.product}</span>
                  <Badge variant="outline" className="text-xs border-gray-600">Bump</Badge>
                </div>
                <span className="text-white font-semibold">${bump.price?.toFixed(2) || '0.00'}</span>
              </div>
            ))}

            {/* Upsells */}
            {upsells.filter(u => u.accepted).map((upsell, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300">{upsell.product}</span>
                  <Badge variant="outline" className="text-xs border-gray-600">Upsell</Badge>
                </div>
                <span className="text-white font-semibold">${upsell.price?.toFixed(2) || '0.00'}</span>
              </div>
            ))}

            {/* Total */}
            <div className="flex items-center justify-between py-3 mt-2">
              <span className="text-lg font-semibold text-white">Total</span>
              <span className="text-2xl font-bold text-green-400">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Information */}
          {order.stripe_session_id && (
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Payment Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">Payment Method</span>
                  </div>
                  <span className="text-gray-300">Stripe</span>
                </div>
                
                {order.stripe_session_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Session ID</span>
                    <code className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded">
                      {order.stripe_session_id.slice(0, 20)}...
                    </code>
                  </div>
                )}
                
                {order.stripe_payment_intent && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Payment Intent</span>
                    <code className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded">
                      {order.stripe_payment_intent.slice(0, 20)}...
                    </code>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Refund Information */}
          {order.status === 'refunded' && order.refund_id && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h3 className="text-sm font-semibold text-red-400">Refund Processed</h3>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Refund Amount</span>
                  <span className="text-white font-semibold">${order.refund_amount?.toFixed(2) || totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Refund Date</span>
                  <span className="text-gray-300">{new Date(order.refund_date).toLocaleDateString()}</span>
                </div>
                {order.refund_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Refund ID</span>
                    <code className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded">
                      {order.refund_id.slice(0, 20)}...
                    </code>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-400">Order Created</div>
                  <div className="text-gray-300">{new Date(order.created_date).toLocaleString()}</div>
                </div>
              </div>
              {order.updated_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-400">Last Updated</div>
                    <div className="text-gray-300">{new Date(order.updated_date).toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {order.status === 'completed' && (
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
              <Button
                onClick={handleRefund}
                disabled={loading}
                variant="destructive"
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Process Refund
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}