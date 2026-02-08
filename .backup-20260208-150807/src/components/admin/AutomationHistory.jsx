import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function AutomationHistory({ automation, open, onClose }) {
  // Mock execution history - in production this would come from an API
  const mockHistory = [
    { id: 1, timestamp: new Date().toISOString(), status: 'success', duration: 1243, message: 'Processed 5 leads' },
    { id: 2, timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'success', duration: 987, message: 'Processed 3 leads' },
    { id: 3, timestamp: new Date(Date.now() - 7200000).toISOString(), status: 'failed', duration: 532, message: 'Database connection timeout' },
    { id: 4, timestamp: new Date(Date.now() - 10800000).toISOString(), status: 'success', duration: 1456, message: 'Processed 8 leads' }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/20 text-green-400">Success</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400">Failed</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400">Warning</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Execution History: {automation?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {mockHistory.map((run) => (
            <Card key={run.id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(run.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(run.status)}
                        <span className="text-gray-400 text-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {run.duration}ms
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mb-1">{run.message}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(run.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center text-gray-500 text-sm py-4">
          Showing last 10 executions
        </div>
      </DialogContent>
    </Dialog>
  );
}