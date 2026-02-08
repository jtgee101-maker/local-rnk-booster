import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, X, CheckCircle, AlertTriangle, DollarSign, Mail, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState([]);

  const { data: notifications, refetch } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const [newLeads, newOrders, failedEmails, criticalErrors] = await Promise.all([
        base44.entities.Lead.list('-created_date', 5),
        base44.entities.Order.list('-created_date', 5),
        base44.entities.EmailLog.filter({ status: 'failed' }, '-created_date', 5),
        base44.entities.ErrorLog.filter({ severity: 'critical', resolved: false })
      ]);

      const now = Date.now();
      const fiveMinAgo = now - 5 * 60 * 1000;

      const items = [
        ...newLeads
          .filter(l => new Date(l.created_date) > fiveMinAgo)
          .map(l => ({
            id: `lead-${l.id}`,
            type: 'lead',
            title: 'New Lead Captured',
            message: `${l.business_name || l.email} just submitted`,
            timestamp: l.created_date,
            icon: Users,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/20'
          })),
        ...newOrders
          .filter(o => new Date(o.created_date) > fiveMinAgo)
          .map(o => ({
            id: `order-${o.id}`,
            type: 'order',
            title: 'New Order',
            message: `$${o.total_amount} order received`,
            timestamp: o.created_date,
            icon: DollarSign,
            color: 'text-green-400',
            bgColor: 'bg-green-500/20'
          })),
        ...failedEmails.map(e => ({
          id: `email-${e.id}`,
          type: 'email',
          title: 'Email Failed',
          message: `Failed to send to ${e.to}`,
          timestamp: e.created_date,
          icon: Mail,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20'
        })),
        ...criticalErrors.map(e => ({
          id: `error-${e.id}`,
          type: 'error',
          title: 'Critical Error',
          message: e.message,
          timestamp: e.created_date,
          icon: AlertTriangle,
          color: 'text-red-400',
          bgColor: 'bg-red-500/20'
        }))
      ];

      return items
        .filter(item => !dismissed.includes(item.id))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
    },
    refetchInterval: 30000 // Refresh every 30s
  });

  const unreadCount = notifications?.length || 0;

  const dismissNotification = (id) => {
    setDismissed([...dismissed, id]);
    refetch();
  };

  const markAllRead = () => {
    setDismissed(notifications.map(n => n.id));
    refetch();
    toast.success('All notifications cleared');
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-gray-800 border-gray-700 hover:bg-gray-700"
      >
        <Bell className="w-4 h-4 text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
            {unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute right-0 top-12 w-96 max-h-[500px] overflow-y-auto z-50 bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm">Notifications</CardTitle>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={markAllRead}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Clear All
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {notifications?.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm">All caught up!</div>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications?.map((notif) => {
                    const Icon = notif.icon;
                    return (
                      <div
                        key={notif.id}
                        className="p-3 hover:bg-gray-700/50 border-b border-gray-700 last:border-0 group"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 ${notif.bgColor} rounded-lg flex-shrink-0`}>
                            <Icon className={`w-4 h-4 ${notif.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-medium">{notif.title}</div>
                            <div className="text-gray-400 text-xs mt-0.5">{notif.message}</div>
                            <div className="text-gray-500 text-xs mt-1">
                              {new Date(notif.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => dismissNotification(notif.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}