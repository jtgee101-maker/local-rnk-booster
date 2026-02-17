import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, Clock, ArrowDown, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { createLogger } from '@/lib/logger';

const logger = createLogger('NurtureSequenceBuilder');

export default function NurtureSequenceBuilder({ sequence, open, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [formData, setFormData] = useState({
    name: sequence?.name || '',
    description: sequence?.description || '',
    steps: sequence?.steps || [
      {
        id: 1,
        name: 'Welcome Email',
        template: 'welcome',
        delay_days: 0,
        delay_hours: 0,
        subject: '',
        content: ''
      }
    ]
  });

  const emailTemplates = [
    { value: 'welcome', label: 'Welcome Email' },
    { value: 'nurture_day1', label: 'Day 1 Follow-up' },
    { value: 'nurture_day3', label: 'Day 3 Value Email' },
    { value: 'nurture_day7', label: 'Day 7 Case Study' },
    { value: 'abandoned_cart', label: 'Abandoned Cart' },
    { value: 'custom', label: 'Custom Template' }
  ];

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [
        ...formData.steps,
        {
          id: Date.now(),
          name: `Step ${formData.steps.length + 1}`,
          template: 'custom',
          delay_days: 1,
          delay_hours: 0,
          subject: '',
          content: ''
        }
      ]
    });
  };

  const removeStep = (stepId) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter(s => s.id !== stepId)
    });
  };

  const updateStep = (stepId, updates) => {
    setFormData({
      ...formData,
      steps: formData.steps.map(s => s.id === stepId ? { ...s, ...updates } : s)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || formData.steps.length === 0) {
      toast.error('Sequence name and at least one step are required');
      return;
    }

    setLoading(true);
    try {
      // In production, this would save to backend
      logger.debug('Saving sequence:', formData);
      toast.success('Nurture sequence saved successfully');
      onSave && onSave(formData);
      onClose();
    } catch (error) {
      logger.error('Failed to save sequence:', error);
      toast.error('Failed to save sequence');
    } finally {
      setLoading(false);
    }
  };

  if (previewMode) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">Preview: {formData.name}</DialogTitle>
              <Button variant="outline" onClick={() => setPreviewMode(false)}>
                Exit Preview
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {formData.steps.map((step, index) => (
              <Card key={step.id} className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className="bg-blue-500">Step {index + 1}</Badge>
                    <h3 className="text-white font-semibold">{step.name}</h3>
                  </div>
                  <div className="text-sm text-gray-400 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Delay: {step.delay_days}d {step.delay_hours}h
                  </div>
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <div className="text-white font-semibold mb-2">{step.subject || '(No subject)'}</div>
                    <div className="text-gray-300 text-sm whitespace-pre-wrap">
                      {step.content || '(No content)'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {sequence ? 'Edit' : 'Create'} Nurture Sequence
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Sequence Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Welcome Series"
                className="bg-gray-800 border-gray-700 text-white mt-1"
                required
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
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300 text-lg">Email Steps</Label>
              <Button type="button" onClick={addStep} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </Button>
            </div>

            {formData.steps.map((step, index) => (
              <div key={step.id}>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className="bg-blue-500">Step {index + 1}</Badge>
                      {formData.steps.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStep(step.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-gray-400 text-xs">Step Name</Label>
                          <Input
                            value={step.name}
                            onChange={(e) => updateStep(step.id, { name: e.target.value })}
                            className="bg-gray-900 border-gray-700 text-white mt-1"
                            placeholder="e.g., Welcome Email"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-400 text-xs">Template</Label>
                          <Select 
                            value={step.template} 
                            onValueChange={(value) => updateStep(step.id, { template: value })}
                          >
                            <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {emailTemplates.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-gray-400 text-xs">Delay (Days)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={step.delay_days}
                            onChange={(e) => updateStep(step.id, { delay_days: parseInt(e.target.value) })}
                            className="bg-gray-900 border-gray-700 text-white mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-400 text-xs">Delay (Hours)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={step.delay_hours}
                            onChange={(e) => updateStep(step.id, { delay_hours: parseInt(e.target.value) })}
                            className="bg-gray-900 border-gray-700 text-white mt-1"
                          />
                        </div>
                      </div>

                      {step.template === 'custom' && (
                        <>
                          <div>
                            <Label className="text-gray-400 text-xs">Email Subject</Label>
                            <Input
                              value={step.subject}
                              onChange={(e) => updateStep(step.id, { subject: e.target.value })}
                              className="bg-gray-900 border-gray-700 text-white mt-1"
                              placeholder="Subject line"
                            />
                          </div>
                          <div>
                            <Label className="text-gray-400 text-xs">Email Content</Label>
                            <Textarea
                              value={step.content}
                              onChange={(e) => updateStep(step.id, { content: e.target.value })}
                              className="bg-gray-900 border-gray-700 text-white mt-1"
                              rows={4}
                              placeholder="Email body..."
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
                {index < formData.steps.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowDown className="w-5 h-5 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-gray-700">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setPreviewMode(true)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black">
                <Save className="w-4 h-4 mr-2" />
                Save Sequence
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}