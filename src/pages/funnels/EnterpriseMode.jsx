import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { 
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Legend
} from 'recharts';
import {
  Building2,
  Users,
  Key,
  Palette,
  Settings,
  Shield,
  Globe,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  MapPin,
  Phone,
  Mail,
  Copy,
  RefreshCw,
  Trash2,
  Edit3,
  Eye,
  Download,
  Upload,
  Code,
  Webhook,
  Database,
  FileJson,
  Lock,
  Unlock,
  UserPlus,
  UserMinus,
  Crown,
  Zap,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  LayoutDashboard,
  Store,
  Briefcase,
  HelpCircle,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  QrCode,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  Star,
  Award,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  X
} from 'lucide-react';

// Multi-location data
const locationsData = [
  { 
    id: 1, 
    name: 'Downtown Store', 
    address: '123 Main St, New York, NY', 
    phone: '(555) 123-4567',
    status: 'active',
    rating: 4.8,
    reviews: 234,
    visibility: 89,
    keywords: 45,
    manager: 'John Smith',
    lastUpdated: '2024-01-20'
  },
  { 
    id: 2, 
    name: 'Uptown Branch', 
    address: '456 Park Ave, New York, NY', 
    phone: '(555) 234-5678',
    status: 'active',
    rating: 4.6,
    reviews: 189,
    visibility: 82,
    keywords: 38,
    manager: 'Sarah Johnson',
    lastUpdated: '2024-01-19'
  },
  { 
    id: 3, 
    name: 'Brooklyn Location', 
    address: '789 Atlantic Ave, Brooklyn, NY', 
    phone: '(555) 345-6789',
    status: 'active',
    rating: 4.9,
    reviews: 312,
    visibility: 91,
    keywords: 52,
    manager: 'Mike Chen',
    lastUpdated: '2024-01-20'
  },
  { 
    id: 4, 
    name: 'Queens Outlet', 
    address: '321 Queens Blvd, Queens, NY', 
    phone: '(555) 456-7890',
    status: 'pending',
    rating: 4.2,
    reviews: 87,
    visibility: 65,
    keywords: 28,
    manager: 'Lisa Wong',
    lastUpdated: '2024-01-15'
  },
  { 
    id: 5, 
    name: 'Bronx Center', 
    address: '654 Grand Concourse, Bronx, NY', 
    phone: '(555) 567-8901',
    status: 'inactive',
    rating: 4.0,
    reviews: 45,
    visibility: 42,
    keywords: 18,
    manager: 'Unassigned',
    lastUpdated: '2024-01-10'
  }
];

// Team members data
const teamData = [
  { id: 1, name: 'John Smith', email: 'john@company.com', role: 'Super Admin', locations: 'All', lastActive: '2 min ago', avatar: 'JS' },
  { id: 2, name: 'Sarah Johnson', email: 'sarah@company.com', role: 'Location Manager', locations: '2', lastActive: '1 hour ago', avatar: 'SJ' },
  { id: 3, name: 'Mike Chen', email: 'mike@company.com', role: 'Location Manager', locations: '1', lastActive: '3 hours ago', avatar: 'MC' },
  { id: 4, name: 'Lisa Wong', email: 'lisa@company.com', role: 'Analyst', locations: '1', lastActive: '1 day ago', avatar: 'LW' },
  { id: 5, name: 'David Park', email: 'david@company.com', role: 'Editor', locations: '3', lastActive: '2 days ago', avatar: 'DP' }
];

// API keys data
const apiKeysData = [
  { id: 1, name: 'Production API Key', key: 'lr_live_...x8f2a', created: '2024-01-01', lastUsed: '2 min ago', status: 'active', calls: '1.2M' },
  { id: 2, name: 'Staging API Key', key: 'lr_test_...b4c9', created: '2024-01-10', lastUsed: '1 hour ago', status: 'active', calls: '45K' },
  { id: 3, name: 'Development', key: 'lr_dev_...e7d3', created: '2024-01-15', lastUsed: '3 days ago', status: 'inactive', calls: '12K' }
];

