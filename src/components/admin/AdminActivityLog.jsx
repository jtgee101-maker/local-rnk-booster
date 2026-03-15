import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Activity, UserPlus, Mail, DollarSign } from 'lucide-react';

export default function AdminActivityLog() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: async () => {
      // Fetch recent admin actions from various entities
      const [leads, orders, emails] = await Promise.all([
        base44.entities.Lead.list('-created_date', 20),
        base44.entities.Order.list('-created_date', 20),
        base44.entities.EmailLog.list('-created_date', 20)
      ]);

      const actions = [
        ...leads.map(l => ({
          id: `lead-${l.id}`,
          type: 'lead_created',
          description: `New lead: ${l.business_name || l.email}`,
          timestamp: l.created_date,
          user: l.created_by || 'system',
          icon: UserPlus,
          color: 'text-blue-400'
        })),
        ...orders.map(o => ({
          id: `order-${o.id}`,
          type: 'order_created',
          description: `Order $${o.total_amount} from ${o.email}`,
          timestamp: o.created_date,
          user: 'system',
          icon: DollarSign,
          color: 'text-green-400'
        })),
        ...emails.map(e => ({
          id: `email-${e.id}`,
          type: e.status === 'failed' ? 'email_failed' : 'email_sent',
          description: `Email ${e.status}: ${e.subject}`,
          timestamp: e.created_date,
          user: 'system',
          icon: Mail,
          color: e.status === 'failed' ? 'text-red-400' : 'text-purple-400'
        }))
      ];

      return actions
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 30);
    },
    refetchInterval: 60000 // Refresh every minute
  });

  const getActionLabel = (type) => {
    const labels = {
      lead_created: 'Lead',
      order_created: 'Order',
      email_sent: 'Email',
      email_failed: 'Failed',
      user_invited: 'Invite',
      settings_changed: 'Settings'
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center text-gray-400">
          Loading activity...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#c8ff00]" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {activities?.map((activity) => {
            const Icon = activity.icon;
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                <div className="p-2 bg-gray-800 rounded-lg">
                  <Icon className={`w-4 h-4 ${activity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs text-gray-300 border-gray-600">
                      {getActionLabel(activity.type)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      by {activity.user}
                    </span>
                  </div>
                  <div className="text-white text-sm">{activity.description}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}