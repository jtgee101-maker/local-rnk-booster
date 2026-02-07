import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  Cell
} from 'recharts';
import {
  TrendingUp,
  Target,
  Users,
  MessageSquare,
  MapPin,
  BarChart3,
  Plus,
  MoreHorizontal,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  Copy,
  Trash2,
  Edit3,
  Eye,
  Download,
  Filter,
  Search,
  Star,
  Building2,
  Globe,
  Smartphone,
  Mail,
  ChevronRight,
  GripVertical,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Calendar,
  FileText,
  Share2,
  Megaphone,
  Layers,
  Settings,
  Sparkles,
  Crown,
  Trophy,
  Activity
} from 'lucide-react';

// Campaign Pipeline Data
const initialPipelineData = [
  {
    id: '1',
    title: 'Summer Sale Campaign',
    stage: 'draft',
    type: 'promotion',
    priority: 'high',
    createdAt: '2024-01-15',
    dueDate: '2024-02-01',
    metrics: { impressions: 0, clicks: 0, conversions: 0 },
    assignedTo: 'John Doe',
    tags: ['seasonal', 'discount']
  },
  {
    id: '2',
    title: 'Local SEO Boost Q1',
    stage: 'active',
    type: 'seo',
    priority: 'high',
    createdAt: '2024-01-10',
    dueDate: '2024-03-31',
    metrics: { impressions: 15420, clicks: 892, conversions: 45 },
    assignedTo: 'Jane Smith',
    tags: ['seo', 'local']
  },
  {
    id: '3',
    title: 'Review Generation Drive',
    stage: 'active',
    type: 'reviews',
    priority: 'medium',
    createdAt: '2024-01-12',
    dueDate: '2024-02-15',
    metrics: { impressions: 3200, clicks: 180, conversions: 67 },
    assignedTo: 'John Doe',
    tags: ['reviews', 'reputation']
  },
  {
    id: '4',
    title: 'Citation Cleanup',
    stage: 'review',
    type: 'citations',
    priority: 'low',
    createdAt: '2024-01-08',
    dueDate: '2024-01-30',
    metrics: { impressions: 5000, clicks: 230, conversions: 12 },
    assignedTo: 'Jane Smith',
    tags: ['citations', 'cleanup']
  },
  {
    id: '5',
    title: 'Holiday Promotion',
    stage: 'completed',
    type: 'promotion',
    priority: 'high',
    createdAt: '2023-12-01',
    dueDate: '2024-01-05',
    metrics: { impressions: 45200, clicks: 2100, conversions: 156 },
    assignedTo: 'John Doe',
    tags: ['holiday', 'promotion']
  }
];

// A/B Test Data
const abTestData = [
  {
    id: '1',
    name: 'Headline Test - Homepage',
    type: 'headline',
    status: 'running',
    startDate: '2024-01-10',
    endDate: null,
    variants: [
      { id: 'a', name: 'Control', content: 'Best Local Business in Town', traffic: 50, conversions: 45, conversionRate: 4.5 },
      { id: 'b', name: 'Variant B', content: 'Award-Winning Local Service', traffic: 50, conversions: 62, conversionRate: 6.2 }
    ],
    winner: null,
    confidence: 87
  },
  {
    id: '2',
    name: 'CTA Button Color Test',
    type: 'cta',
    status: 'completed',
    startDate: '2024-01-01',
    endDate: '2024-01-10',
    variants: [
      { id: 'a', name: 'Blue Button', content: 'Get Started', traffic: 50, conversions: 38, conversionRate: 3.8 },
      { id: 'b', name: 'Green Button', content: 'Get Started', traffic: 50, conversions: 52, conversionRate: 5.2 }
    ],
    winner: 'b',
    confidence: 95
  },
  {
    id: '3',
    name: 'Review Request Subject Line',
    type: 'email',
    status: 'running',
    startDate: '2024-01-15',
    endDate: null,
    variants: [
      { id: 'a', name: 'Control', content: 'How was your experience?', traffic: 50, conversions: 23, conversionRate: 2.3 },
      { id: 'b', name: 'Variant B', content: 'Quick favor - 30 seconds', traffic: 50, conversions: 31, conversionRate: 3.1 }
    ],
    winner: null,
    confidence: 72
  }
];

// Review Data
const reviewData = [
  { id: 1, platform: 'Google', rating: 5, author: 'Sarah M.', content: 'Amazing service! Highly recommend.', date: '2024-01-20', responded: true },
  { id: 2, platform: 'Yelp', rating: 4, author: 'Mike T.', content: 'Great experience overall.', date: '2024-01-18', responded: false },
  { id: 3, platform: 'Google', rating: 5, author: 'Jennifer L.', content: 'Best in the business!', date: '2024-01-15', responded: true },
  { id: 4, platform: 'Facebook', rating: 3, author: 'David K.', content: 'Good but could be better.', date: '2024-01-12', responded: false },
  { id: 5, platform: 'Google', rating: 5, author: 'Emma W.', content: 'Exceeded my expectations!', date: '2024-01-10', responded: true }
];