// White-label settings
const brandSettings = {
  companyName: 'Your Company',
  logo: null,
  primaryColor: '#3b82f6',
  secondaryColor: '#1e40af',
  favicon: null,
  customDomain: 'dashboard.yourcompany.com',
  emailFrom: 'noreply@yourcompany.com',
  customCss: '',
  hidePoweredBy: false
};

// SLA metrics
const slaData = [
  { month: 'Aug', uptime: 99.9, response: 245, incidents: 0 },
  { month: 'Sep', uptime: 99.95, response: 189, incidents: 1 },
  { month: 'Oct', uptime: 99.8, response: 267, incidents: 2 },
  { month: 'Nov', uptime: 99.99, response: 156, incidents: 0 },
  { month: 'Dec', uptime: 99.9, response: 198, incidents: 1 },
  { month: 'Jan', uptime: 99.95, response: 178, incidents: 0 }
];

// Rollup performance data
const rollupData = [
  { date: 'Mon', impressions: 45000, clicks: 2300, calls: 180, directions: 320 },
  { date: 'Tue', impressions: 52000, clicks: 2800, calls: 210, directions: 380 },
  { date: 'Wed', impressions: 48000, clicks: 2400, calls: 195, directions: 340 },
  { date: 'Thu', impressions: 61000, clicks: 3200, calls: 250, directions: 420 },
  { date: 'Fri', impressions: 58000, clicks: 3100, calls: 235, directions: 400 },
  { date: 'Sat', impressions: 42000, clicks: 1800, calls: 150, directions: 280 },
  { date: 'Sun', impressions: 38000, clicks: 1600, calls: 130, directions: 250 }
];

// Custom integrations
const integrationsData = [
  { id: 1, name: 'Salesforce CRM', category: 'CRM', status: 'connected', lastSync: '5 min ago', icon: 'S' },
  { id: 2, name: 'HubSpot', category: 'Marketing', status: 'connected', lastSync: '15 min ago', icon: 'H' },
  { id: 3, name: 'Zapier', category: 'Automation', status: 'connected', lastSync: '1 hour ago', icon: 'Z' },
  { id: 4, name: 'Slack', category: 'Communication', status: 'disconnected', lastSync: 'Never', icon: 'S' },
  { id: 5, name: 'Google Analytics 4', category: 'Analytics', status: 'connected', lastSync: '10 min ago', icon: 'G' }
];

