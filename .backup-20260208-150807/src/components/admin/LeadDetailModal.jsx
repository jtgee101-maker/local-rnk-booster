import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { 
  Building2, Mail, Phone, MapPin, Calendar, TrendingDown, 
  AlertCircle, Target, Clock, Star, Save, Loader2, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

export default function LeadDetailModal({ lead, open, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState(lead?.status || 'new');
  const [notes, setNotes] = useState(lead?.admin_notes || '');

  if (!lead) return null;

  const handleStatusUpdate = async () => {
    if (newStatus === lead.status) {
      toast.info('Status unchanged');
      return;
    }

    setLoading(true);
    try {
      await base44.entities.Lead.update(lead.id, { status: newStatus });
      toast.success(`Lead status updated to ${newStatus}`);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to update status:', error);
      const errorMessage = error.message || 'Unknown error';
      toast.error('Failed to update status: ' + errorMessage);
      
      try {
        await base44.entities.ErrorLog.create({
          error_type: 'system_error',
          severity: 'medium',
          message: 'Failed to update lead status',
          stack_trace: error.stack || error.message,
          metadata: { lead_id: lead.id, new_status: newStatus }
        });
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setLoading(true);
    try {
      await base44.entities.Lead.update(lead.id, { admin_notes: notes });
      toast.success('Notes saved');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to save notes:', error);
      const errorMessage = error.message || 'Unknown error';
      toast.error('Failed to save notes: ' + errorMessage);
      
      try {
        await base44.entities.ErrorLog.create({
          error_type: 'system_error',
          severity: 'low',
          message: 'Failed to save lead notes',
          stack_trace: error.stack || error.message,
          metadata: { lead_id: lead.id }
        });
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-400 bg-green-500/20';
    if (score >= 40) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-400';
      case 'contacted': return 'bg-cyan-500/20 text-cyan-400';
      case 'qualified': return 'bg-purple-500/20 text-purple-400';
      case 'converted': return 'bg-green-500/20 text-green-400';
      case 'lost': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl flex items-center gap-3 mb-2">
                <Building2 className="w-6 h-6 text-[#c8ff00]" />
                {lead.business_name || 'Unnamed Business'}
              </DialogTitle>
              <div className="flex gap-2 flex-wrap">
                <Badge className={getStatusColor(lead.status)}>
                  {lead.status || 'new'}
                </Badge>
                {lead.business_category && (
                  <Badge variant="outline" className="border-gray-600">
                    {lead.business_category.replace(/_/g, ' ')}
                  </Badge>
                )}
              </div>
            </div>
            <div className={`text-center p-3 rounded-lg ${getScoreColor(lead.health_score)}`}>
              <div className="text-3xl font-bold">{lead.health_score || 0}</div>
              <div className="text-xs opacity-70">Health Score</div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Contact Information */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Contact Information</h3>
              
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">{lead.email}</span>
              </div>
              
              {lead.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{lead.phone}</span>
                </div>
              )}
              
              {lead.address && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{lead.address}</span>
                </div>
              )}
              
              {lead.website && (
                <div className="flex items-center gap-3 text-sm">
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                  <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-[#c8ff00] hover:underline">
                    {lead.website}
                  </a>
                </div>
              )}
            </div>

            {/* GMB Metrics */}
            {lead.gmb_rating !== null && (
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Google Business Profile</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs text-gray-400">Rating</span>
                    </div>
                    <div className="text-lg font-semibold text-white">{lead.gmb_rating?.toFixed(1) || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Reviews</div>
                    <div className="text-lg font-semibold text-white">{lead.gmb_reviews_count || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Photos</div>
                    <div className="text-lg font-semibold text-white">{lead.gmb_photos_count || 0}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Quiz Data */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-2">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Quiz Responses</h3>
              
              {lead.pain_point && (
                <div className="flex items-start gap-3 text-sm">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-400">Main Pain Point</div>
                    <div className="text-gray-300">{lead.pain_point.replace(/_/g, ' ')}</div>
                  </div>
                </div>
              )}
              
              {lead.goals && lead.goals.length > 0 && (
                <div className="flex items-start gap-3 text-sm">
                  <Target className="w-4 h-4 text-[#c8ff00] mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-400">Business Goals</div>
                    <div className="text-gray-300">{lead.goals.join(', ')}</div>
                  </div>
                </div>
              )}
              
              {lead.timeline && (
                <div className="flex items-start gap-3 text-sm">
                  <Clock className="w-4 h-4 text-blue-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-400">Timeline</div>
                    <div className="text-gray-300">{lead.timeline.replace(/_/g, ' ')}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Timestamps */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-2">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Timeline</h3>
              
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-400">Created</div>
                  <div className="text-gray-300">{new Date(lead.created_date).toLocaleString()}</div>
                </div>
              </div>
              
              {lead.last_quiz_date && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-400">Last Quiz Submission</div>
                    <div className="text-gray-300">{new Date(lead.last_quiz_date).toLocaleString()}</div>
                  </div>
                </div>
              )}
              
              {lead.quiz_submission_count && lead.quiz_submission_count > 1 && (
                <div className="text-xs text-yellow-400">
                  ⚠️ Submitted quiz {lead.quiz_submission_count} times
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="issues" className="space-y-3">
            {lead.critical_issues && lead.critical_issues.length > 0 ? (
              lead.critical_issues.map((issue, idx) => (
                <div key={idx} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                  <TrendingDown className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">{issue}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No critical issues identified</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            {/* Status Update */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Update Status</h3>
              <div className="flex gap-2">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleStatusUpdate} 
                  disabled={loading || newStatus === lead.status}
                  className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Admin Notes */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Admin Notes</h3>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add internal notes about this lead..."
                className="bg-gray-900 border-gray-700 text-white mb-2"
                rows={4}
              />
              <Button 
                onClick={handleSaveNotes}
                disabled={loading}
                size="sm"
                className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Notes
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}