import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Copy, ExternalLink, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function StripeSetupGuide() {
  const [copiedSecret, setCopiedSecret] = useState('');

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedSecret(label);
    toast.success(`${label} copied`);
    setTimeout(() => setCopiedSecret(''), 2000);
  };

  const webhookEndpoint = `${window.location.origin}/api/stripeWebhook`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <CreditCard className="w-10 h-10 text-[#c8ff00]" />
          <div>
            <h1 className="text-4xl font-bold text-white">Stripe Setup Guide</h1>
            <p className="text-gray-400">Complete payment integration configuration</p>
          </div>
        </div>

        {/* Step 1: API Keys */}
        <Card className="mb-6 bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 bg-[#c8ff00] rounded-full flex items-center justify-center text-black font-bold">1</div>
              Get Your Stripe API Keys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">
              First, get your Stripe API keys from your Stripe dashboard.
            </p>
            
            <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-medium">Secret Key</p>
                  <code className="text-xs text-gray-400">STRIPE_SECRET_KEY</code>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open('https://dashboard.stripe.com/apikeys', '_blank')}
                  className="border-gray-700 text-gray-300"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Get Key
                </Button>
              </div>
              <p className="text-sm text-gray-400">
                Use <span className="text-yellow-400">Test Mode</span> keys for development, <span className="text-green-400">Live Mode</span> for production.
              </p>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-400">
                💡 <strong>Where to add:</strong> Dashboard → Settings → Environment Variables → Add <code>STRIPE_SECRET_KEY</code>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Webhook Setup */}
        <Card className="mb-6 bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 bg-[#c8ff00] rounded-full flex items-center justify-center text-black font-bold">2</div>
              Configure Webhook Endpoint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">
              Set up a webhook endpoint to receive payment events from Stripe.
            </p>

            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">Your Webhook URL:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={webhookEndpoint}
                  readOnly
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(webhookEndpoint, 'Webhook URL')}
                  className="border-gray-700"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-300">
                  Go to <a href="https://dashboard.stripe.com/webhooks" target="_blank" className="text-[#c8ff00] hover:underline">Stripe Webhooks</a> and click "Add endpoint"
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-300">
                  Paste your webhook URL above
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-300">
                  Select events to listen to: <code className="text-[#c8ff00]">checkout.session.completed</code>, <code className="text-[#c8ff00]">payment_intent.succeeded</code>, <code className="text-[#c8ff00]">payment_intent.payment_failed</code>
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-300">
                  After creating, copy the "Signing secret" (starts with <code>whsec_</code>)
                </p>
              </div>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-400">
                💡 Add the webhook signing secret to: Dashboard → Settings → Environment Variables → Add <code>STRIPE_WEBHOOK_SECRET</code>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Test */}
        <Card className="mb-6 bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 bg-[#c8ff00] rounded-full flex items-center justify-center text-black font-bold">3</div>
              Test Payment Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">
              Use Stripe's test card numbers to verify your integration.
            </p>

            <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
              <p className="text-white font-medium mb-3">Test Card Numbers:</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <code className="text-[#c8ff00]">4242 4242 4242 4242</code>
                    <p className="text-xs text-gray-400">Successful payment</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard('4242424242424242', 'Card number')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <code className="text-[#c8ff00]">4000 0025 0000 3155</code>
                    <p className="text-xs text-gray-400">Requires 3D Secure</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard('4000002500003155', 'Card number')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <code className="text-[#c8ff00]">4000 0000 0000 9995</code>
                    <p className="text-xs text-gray-400">Declined payment</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard('4000000000009995', 'Card number')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Use any future expiry date (e.g., 12/34) and any 3-digit CVC.
              </p>
            </div>

            <Button
              onClick={() => window.location.href = '/QuizV3'}
              className="w-full bg-[#c8ff00] text-gray-900 hover:bg-[#b8ef00] font-semibold"
            >
              Test Complete Flow
            </Button>
          </CardContent>
        </Card>

        {/* Security Checklist */}
        <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              Security Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Never commit API keys to version control</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Always validate webhook signatures in production</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Use test mode keys for development/staging</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Monitor webhook deliveries in Stripe dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Set up email alerts for failed payments</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}