// Locations Overview Component
const LocationsOverview = () => {
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLocations = locationsData.filter(loc => 
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'inactive': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100';
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Locations', value: '5', icon: Store, change: '+1' },
          { label: 'Active', value: '3', icon: CheckCircle2, change: '75%' },
          { label: 'Avg Rating', value: '4.5', icon: Star, change: '+0.2' },
          { label: 'Total Reviews', value: '867', icon: MessageSquare, change: '+45' }
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <stat.icon className="w-5 h-5 text-slate-400" />
                <Badge variant="outline" className="text-xs">{stat.change}</Badge>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Locations Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>All Locations</CardTitle>
              <CardDescription>Manage your business locations</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                {filteredLocations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{location.name}</div>
                        <div className="text-sm text-slate-500">{location.address}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(location.status)}>
                        {location.status}
                      </Badge>
                    </TableCell>
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
                          <div 
                            className="h-full bg-blue-500"
                            style={{ width: `${location.visibility}%` }}
                          />
                        </div>
                        <span className="text-xs">{location.visibility}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{location.manager}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye className="w-4 h-4 mr-2" /> View</DropdownMenuItem>
                          <DropdownMenuItem><Edit3 className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem><BarChart3 className="w-4 h-4 mr-2" /> Analytics</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Master Dashboard Component
const MasterDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Rollup - All Locations</CardTitle>
          <CardDescription>Aggregated metrics across all your locations</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={rollupData}>
              <defs>
                <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="impressions" fill="url(#colorImpressions)" stroke="#3b82f6" name="Impressions" />
              <Bar yAxisId="right" dataKey="clicks" fill="#22c55e" name="Clicks" />
              <Line yAxisId="right" type="monotone" dataKey="calls" stroke="#f59e0b" name="Calls" />
              <Line yAxisId="right" type="monotone" dataKey="directions" stroke="#8b5cf6" name="Directions" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Location Comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {locationsData
                .sort((a, b) => b.visibility - a.visibility)
                .slice(0, 3)
                .map((loc, i) => (
                  <div key={loc.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        i === 0 ? 'bg-amber-100 text-amber-700' :
                        i === 1 ? 'bg-slate-200 text-slate-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-medium">{loc.name}</div>
                        <div className="text-xs text-slate-500">{loc.manager}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{loc.visibility}% visibility</div>
                      <div className="text-xs text-green-600">+{Math.floor(Math.random() * 15)}%</div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { action: 'New review received', location: 'Downtown Store', time: '2 min ago', type: 'review' },
                { action: 'Listing updated', location: 'Brooklyn Location', time: '15 min ago', type: 'update' },
                { action: 'Keyword ranking improved', location: 'Uptown Branch', time: '1 hour ago', type: 'ranking' },
                { action: 'New photo uploaded', location: 'Queens Outlet', time: '2 hours ago', type: 'media' },
                { action: 'Citation found', location: 'Downtown Store', time: '3 hours ago', type: 'citation' }
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'review' ? 'bg-green-100 text-green-600' :
                    activity.type === 'ranking' ? 'bg-blue-100 text-blue-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {activity.type === 'review' ? <MessageSquare className="w-4 h-4" /> :
                     activity.type === 'ranking' ? <TrendingUp className="w-4 h-4" /> :
                     <Activity className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{activity.action}</div>
                    <div className="text-xs text-slate-500">{activity.location} • {activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Team Management Component
const TeamManagement = () => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('manager');

  const getRoleColor = (role) => {
    switch (role) {
      case 'Super Admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Location Manager': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Analyst': return 'bg-green-100 text-green-700 border-green-200';
      case 'Editor': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Invite Card */}
      <Card>
        <CardHeader>
          <CardTitle>Invite Team Member</CardTitle>
          <CardDescription>Add new members to your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input 
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Super Admin</SelectItem>
                <SelectItem value="manager">Location Manager</SelectItem>
                <SelectItem value="analyst">Analyst</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Send Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
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
              {teamData.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {member.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-xs text-slate-500">{member.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(member.role)}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{member.locations}</TableCell>
                  <TableCell>{member.lastActive}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Edit3 className="w-4 h-4 mr-2" /> Edit Role</DropdownMenuItem>
                        <DropdownMenuItem><Shield className="w-4 h-4 mr-2" /> Permissions</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600"><UserMinus className="w-4 h-4 mr-2" /> Remove</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>Manage access levels for each role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { role: 'Super Admin', description: 'Full access to all features', permissions: ['All locations', 'Billing', 'Team management', 'API access', 'White-label'] },
              { role: 'Location Manager', description: 'Manage assigned locations', permissions: ['Assigned locations', 'Campaigns', 'Reviews', 'Reports', 'No billing'] },
              { role: 'Analyst', description: 'View and analyze data', permissions: ['View all locations', 'Reports', 'Analytics', 'Export data', 'No editing'] },
              { role: 'Editor', description: 'Content management', permissions: ['Edit listings', 'Manage photos', 'Respond to reviews', 'Update info', 'No campaigns'] }
            ].map((roleInfo, i) => (
              <Card key={i} className="border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{roleInfo.role}</CardTitle>
                  <CardDescription className="text-xs">{roleInfo.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {roleInfo.permissions.map((perm, j) => (
                      <li key={j} className="text-xs text-slate-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        {perm}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// White Label Component
const WhiteLabelSettings = () => {
  const [settings, setSettings] = useState(brandSettings);

  return (
    <div className="space-y-6">
      {/* Brand Identity */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Identity</CardTitle>
          <CardDescription>Customize the appearance of your dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input 
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Custom Domain</Label>
              <Input 
                value={settings.customDomain}
                onChange={(e) => setSettings({ ...settings, customDomain: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input 
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input 
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secondary Color</Label>
              <div className="flex gap-2">
                <Input 
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input 
                  value={settings.secondaryColor}
                  onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email From Address</Label>
            <Input 
              value={settings.emailFrom}
              onChange={(e) => setSettings({ ...settings, emailFrom: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              <Label className="font-medium">Hide "Powered by LocalRnk"</Label>
              <p className="text-sm text-slate-500">Remove our branding from your dashboard</p>
            </div>
            <Switch 
              checked={settings.hidePoweredBy}
              onCheckedChange={(checked) => setSettings({ ...settings, hidePoweredBy: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Logo & Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm text-slate-600">Drop logo here or click to upload</p>
                <p className="text-xs text-slate-400">SVG, PNG or JPG (max 2MB)</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Favicon</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm text-slate-600">Drop favicon here</p>
                <p className="text-xs text-slate-400">ICO or PNG (32x32)</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Login Background</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm text-slate-600">Drop image here</p>
                <p className="text-xs text-slate-400">JPG or PNG (1920x1080)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>See how your branded dashboard will look</CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="rounded-lg border p-6"
            style={{ 
              background: `linear-gradient(135deg, ${settings.primaryColor}10, ${settings.secondaryColor}10)` 
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  {settings.companyName.charAt(0)}
                </div>
                <span className="font-semibold">{settings.companyName}</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  Primary Button
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  style={{ borderColor: settings.secondaryColor, color: settings.secondaryColor }}
                >
                  Secondary
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">1,234</div>
                    <div className="text-xs text-slate-500">Sample Metric</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// API Management Component
const APIManagement = () => {
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  return (
    <div className="space-y-6">
      {/* API Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Calls (30d)', value: '1.3M', icon: Activity },
          { label: 'Avg Latency', value: '124ms', icon: Clock },
          { label: 'Success Rate', value: '99.9%', icon: CheckCircle2 },
          { label: 'Active Keys', value: '3', icon: Key }
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <stat.icon className="w-5 h-5 text-slate-400 mb-2" />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* API Keys Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage your API access credentials</CardDescription>
            </div>
            <Button onClick={() => setShowNewKeyDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Generate Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Calls</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeysData.map((apiKey) => (
                <TableRow key={apiKey.id}>
                  <TableCell className="font-medium">{apiKey.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {apiKey.key}
                    </code>
                  </TableCell>
                  <TableCell>{apiKey.created}</TableCell>
                  <TableCell>{apiKey.lastUsed}</TableCell>
                  <TableCell>{apiKey.calls}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={apiKey.status === 'active' ? 'default' : 'secondary'}
                      className={apiKey.status === 'active' ? 'bg-green-500' : ''}
                    >
                      {apiKey.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>Reference materials for integrating with our API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: 'REST API Reference', description: 'Complete endpoint documentation', icon: FileJson },
              { title: 'Webhooks', description: 'Real-time event notifications', icon: Webhook },
              { title: 'SDKs & Libraries', description: 'Official client libraries', icon: Code }
            ].map((doc, i) => (
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

      {/* New Key Dialog */}
      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate New API Key</DialogTitle>
            <DialogDescription>Create a new API key for your application</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Key Name</Label>
              <Input 
                placeholder="e.g., Production Server"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-2">
                {['Read locations', 'Write locations', 'Read reports', 'Manage campaigns'].map((perm, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <Checkbox id={`perm-${i}`} defaultChecked={i < 2} />
                    <Label htmlFor={`perm-${i}`} className="text-sm">{perm}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewKeyDialog(false)}>Cancel</Button>
            <Button onClick={() => setShowNewKeyDialog(false)}>Generate Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Custom Integrations Component
const CustomIntegrations = () => {
  return (
    <div className="space-y-6">
      {/* Connected Integrations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Connected Integrations</CardTitle>
              <CardDescription>Manage your third-party connections</CardDescription>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Integration
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {integrationsData.map((integration) => (
              <div 
                key={integration.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-600">
                    {integration.icon}
                  </div>
                  <div>
                    <div className="font-medium">{integration.name}</div>
                    <div className="text-sm text-slate-500">{integration.category}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge 
                      variant={integration.status === 'connected' ? 'default' : 'secondary'}
                      className={integration.status === 'connected' ? 'bg-green-500' : ''}
                    >
                      {integration.status}
                    </Badge>
                    <div className="text-xs text-slate-500 mt-1">
                      Last sync: {integration.lastSync}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integration Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Integration Builder</CardTitle>
          <CardDescription>Create custom webhooks and data flows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input placeholder="https://your-app.com/webhook" />
              </div>
              <div className="space-y-2">
                <Label>Events to Subscribe</Label>
                <div className="space-y-2">
                  {['Location created', 'Review received', 'Ranking changed', 'Campaign completed'].map((event, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Checkbox id={`event-${i}`} />
                      <Label htmlFor={`event-${i}`} className="text-sm">{event}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <Button className="w-full">
                <Webhook className="w-4 h-4 mr-2" />
                Create Webhook
              </Button>
            </div>
            <div className="bg-slate-950 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Webhook Payload Preview</span>
                <Badge variant="outline" className="text-xs">JSON</Badge>
              </div>
              <pre className="text-xs text-green-400 overflow-auto">
{`{
  "event": "review.received",
  "timestamp": "2024-01-20T10:30:00Z",
  "data": {
    "location_id": "123",
    "review": {
      "id": "rv_456",
      "rating": 5,
      "content": "Great service!",
      "author": "John Doe",
      "platform": "google"
    }
  }
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// SLA Monitoring Component
const SLAMonitoring = () => {
  return (
    <div className="space-y-6">
      {/* SLA Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Uptime (30d)', value: '99.95%', target: '99.9%', status: 'good' },
          { label: 'Avg Response', value: '189ms', target: '<200ms', status: 'good' },
          { label: 'Incidents', value: '1', target: '<3', status: 'good' },
          { label: 'Support Response', value: '<2h', target: '<4h', status: 'good' }
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">{stat.label}</span>
                {stat.status === 'good' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-slate-500">Target: {stat.target}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SLA History Chart */}
      <Card>
        <CardHeader>
          <CardTitle>SLA Performance History</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={slaData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" domain={[99, 100]} />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="uptime" stroke="#22c55e" name="Uptime %" strokeWidth={2} />
              <Bar yAxisId="right" dataKey="response" fill="#3b82f6" name="Response Time (ms)" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Account Rep Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="bg-blue-500 text-white text-2xl">DR</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold">David Rodriguez</h3>
                <Badge className="bg-blue-500">Your Account Rep</Badge>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Dedicated support for your enterprise account. Available Monday-Friday, 9AM-6PM EST.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm">
                  <Mail className="w-4 h-4 mr-2" />
                  david.r@localrnk.com
                </Button>
                <Button variant="outline" size="sm">
                  <Phone className="w-4 h-4 mr-2" />
                  (555) 123-4567
                </Button>
                <Button size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Schedule Call
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incident History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: '2024-01-15', title: 'API Latency Spike', duration: '12 min', status: 'resolved', impact: 'minor' },
              { date: '2023-12-03', title: 'Scheduled Maintenance', duration: '2 hours', status: 'planned', impact: 'none' }
            ].map((incident, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    incident.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {incident.status === 'resolved' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-medium">{incident.title}</div>
                    <div className="text-sm text-slate-500">{incident.date} • Duration: {incident.duration}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{incident.impact} impact</Badge>
                  <Badge className={incident.status === 'resolved' ? 'bg-green-500' : 'bg-blue-500'}>
                    {incident.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Import Upload and Checkbox
import { Upload, Checkbox } from 'lucide-react';

// Main EnterpriseMode Component
const EnterpriseMode = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="w-8 h-8 text-violet-500" />
              Enterprise Command Center
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Full control for large-scale operations
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-violet-100 text-violet-700 border-violet-200">
              <Crown className="w-3 h-3 mr-1" />
              Enterprise Plan
            </Badge>
            <Button variant="outline">
              <HelpCircle className="w-4 h-4 mr-2" />
              Support
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="whitelabel">White-Label</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="sla">SLA</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <MasterDashboard />
          </TabsContent>

          <TabsContent value="locations" className="space-y-4">
            <LocationsOverview />
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <TeamManagement />
          </TabsContent>

          <TabsContent value="whitelabel" className="space-y-4">
            <WhiteLabelSettings />
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <APIManagement />
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <CustomIntegrations />
          </TabsContent>

          <TabsContent value="sla" className="space-y-4">
            <SLAMonitoring />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnterpriseMode;