// Citation Data
const citationData = [
  { platform: 'Google Business', status: 'complete', url: 'https://business.google.com', listings: 1, accuracy: 100 },
  { platform: 'Yelp', status: 'complete', url: 'https://yelp.com', listings: 1, accuracy: 95 },
  { platform: 'Facebook', status: 'complete', url: 'https://facebook.com', listings: 1, accuracy: 100 },
  { platform: 'Bing Places', status: 'incomplete', url: 'https://bingplaces.com', listings: 0, accuracy: 0 },
  { platform: 'Apple Maps', status: 'complete', url: 'https://mapsconnect.apple.com', listings: 1, accuracy: 90 },
  { platform: 'Yellow Pages', status: 'needs_update', url: 'https://yellowpages.com', listings: 1, accuracy: 75 }
];

// ROI Data
const roiData = [
  { month: 'Aug', spend: 1200, revenue: 3400, roi: 183 },
  { month: 'Sep', spend: 1400, revenue: 4200, roi: 200 },
  { month: 'Oct', spend: 1300, revenue: 3900, roi: 200 },
  { month: 'Nov', spend: 1600, revenue: 5100, roi: 219 },
  { month: 'Dec', spend: 1800, revenue: 6200, roi: 244 },
  { month: 'Jan', spend: 1500, revenue: 4800, roi: 220 }
];

// Competitor Data
const competitorData = [
  { name: 'Your Business', rating: 4.8, reviews: 234, visibility: 85, keywords: 45 },
  { name: 'Competitor A', rating: 4.2, reviews: 189, visibility: 72, keywords: 38 },
  { name: 'Competitor B', rating: 4.5, reviews: 156, visibility: 68, keywords: 32 },
  { name: 'Competitor C', rating: 3.9, reviews: 98, visibility: 45, keywords: 28 }
];

// Kanban Board Component
const KanbanBoard = ({ data, onUpdate }) => {
  const stages = [
    { id: 'draft', label: 'Draft', color: 'bg-slate-500' },
    { id: 'active', label: 'Active', color: 'bg-blue-500' },
    { id: 'review', label: 'In Review', color: 'bg-amber-500' },
    { id: 'completed', label: 'Completed', color: 'bg-green-500' }
  ];

  const [localData, setLocalData] = useState(data);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const newData = [...localData];
    const movedItem = newData.find(item => item.id === result.draggableId);
    if (movedItem) {
      movedItem.stage = result.destination.droppableId;
      setLocalData(newData);
      onUpdate?.(newData);
    }
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'draft': return 'bg-slate-100 dark:bg-slate-800 border-slate-200';
      case 'active': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200';
      case 'review': return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200';
      case 'completed': return 'bg-green-50 dark:bg-green-900/20 border-green-200';
      default: return 'bg-slate-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stages.map(stage => (
        <div key={stage.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${stage.color}`} />
              <span className="font-semibold text-sm">{stage.label}</span>
            </div>
            <Badge variant="outline">
              {localData.filter(item => item.stage === stage.id).length}
            </Badge>
          </div>
          
          <div className="space-y-2 min-h-[200px]">
            {localData
              .filter(item => item.stage === stage.id)
              .map((item, index) => (
                <motion.div
                  key={item.id}
                  layoutId={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-lg border ${getStageColor(item.stage)} cursor-move hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={`text-xs ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Edit3 className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem><Copy className="w-4 h-4 mr-2" /> Duplicate</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <Calendar className="w-3 h-3" />
                    {item.dueDate}
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-white dark:bg-slate-700 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  {item.metrics.impressions > 0 && (
                    <div className="mt-2 pt-2 border-t text-xs text-slate-500 grid grid-cols-3 gap-2">
                      <span>👁 {item.metrics.impressions.toLocaleString()}</span>
                      <span>🖱 {item.metrics.clicks}</span>
                      <span>✅ {item.metrics.conversions}</span>
                    </div>
                  )}
                </motion.div>
              ))}
          </div>
          
          <Button variant="ghost" className="w-full justify-start text-slate-500" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Campaign
          </Button>
        </div>
      ))}
    </div>
  );
};

