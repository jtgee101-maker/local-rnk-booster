import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Mail, Shield, User, Activity } from 'lucide-react';

export default function UserManagement() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviteStatus, setInviteStatus] = useState('');
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('-created_date', 200)
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['user-activity-leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 1000)
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      await base44.users.inviteUser(email, role);
      return { email, role };
    },
    onSuccess: ({ email, role }) => {
      setInviteStatus(`Invitation sent to ${email} as ${role}`);
      setInviteEmail('');
      setTimeout(() => setInviteStatus(''), 5000);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      setInviteStatus(`Error: ${error.message}`);
      setTimeout(() => setInviteStatus(''), 5000);
    }
  });

  const handleInvite = () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setInviteStatus('Please enter a valid email');
      setTimeout(() => setInviteStatus(''), 3000);
      return;
    }
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  // Calculate user activity
  const getUserActivity = (userEmail) => {
    return leads.filter(l => l.created_by === userEmail).length;
  };

  return (
    <div className="space-y-6">
      {/* Invite User */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite New User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label className="text-gray-300">Email Address</Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleInvite()}
              />
            </div>
            <div>
              <Label className="text-gray-300">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <Button
              onClick={handleInvite}
              disabled={inviteMutation.isPending}
              className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black"
            >
              {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
            {inviteStatus && (
              <span className={`text-sm ${inviteStatus.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
                {inviteStatus}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-400">Name</TableHead>
                <TableHead className="text-gray-400">Email</TableHead>
                <TableHead className="text-gray-400">Role</TableHead>
                <TableHead className="text-gray-400">Activity</TableHead>
                <TableHead className="text-gray-400">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-gray-700">
                  <TableCell className="text-white font-medium">
                    <div className="flex items-center gap-2">
                      {user.role === 'admin' ? (
                        <Shield className="w-4 h-4 text-[#c8ff00]" />
                      ) : (
                        <User className="w-4 h-4 text-gray-400" />
                      )}
                      {user.full_name || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={user.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-400">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      {getUserActivity(user.email)} leads
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-400">
                    {new Date(user.created_date).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Activity Stats */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">User Activity Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Total Users</div>
              <div className="text-2xl font-bold text-white">{users.length}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Admin Users</div>
              <div className="text-2xl font-bold text-purple-400">
                {users.filter(u => u.role === 'admin').length}
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Regular Users</div>
              <div className="text-2xl font-bold text-blue-400">
                {users.filter(u => u.role === 'user').length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}