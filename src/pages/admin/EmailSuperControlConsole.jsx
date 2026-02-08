import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Send, 
  Users, 
  BarChart3, 
  Workflow, 
  Mail, 
  Eye, 
  MousePointer, 
  TrendingUp, 
  Pause, 
  Play, 
  Plus, 
  Search,
  Filter,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Types
interface Campaign {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'paused' | 'scheduled' | 'draft' | 'completed';
  segment: string;
  variant: string;
  total_recipients?: number;
  sent_count?: number;
  stats?: {
    total_sent: number;
    opens: number;
    clicks: number;
    open_rate: string;
    click_rate: string;
  };
}

interface Sequence {
  type: string;
  count: number;
  nurtures: Array<{
    id: string;
    lead_id: string;
    current_step: number;
    total_steps: number;
    status: string;
    next_email_date: string;
  }>;
}

interface Workflow {
  id: string;
  name: string;
  status: string;
  triggers: string[];
  steps: number;
  conversion_rate: string;
}

interface Analytics {
  overall: {
    total: number;
    sent: number;
    opened: number;
    clicked: number;
    open_rate: string;
    click_rate: string;
    bounce_rate: string;
  };
  variants: Record<string, any>;
  daily_breakdown: Array<{
    date: string;
    sent: number;
    opened: number;
    clicked: number;
  }>;
}

const COLORS = ['#c8ff00', '#00f2ff', '#ef4444', '#f59e0b'];

