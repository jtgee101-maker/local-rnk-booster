import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { AlertCircle, Trash2, CheckCircle, Filter, RotateCw, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ErrorTrackingDashboard() {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadErrors = async () => {
    setLoading(true);
    try {
      const allErrors = await base44.entities.ErrorLog.list('-created_date', 100);
      setErrors(allErrors || []);
    } catch (error) {
      console.error('Failed to load errors:', error);
      toast.error('Failed to load error logs');
    } finally {
      setLoading(false);
    }
  };

  const refreshErrors = async () => {
    setRefreshing(true);
    await loadErrors();
    setRefreshing(false);
  };

  useEffect(() => {
    loadErrors();
  }, []);

  const markAsResolved = async (errorId) => {
    try {
      await base44.entities.ErrorLog.update(errorId, {
        resolved: true,
        resolved_date: new Date().toISOString()
      });
      toast.success('Error marked as resolved');
      await loadErrors();
    } catch (error) {
      toast.error('Failed to update error');
    }
  };

  const deleteError = async (errorId) => {
    try {
      await base44.entities.ErrorLog.delete(errorId);
      toast.success('Error deleted');
      await loadErrors();
    } catch (error) {
      toast.error('Failed to delete error');
    }
  };

  const filteredErrors = errors.filter(err => {
    if (filter === 'unresolved') return !err.resolved;
    if (filter === 'critical') return err.severity === 'critical';
    return true;
  });

  const errorStats = {
    total: errors.length,
    unresolved: errors.filter(e => !e.resolved).length,
    critical: errors.filter(e => e.severity === 'critical').length
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/30';
      case 'high':
        return 'bg-orange-500/10 border-orange-500/30';
      default:
        return 'bg-yellow-500/10 border-yellow-500/30';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Error Tracking Dashboard</h2>
        <Button
          onClick={refreshErrors}
          disabled={refreshing}
          variant="outline"
          className="text-gray-300 border-gray-700"
        >
          {refreshing ? (
            <RotateCw className="w-4 h-4 animate-spin" />
          ) : (
            <RotateCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
          <div className="text-2xl font-bold text-white">{errorStats.total}</div>
          <div className="text-sm text-gray-400">Total Errors</div>
        </div>
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="text-2xl font-bold text-red-400">{errorStats.unresolved}</div>
          <div className="text-sm text-gray-400">Unresolved</div>
        </div>
        <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <div className="text-2xl font-bold text-orange-400">{errorStats.critical}</div>
          <div className="text-sm text-gray-400">Critical</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          onClick={() => setFilter('all')}
          variant={filter === 'all' ? 'default' : 'outline'}
          className={filter === 'all' ? 'bg-blue-600' : 'text-gray-300 border-gray-700'}
        >
          All Errors
        </Button>
        <Button
          onClick={() => setFilter('unresolved')}
          variant={filter === 'unresolved' ? 'default' : 'outline'}
          className={filter === 'unresolved' ? 'bg-red-600' : 'text-gray-300 border-gray-700'}
        >
          Unresolved
        </Button>
        <Button
          onClick={() => setFilter('critical')}
          variant={filter === 'critical' ? 'default' : 'outline'}
          className={filter === 'critical' ? 'bg-orange-600' : 'text-gray-300 border-gray-700'}
        >
          Critical
        </Button>
      </div>

      {/* Error List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <RotateCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          Loading errors...
        </div>
      ) : filteredErrors.length > 0 ? (
        <div className="space-y-3">
          {filteredErrors.map((error, idx) => (
            <motion.div
              key={error.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-4 border rounded-lg ${getSeverityColor(error.severity)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getSeverityIcon(error.severity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{error.error_type}</span>
                      {error.resolved && (
                        <span className="text-xs bg-green-500/30 text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Resolved
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{error.message}</p>
                    <div className="text-xs text-gray-500">
                      {new Date(error.created_date).toLocaleString()}
                    </div>
                    {error.metadata && (
                      <div className="mt-2 p-2 bg-black/30 rounded text-xs text-gray-400 font-mono max-h-24 overflow-auto">
                        {JSON.stringify(error.metadata, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
                {!error.resolved && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      onClick={() => markAsResolved(error.id)}
                      size="sm"
                      variant="outline"
                      className="text-green-400 border-green-500/30 hover:bg-green-500/10"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => deleteError(error.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
          <p>No errors found! System is healthy.</p>
        </div>
      )}
    </div>
  );
}