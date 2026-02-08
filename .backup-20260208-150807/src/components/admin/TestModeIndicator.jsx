import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function TestModeIndicator({ isTestMode = true }) {
  if (isTestMode) {
    return (
      <Alert className="bg-yellow-50 border-yellow-200 mb-6">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold">TEST MODE ACTIVE</span> - All Stripe operations are simulated. 
              Set <code className="px-1 py-0.5 bg-yellow-100 rounded text-xs">STRIPE_SECRET_KEY</code> (starting with <code className="px-1 py-0.5 bg-yellow-100 rounded text-xs">sk_live_</code>) for production.
            </div>
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
              TEST MODE
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="bg-green-50 border-green-200 mb-6">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold">PRODUCTION MODE</span> - Live Stripe integration active. All payments are real.
          </div>
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            LIVE
          </Badge>
        </div>
      </AlertDescription>
    </Alert>
  );
}