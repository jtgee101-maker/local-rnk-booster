import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import { Mail, Phone, MapPin, Calendar, TrendingUp, 
  Star, MessageSquare, Save, Send, Target, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import GoalManagement from './GoalManagement';

export default function EnhancedLeadDetailModal({ lead, open, onClose, onUpdate }) {
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState(lead?.status || 'new');
  const [notes, setNotes] = useState(lead?.admin_notes || '');

  if (!lead) return null;

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await base44.entities.Lead.update(lead.id, { status: newStatus });
      setStatus(newStatus);
      toast.success('Lead status updated');
      onUpdate && onUpdate();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    setUpdating(true);
    try {
      await base44.entities.Lead.update(lead.id, { admin_notes: notes });
      toast.success('Notes saved');
      onUpdate && onUpdate();
    } catch (error) {
      console.error('Failed to save notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setUpdating(false);
    }
  };

  const handleSendEmail = () => {
    toast.info('Email functionality coming soon');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-400';
      case 'contacted': return 'bg-yellow-500/20 text-yellow-400';
      case 'qualified': return 'bg-purple-500/20 text-purple-400';
      case 'converted': return 'bg-green-500/20 text-green-400';
      case 'lost': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getGradeColor = (grade) => {
    if (!grade) return 'text-gray-400';
    if (grade.startsWith('A')) return 'text-green-400';
    if (grade.startsWith('B')) return 'text-blue-400';
    if (grade.startsWith('C')) return 'text-yellow-400';
    return 'text-red-400';
  };

  const healthScoreColor = lead.health_score >= 75 ? 'text-green-400' : 
                           lead.health_score >= 50 ? 'text-yellow-400' : 
                           lead.health_score >= 25 ? 'text-orange-400' : 'text-red-400';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{lead.business_name}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(status)}>
                  {status}
                </Badge>
                {lead.lead_grade && (
                  <Badge className="bg-gray-700 text-white">
                    Grade: <span className={`ml-1 font-bold ${getGradeColor(lead.lead_grade)}`}>
                      {lead.lead_grade}
                    </span>
                  </Badge>
                )}
                {lead.lead_score && (
                  <Badge className="bg-gray-700 text-white">
                    Score: {lead.lead_score}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${healthScoreColor}`}>
                {lead.health_score || 0}
              </div>
              <div className="text-xs text-gray-400">Health Score</div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="gmb">GMB Details</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="actions">Quick Actions</TabsTrigger>
          </TabsList>

          {/* Goals Tab */}
          <TabsContent value="goals">
            <GoalManagement leadId={lead?.id} onUpdate={onUpdate} />
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-400">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-white">{lead.email}</span>
                  </div>
                  {lead.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-white">{lead.phone}</span>
                    </div>
                  )}
                  {lead.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                      <span className="text-white text-sm">{lead.address}</span>
                    </div>
                  )}
                  {lead.website && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                      <a href={lead.website} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-400 hover:underline">
                        {lead.website}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-400">Business Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {lead.business_category && (
                    <div>
                      <div className="text-xs text-gray-500">Category</div>
                      <div className="text-white capitalize">
                        {lead.business_category.replace(/_/g, ' ')}
                      </div>
                    </div>
                  )}
                  {lead.pain_point && (
                    <div>
                      <div className="text-xs text-gray-500">Pain Point</div>
                      <div className="text-white capitalize">
                        {lead.pain_point.replace(/_/g, ' ')}
                      </div>
                    </div>
                  )}
                  {lead.timeline && (
                    <div>
                      <div className="text-xs text-gray-500">Timeline</div>
                      <Badge className="bg-blue-500/20 text-blue-400">
                        <Clock className="w-3 h-3 mr-1" />
                        {lead.timeline}
                      </Badge>
                    </div>
                  )}
                  {lead.goals && lead.goals.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Goals</div>
                      <div className="flex flex-wrap gap-1">
                        {lead.goals.map((goal, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            <Target className="w-3 h-3 mr-1" />
                            {goal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Health Score Breakdown */}
            {lead.critical_issues && lead.critical_issues.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-400">Critical Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {lead.critical_issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-red-400 mt-1">•</span>
                        <span className="text-gray-300">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* GMB Details Tab */}
          <TabsContent value="gmb" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-2xl font-bold text-white">
                      {lead.gmb_rating || 'N/A'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">GMB Rating</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-white mb-1">
                    {lead.gmb_reviews_count || 0}
                  </div>
                  <div className="text-xs text-gray-400">Total Reviews</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-white mb-1">
                    {lead.gmb_photos_count || 0}
                  </div>
                  <div className="text-xs text-gray-400">Photos</div>
                </CardContent>
              </Card>
            </div>

            {lead.gmb_reviews && lead.gmb_reviews.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-400">Recent Reviews</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {lead.gmb_reviews.slice(0, 3).map((review, i) => (
                    <div key={i} className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, j) => (
                            <Star
                              key={j}
                              className={`w-3 h-3 ${
                                j < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {review.relativePublishTimeDescription}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-3">
                        {review.text?.text || review.originalText?.text}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm text-gray-400">Lead History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-gray-500 mt-1" />
                  <div>
                    <div className="text-white text-sm">Lead Created</div>
                    <div className="text-xs text-gray-500">
                      {new Date(lead.created_date).toLocaleString()}
                    </div>
                  </div>
                </div>
                {lead.last_quiz_date && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-gray-500 mt-1" />
                    <div>
                      <div className="text-white text-sm">Last Quiz Submission</div>
                      <div className="text-xs text-gray-500">
                        {new Date(lead.last_quiz_date).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
                {lead.quiz_submission_count > 1 && (
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-4 h-4 text-gray-500 mt-1" />
                    <div>
                      <div className="text-white text-sm">
                        Quiz Submitted {lead.quiz_submission_count} times
                      </div>
                      <div className="text-xs text-gray-500">Highly engaged lead</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm text-gray-400">Admin Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this lead..."
                  className="bg-gray-900 border-gray-700 text-white mb-3"
                  rows={4}
                />
                <Button 
                  onClick={handleSaveNotes} 
                  disabled={updating}
                  className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Notes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Actions Tab */}
          <TabsContent value="actions" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm text-gray-400">Update Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={status} onValueChange={handleStatusUpdate} disabled={updating}>
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
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm text-gray-400">Communication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={handleSendEmail}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => toast.info('Feature coming soon')}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Add to Nurture Sequence
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}