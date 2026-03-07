import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Download, TrendingUp, Users, Mail, 
  Building2, Calendar, RefreshCw, AlertCircle,
  CheckCircle2, Clock, XCircle, Loader2, Target, Zap
} from 'lucide-react';
import EnhancedLeadDetailModal from './EnhancedLeadDetailModal';
import ActionPlanViewer from './ActionPlanViewer';

export default function AdminLeadsSection({ expanded = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionPlanLeadId, setActionPlanLeadId] = useState(null);
  
  const { data: leads = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-leads-section', expanded],
    queryFn: () => base44.entities.Lead.list('-created_date', expanded ? 500 : 50),
    staleTime: 20000,
    gcTime: 180000,
  });

  const { data: nurtures = [] } = useQuery({
    queryKey: ['admin-nurtures-map'],
    queryFn: () => base44.entities.LeadNurture.filter({ status: 'active' }, '-updated_date', 500),
    staleTime: 30000,
  });

  // Build a quick lookup: lead_id -> active nurture record
  const nurtureByLeadId = React.useMemo(() => {
    return nurtures.reduce((acc, n) => {
      if (n.lead_id && !acc[n.lead_id]) acc[n.lead_id] = n;
      return acc;
    }, {});
  }, [nurtures]);

  // Filter logic
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm ||
      lead.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || lead.business_category === categoryFilter;
    
    const matchesScore = scoreFilter === 'all' || (
      scoreFilter === 'high' ? lead.health_score >= 70 :
      scoreFilter === 'medium' ? lead.health_score >= 40 && lead.health_score < 70 :
      lead.health_score < 40
    );

    return matchesSearch && matchesStatus && matchesCategory && matchesScore;
  });

  // Get unique categories from leads
  const categories = [...new Set(leads.map(l => l.business_category).filter(Boolean))];

  // Statistics
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    converted: leads.filter(l => l.status === 'converted').length,
    avgScore: Math.round(leads.reduce((acc, l) => acc + (l.health_score || 0), 0) / (leads.length || 1))
  };

  const handleExport = async () => {
    const csv = [
      ['Business', 'Email', 'Category', 'Score', 'Status', 'Pain Point', 'Created'].join(','),
      ...filteredLeads.map(l => [
        l.business_name || '-',
        l.email,
        l.business_category || '-',
        l.health_score || 0,
        l.status || 'new',
        l.pain_point || '-',
        new Date(l.created_date).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new': return <Clock className="w-3 h-3" />;
      case 'qualified': return <CheckCircle2 className="w-3 h-3" />;
      case 'converted': return <CheckCircle2 className="w-3 h-3" />;
      case 'lost': return <XCircle className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'qualified': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'converted': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'lost': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getNurtureStage = (leadId) => {
    const n = nurtureByLeadId[leadId];
    if (!n) return null;
    const step = n.current_step || 0;
    const total = n.total_steps || 1;
    const pct = Math.round((step / total) * 100);
    const seqLabel = n.sequence_name
      ? n.sequence_name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).slice(0, 20)
      : 'Nurture';
    return { step, total, pct, seqLabel, nextDate: n.next_email_date };
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (score >= 40) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const handleLeadClick = (lead) => {
    setSelectedLead(lead);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedLead(null);
  };

  const handleModalUpdate = async () => {
    refetch();
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await base44.entities.Lead.update(leadId, { status: newStatus });
      
      // If marked as converted/closed, trigger welcome email
      if (newStatus === 'converted') {
        await base44.functions.invoke('nurture/closedDealWelcome', { lead_id: leadId });
      }
      
      refetch();
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  return (
    <>
      <EnhancedLeadDetailModal
        lead={selectedLead}
        open={modalOpen}
        onClose={handleModalClose}
        onUpdate={handleModalUpdate}
      />

      {actionPlanLeadId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">AI Action Plan & Roadmap</h3>
              <Button variant="outline" onClick={() => setActionPlanLeadId(null)}>
                Close
              </Button>
            </div>
            <div className="p-6">
              <ActionPlanViewer leadId={actionPlanLeadId} onRefresh={refetch} />
            </div>
          </div>
        </div>
      )}

      <Card className={`border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm ${expanded ? 'col-span-full' : 'col-span-2'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                Leads
                {leads.length > 0 && (
                  <Badge variant="outline" className="ml-2 text-xs border-gray-600 text-gray-300 bg-gray-800/50">
                    {filteredLeads.length} / {leads.length}
                  </Badge>
                )}
              </CardTitle>
              {expanded && (
                <CardDescription className="text-xs text-gray-400 mt-1">
                  Avg Score: {stats.avgScore}/100 • {stats.new} new • {stats.qualified} qualified • {stats.converted} converted
                </CardDescription>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => refetch()}
              variant="ghost" 
              size="sm"
              disabled={isRefetching}
              className="gap-2 text-gray-400 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              onClick={handleExport} 
              variant="outline" 
              size="sm" 
              className="gap-2 border-gray-700 hover:border-[#c8ff00] hover:text-[#c8ff00]"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Quick Stats - Only in expanded view */}
        {expanded && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4"
          >
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">New</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.new}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-gray-400">Qualified</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.qualified}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">Converted</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.converted}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#c8ff00]/10 border border-[#c8ff00]/20">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-[#c8ff00]" />
                <span className="text-xs text-gray-400">Total</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </motion.div>
        )}
      </CardHeader>

      <CardContent>
        {/* Filters */}
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 space-y-3"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by business name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={scoreFilter} onValueChange={setScoreFilter}>
                <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                  <SelectValue placeholder="Filter by score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="high">High (70-100)</SelectItem>
                  <SelectItem value="medium">Medium (40-69)</SelectItem>
                  <SelectItem value="low">Low (0-39)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}

        {/* Table */}
        <div className="rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 bg-gray-900/50">
                  <TableHead className="text-gray-300 font-semibold">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Business
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-300 font-semibold">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-300 font-semibold">Category</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Score</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Status</TableHead>
                  <TableHead className="text-gray-300 font-semibold">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Nurture
                    </div>
                  </TableHead>
                  {expanded && (
                    <TableHead className="text-gray-300 font-semibold">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Created
                      </div>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={expanded ? 6 : 5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 text-[#c8ff00] animate-spin" />
                        <p className="text-sm text-gray-400">Loading leads...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={expanded ? 6 : 5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <AlertCircle className="w-8 h-8 text-gray-600" />
                        <p className="text-sm text-gray-400">No leads found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {filteredLeads.slice(0, expanded ? 100 : 10).map((lead, index) => (
                      <motion.tr
                        key={lead.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-gray-700 hover:bg-gray-800/50 transition-colors cursor-pointer"
                        onClick={() => handleLeadClick(lead)}
                      >
                        <TableCell className="text-white font-medium">
                          {lead.business_name || <span className="text-gray-500 italic">No name</span>}
                        </TableCell>
                        <TableCell className="text-gray-400 text-sm">
                          {lead.email}
                        </TableCell>
                        <TableCell>
                          {lead.business_category ? (
                            <Badge className="bg-gray-700/50 text-gray-200 border-gray-600 text-xs">
                              {lead.business_category.replace(/_/g, ' ')}
                            </Badge>
                          ) : (
                            <span className="text-gray-600 text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getScoreColor(lead.health_score)} border font-semibold`}>
                            {lead.health_score || 0}/100
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getStatusColor(lead.status)} border gap-1`}>
                              {getStatusIcon(lead.status)}
                              {lead.status || 'new'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionPlanLeadId(lead.id);
                              }}
                            >
                              <Target className="w-4 h-4 text-blue-400" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {(() => {
                            const stage = getNurtureStage(lead.id);
                            if (!stage) return <span className="text-gray-600 text-xs">—</span>;
                            return (
                              <div className="space-y-1 min-w-[110px]">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-xs text-gray-300 truncate max-w-[80px]" title={stage.seqLabel}>
                                    {stage.seqLabel}
                                  </span>
                                  <span className="text-xs text-[#c8ff00] font-semibold whitespace-nowrap">
                                    {stage.step}/{stage.total}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-1.5">
                                  <div
                                    className="bg-[#c8ff00] h-1.5 rounded-full transition-all"
                                    style={{ width: `${stage.pct}%` }}
                                  />
                                </div>
                                {stage.nextDate && (
                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(stage.nextDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </TableCell>
                        {expanded && (
                          <TableCell className="text-gray-400 text-sm">
                            {new Date(lead.created_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </TableCell>
                        )}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Show more indicator */}
        {!expanded && filteredLeads.length > 10 && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Showing 10 of {filteredLeads.length} leads
            </p>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}