export default function EmailSuperControlConsole() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('campaigns');
  const [isBroadcastDialogOpen, setIsBroadcastDialogOpen] = useState(false);
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  
  // Broadcast form state
  const [broadcastForm, setBroadcastForm] = useState({
    segment: 'all_leads',
    subject: '',
    body: '',
    variant: 'A',
    ab_test: false
  });

  // Fetch campaigns
  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: async () => {
      const response = await base44.functions.admin.emailCampaignManager({
        action: 'get_campaigns'
      });
      return response.data as { campaigns: Campaign[] };
    }
  });

  // Fetch sequences
  const { data: sequencesData, isLoading: sequencesLoading } = useQuery({
    queryKey: ['email-sequences'],
    queryFn: async () => {
      const response = await base44.functions.admin.emailCampaignManager({
        action: 'get_sequences'
      });
      return response.data as { sequences: Record<string, Sequence>; total_active: number };
    }
  });

  // Fetch workflows
  const { data: workflowsData, isLoading: workflowsLoading } = useQuery({
    queryKey: ['email-workflows'],
    queryFn: async () => {
      const response = await base44.functions.admin.emailCampaignManager({
        action: 'get_workflows'
      });
      return response.data as { workflows: Workflow[] };
    }
  });

  // Fetch analytics
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['email-analytics'],
    queryFn: async () => {
      const response = await base44.functions.admin.emailCampaignManager({
        action: 'get_analytics',
        payload: { days: 30 }
      });
      return response.data as Analytics;
    }
  });

  // Broadcast mutation
  const broadcastMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await base44.functions.admin.emailCampaignManager({
        action: 'broadcast',
        payload
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Broadcast initiated successfully!');
      setIsBroadcastDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['email-analytics'] });
    },
    onError: (error: any) => {
      toast.error(`Broadcast failed: ${error.message}`);
    }
  });

  // Campaign mutation
  const campaignMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await base44.functions.admin.emailCampaignManager({
        action: 'create_campaign',
        payload
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Campaign created successfully!');
      setIsCampaignDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
    },
    onError: (error: any) => {
      toast.error(`Campaign creation failed: ${error.message}`);
    }
  });

  // Handle broadcast
  const handleBroadcast = async (testMode = false) => {
    await broadcastMutation.mutateAsync({
      ...broadcastForm,
      test_mode: testMode
    });
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'scheduled': return 'bg-blue-500';
      case 'draft': return 'bg-gray-500';
      case 'completed': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Email Super Control Console</h1>
            <p className="text-slate-400 mt-1">Manage broadcasts, sequences, workflows, and campaigns</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => queryClient.invalidateQueries()}
              className="border-slate-700 text-slate-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={() => setIsBroadcastDialogOpen(true)}
              className="bg-gradient-to-r from-c8ff00 to-a8e000 text-black font-semibold"
            >
              <Send className="w-4 h-4 mr-2" />
              New Broadcast
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Sent (30d)</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {analyticsData?.overall?.sent?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-c8ff00/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-c8ff00" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Open Rate</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {analyticsData?.overall?.open_rate || '0%'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Click Rate</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {analyticsData?.overall?.click_rate || '0%'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <MousePointer className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Sequences</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {sequencesData?.total_active || '0'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Workflow className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-c8ff00 data-[state=active]:text-black">
              <Mail className="w-4 h-4 mr-2" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="sequences" className="data-[state=active]:bg-c8ff00 data-[state=active]:text-black">
              <Workflow className="w-4 h-4 mr-2" />
              Sequences
            </TabsTrigger>
            <TabsTrigger value="workflows" className="data-[state=active]:bg-c8ff00 data-[state=active]:text-black">
              <RefreshCw className="w-4 h-4 mr-2" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-c8ff00 data-[state=active]:text-black">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white">Email Campaigns</CardTitle>
                    <CardDescription>Manage your email campaigns and broadcasts</CardDescription>
                  </div>
                  <Button 
                    onClick={() => setIsCampaignDialogOpen(true)}
                    className="bg-c8ff00 text-black"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">Campaign</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Type</TableHead>
                      <TableHead className="text-slate-400">Recipients</TableHead>
                      <TableHead className="text-slate-400">Open Rate</TableHead>
                      <TableHead className="text-slate-400">Click Rate</TableHead>
                      <TableHead className="text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaignsData?.campaigns?.map((campaign) => (
                      <TableRow key={campaign.id} className="border-slate-800">
                        <TableCell>
                          <div>
                            <p className="font-medium text-white">{campaign.name}</p>
                            <p className="text-xs text-slate-500">Variant {campaign.variant}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(campaign.status)} text-black`}>
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300 capitalize">{campaign.type}</TableCell>
                        <TableCell className="text-slate-300">
                          {campaign.total_recipients?.toLocaleString() || '-'}
                        </TableCell>
                        <TableCell className="text-green-400">{campaign.stats?.open_rate || '-'}</TableCell>
                        <TableCell className="text-blue-400">{campaign.stats?.click_rate || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {campaign.status === 'active' ? (
                              <Button size="sm" variant="outline" className="border-slate-700">
                                <Pause className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" className="border-slate-700">
                                <Play className="w-4 h-4" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-slate-700"
                              onClick={() => setSelectedCampaign(campaign)}
                            >
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sequences Tab */}
          <TabsContent value="sequences" className="space-y-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Active Sequences</CardTitle>
                <CardDescription>Manage nurture sequences and automated email flows</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sequencesData && Object.entries(sequencesData.sequences).map(([type, data]: [string, any]) => (
                    <Card key={type} className="bg-slate-800 border-slate-700">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg text-white capitalize">
                              {type.replace('_', ' ')}
                            </CardTitle>
                            <CardDescription>{data.length} active leads</CardDescription>
                          </div>
                          <Badge className="bg-c8ff00 text-black">{data.length}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {data.slice(0, 3).map((nurture: any) => (
                            <div key={nurture.id} className="flex items-center justify-between p-2 bg-slate-900 rounded">
                              <div className="text-sm">
                                <p className="text-slate-300">Step {nurture.current_step + 1} of {nurture.total_steps}</p>
                                <p className="text-xs text-slate-500">Next: {new Date(nurture.next_email_date).toLocaleDateString()}</p>
                              </div>
                              <Progress 
                                value={(nurture.current_step / nurture.total_steps) * 100} 
                                className="w-20 h-2"
                              />
                            </div>
                          ))}
                          {data.length > 3 && (
                            <p className="text-center text-sm text-slate-500">
                              +{data.length - 3} more leads
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="space-y-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Automated Workflows</CardTitle>
                <CardDescription>Trigger-based email automation flows</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {workflowsData?.workflows?.map((workflow) => (
                    <Card key={workflow.id} className="bg-slate-800 border-slate-700">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg text-white">{workflow.name}</CardTitle>
                            <CardDescription>{workflow.steps} steps • {workflow.triggers.join(', ')}</CardDescription>
                          </div>
                          <Badge className={workflow.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}>
                            {workflow.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Conversion Rate</span>
                            <span className="text-c8ff00 font-bold">{workflow.conversion_rate}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {workflow.triggers.map((trigger, idx) => (
                              <Badge key={idx} variant="outline" className="border-slate-600 text-slate-300">
                                {trigger}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button size="sm" variant="outline" className="flex-1 border-slate-700">
                              <Users className="w-4 h-4 mr-2" />
                              View Leads
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 border-slate-700">
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Analytics
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Performance Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData?.daily_breakdown || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="date" stroke="#666" fontSize={12} />
                      <YAxis stroke="#666" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Line type="monotone" dataKey="sent" stroke="#c8ff00" strokeWidth={2} />
                      <Line type="monotone" dataKey="opened" stroke="#00f2ff" strokeWidth={2} />
                      <Line type="monotone" dataKey="clicked" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Variant Performance (A/B Test)</CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsData?.variants && (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={Object.entries(analyticsData.variants).map(([name, data]: [string, any]) => ({
                        name,
                        open_rate: parseFloat(data.open_rate),
                        click_rate: parseFloat(data.click_rate)
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }}
                        />
                        <Bar dataKey="open_rate" fill="#c8ff00" />
                        <Bar dataKey="click_rate" fill="#00f2ff" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Broadcast Dialog */}
        <Dialog open={isBroadcastDialogOpen} onOpenChange={setIsBroadcastDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Broadcast</DialogTitle>
              <DialogDescription className="text-slate-400">
                Send an email to a segment of your audience
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Target Segment</Label>
                <Select 
                  value={broadcastForm.segment}
                  onValueChange={(value) => setBroadcastForm({...broadcastForm, segment: value})}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all_leads">All Leads</SelectItem>
                    <SelectItem value="active_nurture">Active Nurture</SelectItem>
                    <SelectItem value="abandoned_cart">Abandoned Cart</SelectItem>
                    <SelectItem value="completed_quiz">Completed Quiz</SelectItem>
                    <SelectItem value="paid_customers">Paid Customers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div>
                  <Label className="text-white">A/B Test</Label>
                  <p className="text-xs text-slate-400">Test two variants simultaneously</p>
                </div>
                <Switch 
                  checked={broadcastForm.ab_test}
                  onCheckedChange={(checked) => setBroadcastForm({...broadcastForm, ab_test: checked})}
                />
              </div>

              {!broadcastForm.ab_test && (
                <div>
                  <Label>Variant</Label>
                  <Select 
                    value={broadcastForm.variant}
                    onValueChange={(value) => setBroadcastForm({...broadcastForm, variant: value})}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="A">A - Pain Focused</SelectItem>
                      <SelectItem value="B">B - Urgency Focused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Subject Line</Label>
                <Input 
                  value={broadcastForm.subject}
                  onChange={(e) => setBroadcastForm({...broadcastForm, subject: e.target.value})}
                  placeholder="Enter subject line..."
                  className="bg-slate-800 border-slate-700"
                />
              </div>

              <div>
                <Label>Email Body (HTML)</Label>
                <Textarea 
                  value={broadcastForm.body}
                  onChange={(e) => setBroadcastForm({...broadcastForm, body: e.target.value})}
                  placeholder="<html>...</html>"
                  className="bg-slate-800 border-slate-700 min-h-[200px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => handleBroadcast(true)}
                disabled={broadcastMutation.isPending}
                className="border-slate-700"
              >
                Send Test
              </Button>
              <Button 
                onClick={() => handleBroadcast(false)}
                disabled={broadcastMutation.isPending}
                className="bg-c8ff00 text-black"
              >
                {broadcastMutation.isPending ? 'Sending...' : 'Send Broadcast'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Campaign Detail Dialog */}
        {selectedCampaign && (
          <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl">
              <DialogHeader>
                <DialogTitle>{selectedCampaign.name}</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Campaign performance and details
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-800 rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">{selectedCampaign.stats?.total_sent || 0}</p>
                  <p className="text-xs text-slate-400">Sent</p>
                </div>
                <div className="p-4 bg-slate-800 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-400">{selectedCampaign.stats?.opens || 0}</p>
                  <p className="text-xs text-slate-400">Opens</p>
                </div>
                <div className="p-4 bg-slate-800 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-400">{selectedCampaign.stats?.clicks || 0}</p>
                  <p className="text-xs text-slate-400">Clicks</p>
                </div>
                <div className="p-4 bg-slate-800 rounded-lg text-center">
                  <p className="text-2xl font-bold text-c8ff00">{selectedCampaign.stats?.open_rate || '0%'}</p>
                  <p className="text-xs text-slate-400">Open Rate</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
}
