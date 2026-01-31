import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Trash2, Download, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BulkActionBar({ selectedIds, entityType, onComplete, onClear }) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('');

  const handleBulkAction = async () => {
    if (!action) {
      toast.error('Please select an action');
      return;
    }

    if (action === 'delete') {
      if (!confirm(`Delete ${selectedIds.length} ${entityType}(s)?`)) return;
    }

    setLoading(true);
    try {
      switch (action) {
        case 'delete':
          await Promise.all(
            selectedIds.map(id => base44.entities[entityType].delete(id))
          );
          toast.success(`${selectedIds.length} ${entityType}(s) deleted`);
          break;

        case 'export':
          const items = await Promise.all(
            selectedIds.map(id => base44.entities[entityType].get(id))
          );
          const csv = convertToCSV(items);
          downloadCSV(csv, `${entityType}_export.csv`);
          toast.success('Export complete');
          break;

        case 'update_status':
          // This would be handled by parent component
          toast.info('Status update: Select status first');
          break;

        default:
          toast.error('Unknown action');
      }

      onComplete();
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast.error('Bulk action failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setLoading(true);
    try {
      await Promise.all(
        selectedIds.map(id => base44.entities[entityType].update(id, { status: newStatus }))
      );
      toast.success(`${selectedIds.length} ${entityType}(s) updated to ${newStatus}`);
      onComplete();
    } catch (error) {
      console.error('Status update failed:', error);
      toast.error('Status update failed');
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (items) => {
    if (!items.length) return '';
    const headers = Object.keys(items[0]);
    const rows = items.map(item => 
      headers.map(h => JSON.stringify(item[h] || '')).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-4 flex items-center gap-4">
        <Badge className="bg-[#c8ff00] text-black">
          <CheckSquare className="w-3 h-3 mr-1" />
          {selectedIds.length} selected
        </Badge>

        {entityType === 'Lead' && (
          <Select onValueChange={handleStatusUpdate} disabled={loading}>
            <SelectTrigger className="w-40 bg-gray-900 border-gray-700 text-white">
              <SelectValue placeholder="Change Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAction('export');
            handleBulkAction();
          }}
          disabled={loading}
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAction('delete');
            handleBulkAction();
          }}
          disabled={loading}
          className="text-red-400 hover:text-red-300"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4 mr-2" />
          )}
          Delete
        </Button>

        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}