// A/B Test Card Component
const ABTestCard = ({ test }) => {
  const isWinnerA = test.winner === 'a';
  const isWinnerB = test.winner === 'b';
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{test.name}</CardTitle>
            <CardDescription className="text-xs">
              {test.type.charAt(0).toUpperCase() + test.type.slice(1)} test • Started {test.startDate}
            </CardDescription>
          </div>
          <Badge 
            variant={test.status === 'running' ? 'default' : 'secondary'}
            className={test.status === 'running' ? 'bg-blue-500' : ''}
          >
            {test.status === 'running' ? (
              <><Play className="w-3 h-3 mr-1" /> Running</>
            ) : (
              <><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</>
            )}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Variants */}
        <div className="space-y-2">
          {test.variants.map((variant, i) => (
            <div 
              key={variant.id}
              className={`p-3 rounded-lg border ${
                (i === 0 && isWinnerA) || (i === 1 && isWinnerB) 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200' 
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{variant.name}</span>
                {(i === 0 && isWinnerA) || (i === 1 && isWinnerB) && (
                  <Badge className="bg-green-500 text-white">
                    <Trophy className="w-3 h-3 mr-1" />
                    Winner
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                "{variant.content}"
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Traffic: {variant.traffic}%</span>
                <span className={`font-medium ${
                  variant.conversionRate >= 5 ? 'text-green-600' : 'text-slate-600'
                }`}>
                  {variant.conversionRate}% conv.
                </span>
              </div>
              <Progress 
                value={variant.conversionRate * 10} 
                className="h-1.5 mt-1"
              />
            </div>
          ))}
        </div>
        
        {/* Confidence */}
        {test.status === 'running' && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Confidence Level</span>
            <span className={`font-medium ${
              test.confidence >= 90 ? 'text-green-600' : 
              test.confidence >= 70 ? 'text-amber-600' : 'text-slate-600'
            }`}>
              {test.confidence}%
            </span>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2">
          {test.status === 'running' ? (
            <>
              <Button variant="outline" size="sm" className="flex-1">
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </Button>
              <Button size="sm" className="flex-1 bg-blue-500 hover:bg-blue-600">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                End Test
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" className="flex-1">
              <RotateCcw className="w-4 h-4 mr-1" />
              Run Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Review Automation Component
const ReviewAutomation = () => {
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [requestDelay, setRequestDelay] = useState(3);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Automated Review Requests</h3>
          <p className="text-sm text-slate-500">Send review requests automatically after service completion</p>
        </div>
        <Switch 
          checked={automationEnabled} 
          onCheckedChange={setAutomationEnabled}
        />
      </div>
      
      {automationEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>Send after {requestDelay} days</Label>
            <Slider 
              value={[requestDelay]} 
              onValueChange={([v]) => setRequestDelay(v)}
              min={1} 
              max={14} 
              step={1}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Request Message Template</Label>
            <Textarea 
              defaultValue="Hi {customer_name}, thank you for choosing us! We'd love to hear about your experience. Would you mind leaving us a quick review? It takes less than a minute and helps us grow."
              rows={4}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {['Google', 'Yelp', 'Facebook'].map(platform => (
              <div key={platform} className="flex items-center space-x-2">
                <Checkbox id={platform} defaultChecked />
                <Label htmlFor={platform}>{platform}</Label>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        {[
          { label: 'Sent', value: '156', change: '+12%' },
          { label: 'Opened', value: '89%', change: '+5%' },
          { label: 'Converted', value: '34%', change: '+8%' }
        ].map(stat => (
          <div key={stat.label} className="text-center">
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
            <div className="text-xs text-green-600">{stat.change}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Citation Tracker Component
const CitationTracker = () => {
  return (
    <div className="space-y-4">
      {citationData.map((citation, index) => (
        <motion.div
          key={citation.platform}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center justify-between p-4 rounded-lg border hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              citation.status === 'complete' ? 'bg-green-100 text-green-600' :
              citation.status === 'incomplete' ? 'bg-red-100 text-red-600' :
              'bg-amber-100 text-amber-600'
            }`}>
              {citation.status === 'complete' ? <CheckCircle2 className="w-5 h-5" /> :
               citation.status === 'incomplete' ? <AlertCircle className="w-5 h-5" /> :
               <Clock className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="font-medium">{citation.platform}</h4>
              <p className="text-xs text-slate-500">{citation.url}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm font-medium">
                {citation.listings} listing{citation.listings !== 1 ? 's' : ''}
              </div>
              <div className="text-xs text-slate-500">
                {citation.accuracy}% accurate
              </div>
            </div>
            
            <div className="w-24">
              <Progress value={citation.accuracy} className="h-2" />
            </div>
            
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ROI Dashboard Component
const ROIDashboard = () => {
  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];
  
  const pieData = [
    { name: 'SEO', value: 45, color: '#3b82f6' },
    { name: 'Reviews', value: 25, color: '#22c55e' },
    { name: 'Ads', value: 20, color: '#f59e0b' },
    { name: 'Content', value: 10, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Spend', value: '$8,800', change: '+15%', icon: TrendingUp, positive: true },
          { label: 'Revenue', value: '$27,600', change: '+28%', icon: DollarSign, positive: true },
          { label: 'Avg ROI', value: '211%', change: '+12%', icon: Percent, positive: true },
          { label: 'CAC', value: '$48', change: '-8%', icon: Users, positive: true }
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <stat.icon className="w-5 h-5 text-slate-400" />
                <Badge variant={stat.positive ? 'default' : 'destructive'} className="text-xs">
                  {stat.change}
                </Badge>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ROI Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={roiData}>
                <defs>
                  <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="roi" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRoi)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Investment Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map(item => (
                <div key={item.name} className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Competitor Monitoring Component
const CompetitorMonitoring = () => {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 text-sm font-medium">Business</th>
              <th className="text-center p-3 text-sm font-medium">Rating</th>
              <th className="text-center p-3 text-sm font-medium">Reviews</th>
              <th className="text-center p-3 text-sm font-medium">Visibility</th>
              <th className="text-center p-3 text-sm font-medium">Keywords</th>
              <th className="text-right p-3 text-sm font-medium">Trend</th>
            </tr>
          </thead>
          <tbody>
            {competitorData.map((comp, index) => (
              <tr key={comp.name} className={`border-b ${index === 0 ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {index === 0 && <Crown className="w-4 h-4 text-amber-500" />}
                    <span className={index === 0 ? 'font-semibold' : ''}>{comp.name}</span>
                  </div>
                </td>
                <td className="text-center p-3">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    {comp.rating}
                  </div>
                </td>
                <td className="text-center p-3">{comp.reviews}</td>
                <td className="text-center p-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${index === 0 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${comp.visibility}%` }}
                      />
                    </div>
                    <span className="text-xs">{comp.visibility}%</span>
                  </div>
                </td>
                <td className="text-center p-3">{comp.keywords}</td>
                <td className="text-right p-3">
                  {index === 0 ? (
                    <Badge className="bg-green-100 text-green-700">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +12%
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-500">
                      <ArrowDownRight className="w-3 h-3 mr-1" />
                      -3%
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Competitor
        </Button>
        <Button variant="ghost" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>
    </div>
  );
};

// Import DollarSign
import { DollarSign } from 'lucide-react';

// Main GrowthMode Component
const GrowthMode = () => {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [pipelineData, setPipelineData] = useState(initialPipelineData);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              Growth Mode
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Advanced tools for scaling your local presence
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active Campaigns', value: '4', change: '+2', icon: Megaphone },
            { label: 'A/B Tests Running', value: '2', change: '0', icon: Split },
            { label: 'New Reviews', value: '12', change: '+5', icon: MessageSquare },
            { label: 'ROI This Month', value: '220%', change: '+15%', icon: Percent }
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <stat.icon className="w-5 h-5 text-slate-400" />
                  <Badge variant="secondary" className="text-xs">
                    {stat.change}
                  </Badge>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-slate-500">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 lg:w-auto">
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="abtests">A/B Tests</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="citations">Citations</TabsTrigger>
            <TabsTrigger value="roi">ROI</TabsTrigger>
            <TabsTrigger value="competitors">Competitors</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Pipeline</CardTitle>
                <CardDescription>Drag and drop to manage your campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <KanbanBoard data={pipelineData} onUpdate={setPipelineData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="abtests" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Active A/B Tests</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Test
              </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {abTestData.map(test => (
                <ABTestCard key={test.id} test={test} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Review Automation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewAutomation />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Reviews</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {reviewData.map(review => (
                    <div key={review.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{review.author}</span>
                          <Badge variant="outline" className="text-xs">{review.platform}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {review.content}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-500">{review.date}</span>
                        {!review.responded && (
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Reply
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="citations">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Citation Building Tracker</CardTitle>
                    <CardDescription>Monitor your business listings across the web</CardDescription>
                  </div>
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    4/6 Complete
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CitationTracker />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roi">
            <Card>
              <CardHeader>
                <CardTitle>ROI Tracking Dashboard</CardTitle>
                <CardDescription>Measure the impact of your local SEO efforts</CardDescription>
              </CardHeader>
              <CardContent>
                <ROIDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="competitors">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Competitor Monitoring</CardTitle>
                    <CardDescription>Track how you compare to local competitors</CardDescription>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">
                    <Trophy className="w-3 h-3 mr-1" />
                    Rank #1
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CompetitorMonitoring />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Import Split icon
import { Split } from 'lucide-react';

export default GrowthMode;
