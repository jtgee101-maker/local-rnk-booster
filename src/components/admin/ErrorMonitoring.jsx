import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

export default function ErrorMonitoring() {
  const queryClient = useQueryClient();
  const [selectedError, setSelectedError] = useState(null);

  const { data: errors = [] } = useQuery({
    queryKey: ['errors'],
    queryFn: () => base44.entities.ErrorLog.list('-created_date', 200)
  });

  const resolveMutation = useMutation({
    mutationFn: async (errorId) => {
      const user = await base44.auth.me();
      return await base44.entities.ErrorLog.update(errorId, {
        resolved: true,
        resolved_by: user.email,
        resolved_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['errors'] });
      setSelectedError(null);
    }
  });

  const unresolvedErrors = errors.filter(e => !e.resolved);
  const criticalErrors = unresolvedErrors.filter(e => e.severity === 'critical');

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" /> Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500"><AlertTriangle className="w-3 h-3 mr-1" /> High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500"><Info className="w-3 h-3 mr-1" /> Medium</Badge>;
      case 'low':
        return <Badge className="bg-blue-500"><Info className="w-3 h-3 mr-1" /> Low</Badge>;
      default:
        return <Badge className="bg-gray-500">{severity}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-gray-400 text-sm mb-1">Total Errors</div>
            <div className="text-2xl font-bold text-white">{errors.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-gray-400 text-sm mb-1">Unresolved</div>
            <div className="text-2xl font-bold text-orange-400">{unresolvedErrors.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-gray-400 text-sm mb-1">Critical</div>
            <div className="text-2xl font-bold text-red-400">{criticalErrors.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-gray-400 text-sm mb-1">Resolved</div>
            <div className="text-2xl font-bold text-green-400">
              {errors.filter(e => e.resolved).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error List */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-400">Type</TableHead>
                <TableHead className="text-gray-400">Severity</TableHead>
                <TableHead className="text-gray-400">Message</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Time</TableHead>
                <TableHead className="text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errors.slice(0, 50).map((error) => (
                <TableRow 
                  key={error.id} 
                  className={`border-gray-700 cursor-pointer hover:bg-gray-700/50 ${
                    selectedError?.id === error.id ? 'bg-gray-700/30' : ''
                  }`}
                  onClick={() => setSelectedError(error)}
                >
                  <TableCell>
                    <Badge variant="outline" className="text-gray-300">
                      {error.error_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{getSeverityBadge(error.severity)}</TableCell>
                  <TableCell className="text-white max-w-md truncate">
                    {error.message}
                  </TableCell>
                  <TableCell>
                    {error.resolved ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" /> Resolved
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-500">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-400 text-sm">
                    {new Date(error.created_date).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {!error.resolved && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          resolveMutation.mutate(error.id);
                        }}
                        disabled={resolveMutation.isPending}
                      >
                        Resolve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Error Details */}
      {selectedError && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Error Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-gray-400 text-sm mb-1">Error ID</div>
              <div className="text-white font-mono text-sm">{selectedError.id}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Message</div>
              <div className="text-white">{selectedError.message}</div>
            </div>
            {selectedError.metadata && (
              <div>
                <div className="text-gray-400 text-sm mb-1">Metadata</div>
                <pre className="bg-gray-900 p-3 rounded text-gray-300 text-xs overflow-auto">
                  {JSON.stringify(selectedError.metadata, null, 2)}
                </pre>
              </div>
            )}
            {selectedError.stack_trace && (
              <div>
                <div className="text-gray-400 text-sm mb-1">Stack Trace</div>
                <pre className="bg-gray-900 p-3 rounded text-gray-300 text-xs overflow-auto max-h-64">
                  {selectedError.stack_trace}
                </pre>
              </div>
            )}
            {selectedError.resolved && (
              <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                <div className="text-green-400 font-semibold mb-1">Resolved</div>
                <div className="text-gray-300 text-sm">
                  By {selectedError.resolved_by} on {new Date(selectedError.resolved_date).toLocaleString()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}