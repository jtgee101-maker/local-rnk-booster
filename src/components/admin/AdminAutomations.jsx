import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Play, Pause, Plus, Edit, Trash2, Loader2, History } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import AutomationEditor from './AutomationEditor';
import AutomationHistory from './AutomationHistory';

export default function AdminAutomations() {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadAutomations();
  }, []);

  const loadAutomations = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('admin/listAutomations', {});
      setAutomations(response.data?.automations || []);
    } catch (error) {
      console.error('Failed to load automations:', error);
      toast.error('Failed to load automations');
      
      // Fallback to mock data if backend not ready
      const mockAutomations = [
        {
          id: 1,
          name: 'Process Lead Nurture Emails',
          type: 'scheduled',
          status: 'active',
          frequency: 'Every 6 hours',
          lastRun: '2 hours ago',
          nextRun: '4 hours from now',
          successRate: '100%'
        },
        {
          id: 2,
          name: 'Send Abandoned Cart Emails',
          type: 'scheduled',
          status: 'active',
          frequency: 'Daily at 3 PM EST',
          lastRun: '1 hour ago',
          nextRun: 'Tomorrow 3 PM',
          successRate: '98%'
        },
        {
          id: 3,
          name: 'Start Nurture for New Leads',
          type: 'entity',
          status: 'active',
          frequency: 'On Lead Creation',
          lastRun: '5 minutes ago',
          nextRun: 'Real-time',
          successRate: '99%'
        },
        {
          id: 4,
          name: 'Post-Conversion Nurture',
          type: 'scheduled',
          status: 'active',
          frequency: 'Every 6 hours',
          lastRun: '30 minutes ago',
          nextRun: '5.5 hours from now',
          successRate: '97%'
        }
      ];

      setAutomations(mockAutomations);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (automation) => {
    setActionLoading(automation.id);
    try {
      const response = await base44.functions.invoke('admin/toggleAutomation', { 
        automation_id: automation.id 
      });
      
      if (response?.data?.success || response?.success) {
        toast.success(`Automation ${automation.is_active ? 'paused' : 'resumed'}`);
        await loadAutomations();
      } else {
        throw new Error(response?.data?.error || 'Failed to toggle automation');
      }
    } catch (error) {
      console.error('Toggle failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      toast.error('Failed to toggle: ' + errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (automation) => {
    if (!confirm(`Delete automation "${automation.name}"?`)) return;
    
    setActionLoading(automation.id);
    try {
      const response = await base44.functions.invoke('admin/deleteAutomation', { 
        automation_id: automation.id 
      });
      
      if (response?.data?.success || response?.success) {
        toast.success('Automation deleted');
        await loadAutomations();
      } else {
        throw new Error(response?.data?.error || 'Failed to delete automation');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      toast.error('Failed to delete: ' + errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (automation) => {
    setSelectedAutomation(automation);
    setEditorOpen(true);
  };

  const handleCreate = () => {
    setSelectedAutomation(null);
    setEditorOpen(true);
  };

  const handleEditorClose = () => {
    setEditorOpen(false);
    setSelectedAutomation(null);
  };

  const handleEditorSave = () => {
    loadAutomations();
  };

  const handleViewHistory = (automation) => {
    setSelectedAutomation(automation);
    setHistoryOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#c8ff00] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Active Automations</h3>
        <Button 
          onClick={handleCreate}
          className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Automation
        </Button>
      </div>

      <AutomationEditor
        automation={selectedAutomation}
        open={editorOpen}
        onClose={handleEditorClose}
        onSave={handleEditorSave}
      />
      
      <AutomationHistory
        automation={selectedAutomation}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
      {automations.map((automation) => (
        <Card key={automation.id} className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-[#c8ff00]" />
                  <h3 className="text-lg font-semibold text-white">{automation.name}</h3>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[#c8ff00]">{automation.type}</Badge>
                  <Badge className={
                    automation.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }>
                    {automation.status}
                  </Badge>
                  <Badge variant="outline">{automation.successRate} success</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleViewHistory(automation)}
                  title="View History"
                >
                  <History className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleEdit(automation)}
                  disabled={actionLoading === automation.id}
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleToggle(automation)}
                  disabled={actionLoading === automation.id}
                  title={automation.status === 'active' ? 'Pause' : 'Resume'}
                >
                  {actionLoading === automation.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : automation.status === 'active' ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDelete(automation)}
                  disabled={actionLoading === automation.id}
                  title="Delete"
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Frequency</p>
                <p className="text-white font-medium">{automation.frequency}</p>
              </div>
              <div>
                <p className="text-gray-400">Last Run</p>
                <p className="text-white font-medium">{automation.lastRun}</p>
              </div>
              <div>
                <p className="text-gray-400">Next Run</p>
                <p className="text-white font-medium">{automation.nextRun}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}