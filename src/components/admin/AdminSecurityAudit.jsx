import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AdminSecurityAudit() {
  const securityChecks = [
    { name: 'SSL/TLS Encryption', status: 'secure', lastChecked: '5 min ago' },
    { name: 'API Key Rotation', status: 'secure', lastChecked: '30 days ago' },
    { name: 'Database Backups', status: 'secure', lastChecked: '1 hour ago' },
    { name: 'Rate Limiting', status: 'warning', lastChecked: 'Now' },
    { name: 'Admin Audits', status: 'secure', lastChecked: '5 min ago' },
    { name: 'Data Privacy', status: 'secure', lastChecked: '2 hours ago' }
  ];

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Shield className="w-5 h-5 text-[#c8ff00]" />
          Security Audit
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {securityChecks.map((check, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-2">
                {check.status === 'secure' ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-white">{check.name}</p>
                  <p className="text-xs text-gray-500">{check.lastChecked}</p>
                </div>
              </div>
              <Badge className={
                check.status === 'secure' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
              }>
                {check.status}
              </Badge>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-sm text-green-200">
            ✓ Overall security score: Excellent
          </p>
        </div>
      </CardContent>
    </Card>
  );
}