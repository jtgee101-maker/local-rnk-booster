import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Target, Plus, Edit, Trash2, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function AdvancedSegmentation() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);

  const { data: segments = [], refetch } = useQuery({
    queryKey: ['segments'],
    queryFn: async () => {
      const result = await base44.entities.Segment.list();
      return result;
    },
    initialData: []
  });

  const mockSegments = segments.length === 0 ? [
    {
      id: 1,
      name: 'Hot Leads - High Intent',
      description: 'A+ grade leads, health score 80+, timeline urgent',
      member_count: 23,
      conversion_rate: 45,
      type: 'dynamic',
      is_active: true
    },
    {
      id: 2,
      name: 'Need Nurturing',
      description: 'B/C grade leads, no recent contact',
      member_count: 89,
      conversion_rate: 18,
      type: 'dynamic',
      is_active: true
    },
    {
      id: 3,
      name: 'High LTV Potential',
      description: 'Medical/Professional category, 10+ reviews',
      member_count: 34,
      conversion_rate: 38,
      type: 'dynamic',
      is_active: true
    }
  ] : segments;

  const handleCreateSegment = () => {
    setSelectedSegment(null);
    setShowBuilder(true);
  };

  const handleEditSegment = (segment) => {
    setSelectedSegment(segment);
    setShowBuilder(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Advanced Segmentation</h3>
          <p className="text-sm text-gray-400">Create dynamic audience segments for targeted campaigns</p>
        </div>
        <Button onClick={handleCreateSegment} className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black">
          <Plus className="w-4 h-4 mr-2" />
          Create Segment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockSegments.map((segment) => (
          <Card key={segment.id} className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#c8ff00]" />
                  <Badge variant="outline" className="text-xs">
                    {segment.type}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEditSegment(segment)}>
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <h4 className="text-white font-semibold mb-1">{segment.name}</h4>
              <p className="text-xs text-gray-400 mb-3">{segment.description}</p>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Members</span>
                  <span className="text-white font-semibold">{segment.member_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Conversion Rate</span>
                  <Badge className="bg-green-500/20 text-green-400">
                    {segment.conversion_rate}%
                  </Badge>
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full mt-3">
                <Play className="w-3 h-3 mr-2" />
                Run Campaign
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <SegmentBuilder
        open={showBuilder}
        segment={selectedSegment}
        onClose={() => {
          setShowBuilder(false);
          setSelectedSegment(null);
        }}
        onSave={() => {
          refetch();
          setShowBuilder(false);
          setSelectedSegment(null);
        }}
      />
    </div>
  );
}

function SegmentBuilder({ open, segment, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: segment?.name || '',
    description: segment?.description || '',
    type: segment?.type || 'dynamic',
    criteria: segment?.criteria || {
      lead_score_min: 50,
      health_score_min: 50,
      categories: [],
      statuses: [],
      timeline: []
    }
  });

  const handleSave = async () => {
    try {
      if (segment) {
        await base44.entities.Segment.update(segment.id, formData);
        toast.success('Segment updated');
      } else {
        await base44.entities.Segment.create(formData);
        toast.success('Segment created');
      }
      onSave();
    } catch (error) {
      console.error('Failed to save segment:', error);
      toast.error('Failed to save segment');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>{segment ? 'Edit' : 'Create'} Segment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-gray-300">Segment Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., High Intent Leads"
              className="bg-gray-800 border-gray-700 text-white mt-1"
            />
          </div>

          <div>
            <Label className="text-gray-300">Description</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description"
              className="bg-gray-800 border-gray-700 text-white mt-1"
            />
          </div>

          <div>
            <Label className="text-gray-300">Type</Label>
            <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dynamic">Dynamic (Auto-update)</SelectItem>
                <SelectItem value="static">Static (Manual)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">Criteria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-300 text-sm">Minimum Lead Score: {formData.criteria.lead_score_min}</Label>
                <Slider
                  value={[formData.criteria.lead_score_min]}
                  onValueChange={([v]) => setFormData({
                    ...formData,
                    criteria: { ...formData.criteria, lead_score_min: v }
                  })}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-gray-300 text-sm">Minimum Health Score: {formData.criteria.health_score_min}</Label>
                <Slider
                  value={[formData.criteria.health_score_min]}
                  onValueChange={([v]) => setFormData({
                    ...formData,
                    criteria: { ...formData.criteria, health_score_min: v }
                  })}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black">
              {segment ? 'Update' : 'Create'} Segment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}