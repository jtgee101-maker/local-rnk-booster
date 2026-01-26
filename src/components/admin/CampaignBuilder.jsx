import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Sparkles, QrCode, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';

export default function CampaignBuilder({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    type: 'qr_code',
    base_url: window.location.origin + '/QuizV3',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    utm_term: '',
    budget: '',
    notes: ''
  });
  const [qrCodeData, setQrCodeData] = useState(null);

  const createCampaignMutation = useMutation({
    mutationFn: async (data) => {
      // Generate tracking URL
      const params = new URLSearchParams();
      if (data.utm_source) params.append('utm_source', data.utm_source);
      if (data.utm_medium) params.append('utm_medium', data.utm_medium);
      if (data.utm_campaign) params.append('utm_campaign', data.utm_campaign);
      if (data.utm_content) params.append('utm_content', data.utm_content);
      if (data.utm_term) params.append('utm_term', data.utm_term);

      const trackingUrl = `${data.base_url}${params.toString() ? '?' + params.toString() : ''}`;

      // Generate QR code if needed
      let qrCodeUrl = null;
      if (data.type === 'qr_code' || data.type === 'direct_mail' || data.type === 'print') {
        qrCodeUrl = await QRCode.toDataURL(trackingUrl, {
          width: 512,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      }

      const campaign = await base44.asServiceRole.entities.Campaign.create({
        ...data,
        status: 'draft',
        qr_code_url: qrCodeUrl,
        launch_date: new Date().toISOString()
      });

      return { campaign, trackingUrl, qrCodeUrl };
    },
    onSuccess: (data) => {
      setQrCodeData(data);
      setStep(3);
    }
  });

  const handleSubmit = () => {
    createCampaignMutation.mutate(formData);
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.download = `${formData.name.replace(/\s/g, '_')}_QR.png`;
    link.href = qrCodeData.qrCodeUrl;
    link.click();
  };

  const copyTrackingUrl = () => {
    navigator.clipboard.writeText(qrCodeData.trackingUrl);
    alert('Tracking URL copied to clipboard!');
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-white">Campaign Builder</CardTitle>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            Step {step} of 3
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div>
              <Label className="text-gray-300">Campaign Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Q1 2026 Direct Mail Campaign"
                className="bg-gray-900 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-300">Campaign Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qr_code">QR Code</SelectItem>
                  <SelectItem value="direct_mail">Direct Mail / PURL</SelectItem>
                  <SelectItem value="print">Print Advertising</SelectItem>
                  <SelectItem value="email">Email Campaign</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300">Destination URL</Label>
              <Input
                value={formData.base_url}
                onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                placeholder="https://yoursite.com/landing-page"
                className="bg-gray-900 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-300">Budget (Optional)</Label>
              <Input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="5000"
                className="bg-gray-900 border-gray-600 text-white"
              />
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!formData.name || !formData.base_url}
              className="w-full bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold"
            >
              Next: UTM Parameters
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30 mb-4">
              <p className="text-sm text-blue-300">
                UTM parameters help you track where your traffic comes from. Fill in as many as needed for your tracking.
              </p>
            </div>

            <div>
              <Label className="text-gray-300">UTM Source</Label>
              <Input
                value={formData.utm_source}
                onChange={(e) => setFormData({ ...formData, utm_source: e.target.value })}
                placeholder="direct_mail"
                className="bg-gray-900 border-gray-600 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">Where traffic originates (e.g., direct_mail, facebook, newsletter)</p>
            </div>

            <div>
              <Label className="text-gray-300">UTM Medium</Label>
              <Input
                value={formData.utm_medium}
                onChange={(e) => setFormData({ ...formData, utm_medium: e.target.value })}
                placeholder="postcard"
                className="bg-gray-900 border-gray-600 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">Marketing medium (e.g., postcard, qr_code, email, cpc)</p>
            </div>

            <div>
              <Label className="text-gray-300">UTM Campaign</Label>
              <Input
                value={formData.utm_campaign}
                onChange={(e) => setFormData({ ...formData, utm_campaign: e.target.value })}
                placeholder="q1_2026_promo"
                className="bg-gray-900 border-gray-600 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">Campaign name or promo code</p>
            </div>

            <div>
              <Label className="text-gray-300">UTM Content (Optional)</Label>
              <Input
                value={formData.utm_content}
                onChange={(e) => setFormData({ ...formData, utm_content: e.target.value })}
                placeholder="variant_a"
                className="bg-gray-900 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-300">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Campaign notes and details..."
                className="bg-gray-900 border-gray-600 text-white"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1 border-gray-600"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createCampaignMutation.isPending}
                className="flex-1 bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold"
              >
                {createCampaignMutation.isPending ? 'Creating...' : 'Create Campaign'}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && qrCodeData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Campaign Created!</h3>
              <p className="text-gray-400">Your tracking campaign is ready to launch</p>
            </div>

            {qrCodeData.qrCodeUrl && (
              <div className="bg-white p-6 rounded-lg">
                <img src={qrCodeData.qrCodeUrl} alt="QR Code" className="w-full max-w-xs mx-auto" />
              </div>
            )}

            <div className="space-y-3">
              <div>
                <Label className="text-gray-300 text-sm">Tracking URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={qrCodeData.trackingUrl}
                    readOnly
                    className="bg-gray-900 border-gray-600 text-white font-mono text-xs"
                  />
                  <Button onClick={copyTrackingUrl} size="sm" variant="outline" className="border-gray-600">
                    Copy
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {qrCodeData.qrCodeUrl && (
                <Button
                  onClick={downloadQRCode}
                  variant="outline"
                  className="flex-1 border-gray-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download QR Code
                </Button>
              )}
              <Button
                onClick={onSuccess}
                className="flex-1 bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold"
              >
                Done
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}