import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, ComposedChart, Legend, Line, Bar
} from 'recharts';
import {
  Building2, Key, Settings, Shield, Plus, MoreHorizontal, CheckCircle2,
  Clock, TrendingUp, Phone, Mail, Copy, RefreshCw, Trash2, Edit3,
  Eye, Upload, Code, Database, FileJson, Lock, Unlock, UserPlus, UserMinus,
  Crown, Zap, Activity, BarChart3, Store, Briefcase, HelpCircle,
  MessageSquare, ExternalLink, Star, Target, ArrowUpRight, Search, X
} from 'lucide-react';

const locationsData = [
  { id: 1, name: 'Downtown Store', address: '123 Main St, New York, NY', phone: '(555) 123-4567', status: 'active', rating: 4.8, reviews: 234, visibility: 89, keywords: 45, manager: 'John Smith', lastUpdated: '2024-01-20' },
  { id: 2, name: 'Uptown Branch', address: '456 Park Ave, New York, NY', phone: '(555) 234-5678', status: 'active', rating: 4.6, reviews: 189, visibility: 82, keywords: 38, manager: 'Sarah Johnson', lastUpdated: '2024-01-19' },
  { id: 3, name: 'Brooklyn Location', address: '789 Atlantic Ave, Brooklyn, NY', phone: '(555) 345-6789', status: 'active', rating: 4.9, reviews: 312, visibility: 91, keywords: 52, manager: 'Mike Chen', lastUpdated: '2024-01-20' },
  { id: 4, name: 'Queens Outlet', address: '321 Queens Blvd, Queens, NY', phone: '(555) 456-7890', status: 'pending', rating: 4.2, reviews: 87, visibility: 65, keywords: 28, manager: 'Lisa Wong', lastUpdated: '2024-01-15' },
];

const teamData = [
  { id: 1, name: 'John Smith', email: 'john@company.com', role: 'Super Admin', locations: 'All', lastActive: '2 min ago', avatar: 'JS' },
  { id: 2, name: 'Sarah Johnson', email: 'sarah@company.com', role: 'Location Manager', locations: '2', lastActive: '1 hour ago', avatar: 'SJ' },
  { id: 3, name: 'Mike Chen', email: 'mike@company.com', role: 'Location Manager', locations: '1', lastActive: '3 hours ago', avatar: 'MC' },
];

const rollupData = [
  { date: 'Mon', impressions: 45000, clicks: 2300, calls: 180, directions: 320 },
  { date: 'Tue', impressions: 52000, clicks: 2800, calls: 210, directions: 380 },
  { date: 'Wed', impressions: 48000, clicks: 2400, calls: 195, directions: 340 },
  { date: 'Thu', impressions: 61000, clicks: 3200, calls: 250, directions: 420 },
  { date: 'Fri', impressions: 58000, clicks: 3100, calls: 235, directions: 400 },
];

const slaData = [
  { month: 'Aug', uptime: 99.9, response: 245, incidents: 0 },
  { month: 'Sep', uptime: 99.95, response: 189, incidents: 1 },
  { month: 'Oct', uptime: 99.8, response: 267, incidents: 2 },
  { month: 'Nov', uptime: 99.99, response: 156, incidents: 0 },
  { month: 'Dec', uptime: 99.9, response: 198, incidents: 1 },
];

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700 border-green-200';
    case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'inactive': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-slate-100';
  }
};

const getRoleColor = (role) => {
  switch (role) {
    case 'Super Admin': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'Location Manager': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Analyst': return 'bg-green-100 text-green-700 border-green-200';
    default: return 'bg-slate-100';
  }
};

