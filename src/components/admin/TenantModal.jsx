import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Users, Activity, Database, CheckCircle, AlertCircle, Power } from 'lucide-react';

export default function TenantModal({ tenant, onClose, onToggleStatus }) {
  if (!tenant) return null;

  const isActive = tenant.status === 'active';

  return (
    <Dialog open={!!tenant} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0a] border-gray-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F2FF]/20 to-[#c8ff00]/20 flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-[#00F2FF]" />
            </div>
            <span className="truncate">{tenant.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* Status */}
          <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl">
            <span className="text-gray-400 text-sm">Status</span>
            <Badge className={`${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'} border-0`}>
              {tenant.status}
            </Badge>
          </div>

          {/* Subdomain */}
          <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl">
            <span className="text-gray-400 text-sm">Subdomain</span>
            <span className="text-white text-sm font-mono">{tenant.subdomain}.localrnk.io</span>
          </div>

          {/* Custom domain if present */}
          {tenant.custom_domain && (
            <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl">
              <span className="text-gray-400 text-sm">Custom Domain</span>
              <div className="flex items-center gap-2">
                <span className="text-white text-sm">{tenant.custom_domain}</span>
                {tenant.domain_verified
                  ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                  : <AlertCircle className="w-4 h-4 text-amber-400" />
                }
              </div>
            </div>
          )}

          {/* Usage metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-900/50 rounded-xl p-3 text-center">
              <Users className="w-4 h-4 text-[#00F2FF] mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{tenant.active_users}</p>
              <p className="text-xs text-gray-500">Active Users</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-3 text-center">
              <Activity className="w-4 h-4 text-[#c8ff00] mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{tenant.current_audits}</p>
              <p className="text-xs text-gray-500">Total Audits</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-3 text-center">
              <Database className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-white capitalize">{tenant.plan_id}</p>
              <p className="text-xs text-gray-500">Plan</p>
            </div>
          </div>

          {/* Health */}
          <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl">
            <span className="text-gray-400 text-sm">System Health</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                tenant.health_status === 'healthy' ? 'bg-emerald-500' :
                tenant.health_status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'
              }`} />
              <span className="text-sm text-gray-300 capitalize">{tenant.health_status}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => { onToggleStatus(tenant); onClose(); }}
              className={`flex-1 border ${
                isActive
                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30'
              }`}
              variant="ghost"
            >
              <Power className="w-4 h-4 mr-2" />
              {isActive ? 'Suspend Tenant' : 'Reactivate Tenant'}
            </Button>
            <Button onClick={onClose} variant="outline" className="border-gray-700 text-gray-400">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}