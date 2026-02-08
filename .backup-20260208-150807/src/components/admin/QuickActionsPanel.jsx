import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { UserPlus, Mail, Zap, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function QuickActionsPanel() {
  const [inviteDialog, setInviteDialog] = useState(false);
  const [broadcastDialog, setBroadcastDialog] = useState(false);
  const [automationDialog, setAutomationDialog] = useState(false);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInviteUser = async () => {
    if (!inviteEmail) {
      toast.error('Email is required');
      return;
    }
    setLoading(true);
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteDialog(false);
      setInviteEmail('');
      setInviteRole('user');
    } catch (error) {
      toast.error('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastSubject || !broadcastBody) {
      toast.error('Subject and message are required');
      return;
    }
    setLoading(true);
    try {
      const leads = await base44.entities.Lead.list('', 1000);
      
      for (const lead of leads.slice(0, 10)) { // Limit for safety
        await base44.integrations.Core.SendEmail({
          to: lead.email,
          subject: broadcastSubject,
          body: broadcastBody
        });
      }
      
      toast.success(`Broadcast sent to ${Math.min(leads.length, 10)} recipients`);
      setBroadcastDialog(false);
      setBroadcastSubject('');
      setBroadcastBody('');
    } catch (error) {
      toast.error('Failed to send broadcast');
    } finally {
      setLoading(false);
    }
  };

  const exportAllData = async () => {
    setLoading(true);
    try {
      const [leads, orders] = await Promise.all([
        base44.entities.Lead.list('', 500),
        base44.entities.Order.list('', 500)
      ]);

      const csv = [
        'Type,ID,Email,Business,Status,Amount,Date',
        ...leads.map(l => `Lead,${l.id},${l.email},${l.business_name || 'N/A'},${l.status},,${l.created_date}`),
        ...orders.map(o => `Order,${o.id},${o.email},,${o.status},${o.total_amount},${o.created_date}`)
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      icon: UserPlus,
      label: 'Invite User',
      color: 'bg-blue-500/20 text-blue-400',
      action: () => setInviteDialog(true)
    },
    {
      icon: Mail,
      label: 'Broadcast Email',
      color: 'bg-green-500/20 text-green-400',
      action: () => setBroadcastDialog(true)
    },
    {
      icon: Download,
      label: 'Export Data',
      color: 'bg-purple-500/20 text-purple-400',
      action: exportAllData
    },
    {
      icon: RefreshCw,
      label: 'Sync All',
      color: 'bg-orange-500/20 text-orange-400',
      action: () => window.location.reload()
    }
  ];

  return (
    <>
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#c8ff00]" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <Button
                  key={i}
                  onClick={action.action}
                  disabled={loading}
                  className={`h-auto flex-col gap-2 p-4 ${action.color} border-0 hover:opacity-80`}
                  variant="outline"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="bg-gray-900 border-gray-700"
            />
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="bg-gray-900 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleInviteUser}
              disabled={loading}
              className="bg-[#c8ff00] text-black hover:bg-[#b8ef00]"
            >
              {loading ? 'Sending...' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Broadcast Dialog */}
      <Dialog open={broadcastDialog} onOpenChange={setBroadcastDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Broadcast Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Subject"
              value={broadcastSubject}
              onChange={(e) => setBroadcastSubject(e.target.value)}
              className="bg-gray-900 border-gray-700"
            />
            <Textarea
              placeholder="Message body"
              value={broadcastBody}
              onChange={(e) => setBroadcastBody(e.target.value)}
              className="bg-gray-900 border-gray-700 min-h-[120px]"
            />
            <div className="text-xs text-gray-400">
              Will send to first 10 leads for safety
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBroadcastDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBroadcast}
              disabled={loading}
              className="bg-[#c8ff00] text-black hover:bg-[#b8ef00]"
            >
              {loading ? 'Sending...' : 'Send Broadcast'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}