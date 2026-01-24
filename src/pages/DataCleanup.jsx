import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, AlertTriangle, Database, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function DataCleanup() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    leads: 0,
    orders: 0,
    conversionEvents: 0,
    emailLogs: 0,
    errorLogs: 0
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [cleanupType, setCleanupType] = useState('');

  useEffect(() => {
    checkAdminAndLoadStats();
  }, []);

  const checkAdminAndLoadStats = async () => {
    try {
      const user = await base44.auth.me();
      if (user.role !== 'admin') {
        toast.error('Admin access required');
        return;
      }
      setIsAdmin(true);
      loadStats();
    } catch (error) {
      toast.error('Authentication failed');
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const [leads, orders, events, emails, errors] = await Promise.all([
        base44.entities.Lead.list('-created_date', 1000),
        base44.entities.Order.list('-created_date', 1000),
        base44.entities.ConversionEvent.list('-created_date', 1000),
        base44.entities.EmailLog.list('-created_date', 1000),
        base44.entities.ErrorLog.list('-created_date', 1000)
      ]);

      setStats({
        leads: leads.length,
        orders: orders.length,
        conversionEvents: events.length,
        emailLogs: emails.length,
        errorLogs: errors.length
      });
    } catch (error) {
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const confirmCleanup = (type) => {
    setCleanupType(type);
    setShowConfirm(true);
  };

  const executeCleanup = async () => {
    setShowConfirm(false);
    setLoading(true);

    try {
      switch (cleanupType) {
        case 'test_leads':
          // Delete leads with test emails
          const leads = await base44.entities.Lead.filter({ email: { $regex: 'test|example|demo' } });
          for (const lead of leads) {
            await base44.entities.Lead.delete(lead.id);
          }
          toast.success(`Deleted ${leads.length} test leads`);
          break;

        case 'old_events':
          // Delete conversion events older than 30 days
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          const events = await base44.entities.ConversionEvent.list('-created_date', 10000);
          const oldEvents = events.filter(e => e.created_date < thirtyDaysAgo);
          for (const event of oldEvents) {
            await base44.entities.ConversionEvent.delete(event.id);
          }
          toast.success(`Deleted ${oldEvents.length} old events`);
          break;

        case 'old_errors':
          // Delete resolved error logs older than 7 days
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const errors = await base44.entities.ErrorLog.filter({ resolved: true });
          const oldErrors = errors.filter(e => e.created_date < sevenDaysAgo);
          for (const error of oldErrors) {
            await base44.entities.ErrorLog.delete(error.id);
          }
          toast.success(`Deleted ${oldErrors.length} old error logs`);
          break;

        case 'failed_emails':
          // Delete failed email logs older than 14 days
          const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
          const emails = await base44.entities.EmailLog.filter({ status: 'failed' });
          const oldEmails = emails.filter(e => e.created_date < fourteenDaysAgo);
          for (const email of oldEmails) {
            await base44.entities.EmailLog.delete(email.id);
          }
          toast.success(`Deleted ${oldEmails.length} failed email logs`);
          break;

        case 'all_test_data':
          // Nuclear option - delete all test data
          const testLeads = await base44.entities.Lead.filter({ email: { $regex: 'test|example|demo' } });
          const allEvents = await base44.entities.ConversionEvent.list('-created_date', 10000);
          
          for (const lead of testLeads) {
            await base44.entities.Lead.delete(lead.id);
          }
          for (const event of allEvents) {
            await base44.entities.ConversionEvent.delete(event.id);
          }
          
          toast.success('All test data deleted');
          break;

        default:
          toast.error('Unknown cleanup type');
      }

      await loadStats();
    } catch (error) {
      toast.error(`Cleanup failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <Database className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-center text-gray-400">Admin access required</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Database className="w-10 h-10 text-[#c8ff00]" />
          <div>
            <h1 className="text-4xl font-bold text-white">Data Cleanup</h1>
            <p className="text-gray-400">Remove test data before production launch</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-[#c8ff00] mb-1">{stats.leads}</div>
              <div className="text-sm text-gray-400">Total Leads</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-[#c8ff00] mb-1">{stats.orders}</div>
              <div className="text-sm text-gray-400">Orders</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-[#c8ff00] mb-1">{stats.conversionEvents}</div>
              <div className="text-sm text-gray-400">Conversion Events</div>
            </CardContent>
          </Card>
        </div>

        {/* Cleanup Actions */}
        <Card className="mb-6 bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Cleanup Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Delete Test Leads</p>
                  <p className="text-sm text-gray-400">Remove leads with test/example emails</p>
                </div>
                <Button
                  onClick={() => confirmCleanup('test_leads')}
                  variant="destructive"
                  disabled={loading}
                  className="min-w-[100px]"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Clean'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Delete Old Events</p>
                  <p className="text-sm text-gray-400">Remove conversion events older than 30 days</p>
                </div>
                <Button
                  onClick={() => confirmCleanup('old_events')}
                  variant="destructive"
                  disabled={loading}
                  className="min-w-[100px]"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Clean'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Delete Resolved Errors</p>
                  <p className="text-sm text-gray-400">Remove resolved error logs older than 7 days</p>
                </div>
                <Button
                  onClick={() => confirmCleanup('old_errors')}
                  variant="destructive"
                  disabled={loading}
                  className="min-w-[100px]"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Clean'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Delete Failed Emails</p>
                  <p className="text-sm text-gray-400">Remove failed email logs older than 14 days</p>
                </div>
                <Button
                  onClick={() => confirmCleanup('failed_emails')}
                  variant="destructive"
                  disabled={loading}
                  className="min-w-[100px]"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Clean'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nuclear Option */}
        <Card className="bg-red-500/10 border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Delete ALL Test Data</p>
                <p className="text-sm text-red-300">Removes all test leads and events. Cannot be undone.</p>
              </div>
              <Button
                onClick={() => confirmCleanup('all_test_data')}
                variant="destructive"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 min-w-[120px]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4 mr-2" /> Delete All</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button
            onClick={loadStats}
            variant="outline"
            disabled={loading}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Refresh Stats
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-gray-900 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. This will permanently delete the selected data from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeCleanup}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}