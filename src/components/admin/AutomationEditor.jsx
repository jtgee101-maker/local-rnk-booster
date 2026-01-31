import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AutomationEditor({ automation, open, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [availableFunctions, setAvailableFunctions] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    automation_type: 'scheduled',
    function_name: '',
    description: '',
    is_active: true,
    schedule_type: 'simple',
    repeat_interval: 1,
    repeat_unit: 'hours',
    start_time: '09:00',
    entity_name: '',
    event_types: ['create']
  });

  useEffect(() => {
    if (open) {
      loadFunctions();
      if (automation) {
        setFormData({
          name: automation.name || '',
          automation_type: automation.automation_type || 'scheduled',
          function_name: automation.function_name || '',
          description: automation.description || '',
          is_active: automation.is_active !== false,
          schedule_type: automation.schedule_type || 'simple',
          repeat_interval: automation.repeat_interval || 1,
          repeat_unit: automation.repeat_unit || 'hours',
          start_time: automation.start_time || '09:00',
          entity_name: automation.entity_name || '',
          event_types: automation.event_types || ['create']
        });
      }
    }
  }, [open, automation]);

  const loadFunctions = async () => {
    try {
      // Mock function list - in production, this would come from an API
      setAvailableFunctions([
        'processLeadNurture',
        'sendAbandonedCartReminders',
        'postConversionNurture',
        'startLeadNurture',
        'sendUpsellEmail',
        'notifyAdminNewLead'
      ]);
    } catch (error) {
      console.error('Failed to load functions:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.function_name) {
      toast.error('Name and function are required');
      return;
    }

    if (formData.automation_type === 'scheduled') {
      if (formData.repeat_interval < 1) {
        toast.error('Interval must be at least 1');
        return;
      }
      if (formData.repeat_unit === 'minutes' && formData.repeat_interval < 5) {
        toast.error('Minimum interval is 5 minutes');
        return;
      }
    }

    if (formData.automation_type === 'entity') {
      if (!formData.entity_name) {
        toast.error('Entity name is required for entity automations');
        return;
      }
      if (!formData.event_types || formData.event_types.length === 0) {
        toast.error('At least one event type is required');
        return;
      }
    }

    setLoading(true);
    try {
      if (automation?.id) {
        // Update existing
        await base44.functions.invoke('admin/updateAutomation', {
          automation_id: automation.id,
          ...formData
        });
        toast.success('Automation updated successfully');
      } else {
        // Create new
        await base44.functions.invoke('admin/createAutomation', formData);
        toast.success('Automation created successfully');
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save automation:', error);
      toast.error('Failed to save automation: ' + (error.message || 'Unknown error'));
      
      await base44.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'high',
        message: 'Failed to save automation',
        stack_trace: error.stack || error.message,
        metadata: { component: 'AutomationEditor', formData }
      }).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const handleEventTypeToggle = (eventType) => {
    const current = formData.event_types || [];
    if (current.includes(eventType)) {
      setFormData({ ...formData, event_types: current.filter(t => t !== eventType) });
    } else {
      setFormData({ ...formData, event_types: [...current, eventType] });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {automation ? 'Edit Automation' : 'Create New Automation'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <Label className="text-gray-300">Automation Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Process Lead Nurture Emails"
              className="bg-gray-800 border-gray-700 text-white mt-1"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-gray-300">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What does this automation do?"
              className="bg-gray-800 border-gray-700 text-white mt-1"
              rows={2}
            />
          </div>

          {/* Automation Type */}
          <div>
            <Label className="text-gray-300">Automation Type *</Label>
            <Select 
              value={formData.automation_type} 
              onValueChange={(value) => setFormData({ ...formData, automation_type: value })}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled (Time-based)</SelectItem>
                <SelectItem value="entity">Entity Trigger (On data change)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Function Name */}
          <div>
            <Label className="text-gray-300">Backend Function *</Label>
            <Select 
              value={formData.function_name} 
              onValueChange={(value) => setFormData({ ...formData, function_name: value })}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
                <SelectValue placeholder="Select function to execute" />
              </SelectTrigger>
              <SelectContent>
                {availableFunctions.map(func => (
                  <SelectItem key={func} value={func}>{func}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scheduled Settings */}
          {formData.automation_type === 'scheduled' && (
            <div className="space-y-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-400">Schedule Configuration</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-300 text-xs">Repeat Every</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.repeat_interval}
                    onChange={(e) => setFormData({ ...formData, repeat_interval: parseInt(e.target.value) })}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300 text-xs">Unit</Label>
                  <Select 
                    value={formData.repeat_unit} 
                    onValueChange={(value) => setFormData({ ...formData, repeat_unit: value })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-gray-300 text-xs">Start Time (optional)</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                />
              </div>
            </div>
          )}

          {/* Entity Settings */}
          {formData.automation_type === 'entity' && (
            <div className="space-y-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <h4 className="text-sm font-semibold text-purple-400">Entity Trigger Configuration</h4>
              
              <div>
                <Label className="text-gray-300 text-xs">Entity Name *</Label>
                <Input
                  value={formData.entity_name}
                  onChange={(e) => setFormData({ ...formData, entity_name: e.target.value })}
                  placeholder="e.g., Lead, Order, User"
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                />
              </div>

              <div>
                <Label className="text-gray-300 text-xs">Trigger On Events *</Label>
                <div className="flex gap-2 mt-2">
                  {['create', 'update', 'delete'].map(event => (
                    <Badge
                      key={event}
                      onClick={() => handleEventTypeToggle(event)}
                      className={`cursor-pointer transition-colors ${
                        formData.event_types?.includes(event)
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {event}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="is_active" className="text-gray-300 cursor-pointer">
              Activate immediately after saving
            </Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {automation ? 'Update' : 'Create'} Automation
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}