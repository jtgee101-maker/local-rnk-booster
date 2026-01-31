import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { Download, Database, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DataBackupTools() {
  const [exporting, setExporting] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);
  const [backupType, setBackupType] = useState('all');

  const exportData = async () => {
    setExporting(true);
    try {
      const entities = {
        leads: await base44.entities.Lead.list('', 1000),
        orders: await base44.entities.Order.list('', 1000),
        emails: await base44.entities.EmailLog.list('', 1000),
        errors: await base44.entities.ErrorLog.list('', 500),
        nurtures: await base44.entities.LeadNurture.list('', 500),
        segments: await base44.entities.Segment.list('', 100)
      };

      const dataToExport = backupType === 'all' ? entities : { [backupType]: entities[backupType] };

      // Create comprehensive backup file
      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        appName: 'LocalRank Admin',
        data: dataToExport,
        stats: {
          leads: entities.leads.length,
          orders: entities.orders.length,
          emails: entities.emails.length,
          errors: entities.errors.length
        }
      };

      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${backupType}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      setLastBackup(new Date());
      toast.success(`Backup created successfully (${backupType})`);
    } catch (error) {
      console.error('Backup failed:', error);
      toast.error('Failed to create backup');
    } finally {
      setExporting(false);
    }
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const leads = await base44.entities.Lead.list('', 1000);
      const orders = await base44.entities.Order.list('', 1000);

      const csv = [
        ['Type', 'ID', 'Email', 'Business', 'Status', 'Amount', 'Date', 'Phone', 'Address'],
        ...leads.map(l => [
          'Lead',
          l.id,
          l.email,
          l.business_name || 'N/A',
          l.status,
          '',
          l.created_date,
          l.phone || '',
          l.address || ''
        ]),
        ...orders.map(o => [
          'Order',
          o.id,
          o.email,
          '',
          o.status,
          o.total_amount,
          o.created_date,
          '',
          ''
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-csv-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast.success('CSV backup created');
    } catch (error) {
      toast.error('Failed to create CSV backup');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Database className="w-4 h-4 text-[#c8ff00]" />
          Data Backup & Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastBackup && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm">
              Last backup: {lastBackup.toLocaleString()}
            </span>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Select Data to Backup</label>
            <Select value={backupType} onValueChange={setBackupType}>
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Complete Backup (All Data)</SelectItem>
                <SelectItem value="leads">Leads Only</SelectItem>
                <SelectItem value="orders">Orders Only</SelectItem>
                <SelectItem value="emails">Email Logs Only</SelectItem>
                <SelectItem value="errors">Error Logs Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={exportData}
              disabled={exporting}
              className="bg-[#c8ff00] text-black hover:bg-[#b8ef00]"
            >
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export JSON'}
            </Button>

            <Button
              onClick={exportCSV}
              disabled={exporting}
              variant="outline"
              className="border-gray-700 text-white hover:bg-gray-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-400 space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              <span>Recommendation: Backup weekly or after major changes</span>
            </div>
            <div className="text-gray-500 mt-2">
              JSON format includes all metadata • CSV is simplified for Excel
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}