// Locations Overview
const LocationsOverview = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const filtered = locationsData.filter(loc => loc.name.toLowerCase().includes(searchTerm.toLowerCase()));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Locations', value: '4', icon: Store }, { label: 'Active', value: '3', icon: CheckCircle2 }, { label: 'Avg Rating', value: '4.6', icon: Star }, { label: 'Total Reviews', value: '822', icon: MessageSquare }].map((stat, i) => (
          <Card key={i}><CardContent className="p-4">
            <stat.icon className="w-5 h-5 text-slate-400 mb-2" />
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Locations</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input placeholder="Search locations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-48" />
              </div>
              <Button><Plus className="w-4 h-4 mr-2" />Add Location</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(location => (
                <TableRow key={location.id}>
                  <TableCell>
                    <div className="font-medium">{location.name}</div>
                    <div className="text-sm text-slate-500">{location.address}</div>
                  </TableCell>
                  <TableCell><Badge className={getStatusColor(location.status)}>{location.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-medium">{location.rating}</span>
                      <span className="text-xs text-slate-500">({location.reviews})</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${location.visibility}%` }} />
                      </div>
                      <span className="text-xs">{location.visibility}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{location.manager}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
                        <DropdownMenuItem><Edit3 className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// Master Dashboard
const MasterDashboard = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Performance Rollup - All Locations</CardTitle>
        <CardDescription>Aggregated metrics across all your locations</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={rollupData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" /><YAxis yAxisId="left" /><YAxis yAxisId="right" orientation="right" />
            <Tooltip /><Legend />
            <Area yAxisId="left" type="monotone" dataKey="impressions" fill="#3b82f620" stroke="#3b82f6" name="Impressions" />
            <Bar yAxisId="right" dataKey="clicks" fill="#22c55e" name="Clicks" />
            <Line yAxisId="right" type="monotone" dataKey="calls" stroke="#f59e0b" name="Calls" />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
);

// Team Management
const TeamManagement = () => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('manager');
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invite Team Member</CardTitle>
          <CardDescription>Add new members to your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Input flex-1 placeholder="Enter email address" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="flex-1" />
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Super Admin</SelectItem>
                <SelectItem value="manager">Location Manager</SelectItem>
                <SelectItem value="analyst">Analyst</SelectItem>
              </SelectContent>
            </Select>
            <Button><UserPlus className="w-4 h-4 mr-2" />Send Invite</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Team Members</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Locations</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamData.map(member => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8"><AvatarFallback className="bg-blue-100 text-blue-700">{member.avatar}</AvatarFallback></Avatar>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-xs text-slate-500">{member.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge className={getRoleColor(member.role)}>{member.role}</Badge></TableCell>
                  <TableCell>{member.locations}</TableCell>
                  <TableCell>{member.lastActive}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Edit3 className="w-4 h-4 mr-2" />Edit Role</DropdownMenuItem>
                        <DropdownMenuItem><Shield className="w-4 h-4 mr-2" />Permissions</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600"><UserMinus className="w-4 h-4 mr-2" />Remove</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// SLA Monitoring
const SLAMonitoring = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[{ label: 'Uptime (30d)', value: '99.95%' }, { label: 'Avg Response', value: '189ms' }, { label: 'Incidents', value: '1' }, { label: 'Support Response', value: '<2h' }].map((stat, i) => (
        <Card key={i}><CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">{stat.label}</span>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{stat.value}</div>
        </CardContent></Card>
      ))}
    </div>
    <Card>
      <CardHeader><CardTitle>SLA Performance History</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={slaData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" /><YAxis yAxisId="left" domain={[99, 100]} /><YAxis yAxisId="right" orientation="right" />
            <Tooltip /><Legend />
            <Line yAxisId="left" type="monotone" dataKey="uptime" stroke="#22c55e" name="Uptime %" strokeWidth={2} />
            <Bar yAxisId="right" dataKey="response" fill="#3b82f6" name="Response Time (ms)" />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
);

// Main EnterpriseMode Page
export default function EnterpriseMode() {
  const [activeTab, setActiveTab] = useState('overview');
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="w-8 h-8 text-violet-500" />Enterprise Command Center
            </h1>
            <p className="text-slate-600 mt-1">Full control for large-scale operations</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-violet-100 text-violet-700 border-violet-200"><Crown className="w-3 h-3 mr-1" />Enterprise Plan</Badge>
            <Button variant="outline"><HelpCircle className="w-4 h-4 mr-2" />Support</Button>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="sla">SLA</TabsTrigger>
          </TabsList>
          <TabsContent value="overview"><MasterDashboard /></TabsContent>
          <TabsContent value="locations"><LocationsOverview /></TabsContent>
          <TabsContent value="team"><TeamManagement /></TabsContent>
          <TabsContent value="api">
            <Card>
              <CardHeader><CardTitle>API Management</CardTitle><CardDescription>Manage your API access credentials and documentation</CardDescription></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {[{ title: 'REST API Reference', description: 'Complete endpoint documentation', icon: FileJson }, { title: 'Webhooks', description: 'Real-time event notifications', icon: Database }, { title: 'SDKs & Libraries', description: 'Official client libraries', icon: Code }].map((doc, i) => (
                    <Card key={i} className="border hover:border-blue-300 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <doc.icon className="w-8 h-8 text-blue-500 mb-3" />
                        <h4 className="font-semibold mb-1">{doc.title}</h4>
                        <p className="text-sm text-slate-500">{doc.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="sla"><SLAMonitoring /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}