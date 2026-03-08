import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, CheckCircle2, Clock, Trash2, RefreshCw, RotateCcw, Zap, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await base44.entities.JobQueue.list('-created_date', 100);
      setJobs(data);
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (jobId) => {
    try {
      setRetrying(true);
      await base44.functions.invoke('jobQueue/retryJob', { job_id: jobId });
      toast.success('Job requeued');
      loadJobs();
    } catch (error) {
      toast.error('Failed to retry job');
    } finally {
      setRetrying(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Delete this job?')) return;
    try {
      await base44.entities.JobQueue.delete(jobId);
      setJobs(jobs.filter(j => j.id !== jobId));
      toast.success('Job deleted');
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const handleClearCompleted = async () => {
    if (!window.confirm('Clear all completed jobs?')) return;
    try {
      const completedJobs = jobs.filter(j => j.status === 'completed');
      await Promise.all(completedJobs.map(j => base44.entities.JobQueue.delete(j.id)));
      setJobs(jobs.filter(j => j.status !== 'completed'));
      toast.success(`Cleared ${completedJobs.length} completed jobs`);
    } catch (error) {
      toast.error('Failed to clear jobs');
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesType = typeFilter === 'all' || job.job_type === typeFilter;
    return matchesStatus && matchesType;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Zap className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'bg-green-500/20 text-green-400',
      failed: 'bg-red-500/20 text-red-400',
      processing: 'bg-blue-500/20 text-blue-400',
      pending: 'bg-yellow-500/20 text-yellow-400'
    };
    return variants[status] || 'bg-gray-500/20 text-gray-400';
  };

  const stats = {
    total: jobs.length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    processing: jobs.filter(j => j.status === 'processing').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Queue</h1>
            <p className="text-gray-600 mt-1">Background job processing and monitoring</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={loadJobs}
              disabled={loading}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleClearCompleted}
              disabled={stats.completed === 0}
              variant="outline"
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Completed
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Jobs</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <Zap className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Completed</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{stats.completed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Processing</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{stats.processing}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Failed</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{stats.failed}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 block mb-2">Filter by Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-2">Filter by Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="send_email">Send Email</SelectItem>
                    <SelectItem value="generate_content">Generate Content</SelectItem>
                    <SelectItem value="send_nurture">Send Nurture</SelectItem>
                    <SelectItem value="calculate_score">Calculate Score</SelectItem>
                    <SelectItem value="sync_metrics">Sync Metrics</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Jobs ({filteredJobs.length})</span>
              <Badge variant="outline">{stats.total} total</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600">No jobs in queue</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="w-12">Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map((job) => (
                      <TableRow key={job.id} className="border-gray-200 hover:bg-gray-50">
                        <TableCell className="text-center">
                          {getStatusIcon(job.status)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {job.job_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${job.priority <= 3 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                            P{job.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {job.attempts}/{job.max_attempts}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(job.created_date).toLocaleString()}
                        </TableCell>
                        <TableCell className="flex gap-2">
                          {job.status === 'failed' && (
                            <Button
                              onClick={() => handleRetry(job.id)}
                              disabled={retrying}
                              size="sm"
                              variant="outline"
                              className="h-8 px-2"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            onClick={() => handleDeleteJob(job.id)}
                            size="sm"
                            variant="outline"
                            className="h-8 px-2"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}