import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Sparkles, QrCode, Download, Globe, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';

export default function CampaignBuilder({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    type: 'qr_code',
    base_url: window.location.origin + '/QuizV3',
    custom_domain: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    utm_term: '',
    budget: '',
    notes: ''
  });
  const [qrCodeData, setQrCodeData] = useState(null);

  // Preset custom domains
  const customDomains = [
    window.location.origin,
    'https://yourbrand.com',
    'https://track.yourbrand.com',
    'https://go.yourbrand.com'
  ];

  const createCampaignMutation = useMutation({
    mutationFn: async (data) => {
      // Generate tracking URL
      const params = new URLSearchParams();
      if (data.utm_source) params.append('utm_source', data.utm_source);
      if (data.utm_medium) params.append('utm_medium', data.utm_medium);
      if (data.utm_campaign) params.append('utm_campaign', data.utm_campaign);
      if (data.utm_content) params.append('utm_content', data.utm_content);
      if (data.utm_term) params.append('utm_term', data.utm_term);

      const baseUrl = data.custom_domain || data.base_url;
      const trackingUrl = `${baseUrl}${params.toString() ? '?' + params.toString() : ''}`;

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
    <div className="max-w-4xl mx-auto">
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-[#c8ff00]/20 shadow-2xl">
        <CardHeader className="border-b border-gray-700/50 bg-gradient-to-r from-[#c8ff00]/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="hover:bg-[#c8ff00]/10"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Button>
              <div>
                <CardTitle className="text-2xl font-black text-white tracking-tight">Campaign Builder</CardTitle>
                <p className="text-sm font-semibold text-[#c8ff00] mt-1">Multi-Channel Attribution Tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Step</div>
                <div className="text-2xl font-black text-white">{step}<span className="text-gray-500">/3</span></div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="p-5 bg-gradient-to-br from-[#c8ff00]/10 to-transparent rounded-xl border border-[#c8ff00]/30">
              <h3 className="text-lg font-black text-white mb-2">Campaign Details</h3>
              <p className="text-sm font-semibold text-gray-300">Configure your tracking campaign settings</p>
            </div>

            <div>
              <Label className="text-base font-bold text-white mb-2 block">Campaign Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Q1 2026 Direct Mail Campaign"
                className="bg-gray-900/80 border-2 border-gray-700 text-white font-semibold placeholder:text-gray-500 h-12 text-base focus:border-[#c8ff00]"
              />
            </div>

            <div>
              <Label className="text-base font-bold text-white mb-2 block">Campaign Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger className="bg-gray-900/80 border-2 border-gray-700 text-white font-semibold h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qr_code">🔲 QR Code</SelectItem>
                  <SelectItem value="direct_mail">📬 Direct Mail / PURL</SelectItem>
                  <SelectItem value="print">📰 Print Advertising</SelectItem>
                  <SelectItem value="email">📧 Email Campaign</SelectItem>
                  <SelectItem value="social">📱 Social Media</SelectItem>
                  <SelectItem value="other">🎯 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#c8ff00]" />
                Custom Domain (Optional)
              </Label>
              <Select 
                value={formData.custom_domain} 
                onValueChange={(value) => setFormData({ ...formData, custom_domain: value })}
              >
                <SelectTrigger className="bg-gray-900/80 border-2 border-gray-700 text-white font-semibold h-12 text-base">
                  <SelectValue placeholder="Use default domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Default Domain</SelectItem>
                  {customDomains.map((domain, index) => (
                    <SelectItem key={index} value={domain}>{domain}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs font-semibold text-gray-400 mt-2">Brand your tracking links with custom domains</p>
            </div>

            <div>
              <Label className="text-base font-bold text-white mb-2 block">Destination URL</Label>
              <Input
                value={formData.base_url}
                onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                placeholder="https://yoursite.com/landing-page"
                className="bg-gray-900/80 border-2 border-gray-700 text-white font-semibold placeholder:text-gray-500 h-12 text-base focus:border-[#c8ff00]"
              />
              <p className="text-xs font-semibold text-gray-400 mt-2">Where visitors will land after scanning/clicking</p>
            </div>

            <div>
              <Label className="text-base font-bold text-white mb-2 block">Campaign Budget (Optional)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold text-lg">$</span>
                <Input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="5000"
                  className="bg-gray-900/80 border-2 border-gray-700 text-white font-semibold placeholder:text-gray-500 h-12 text-base pl-8 focus:border-[#c8ff00]"
                />
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!formData.name || !formData.base_url}
              className="w-full bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-black text-lg h-14 shadow-lg"
            >
              Next: UTM Parameters →
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="p-5 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl border-2 border-indigo-500/30">
              <h3 className="text-base font-black text-white mb-2">📊 UTM Tracking Parameters</h3>
              <p className="text-sm font-semibold text-white">
                Track exactly where your traffic comes from. Fill in as many as needed for precise attribution.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-base font-bold text-white mb-2 block">UTM Source</Label>
                <Input
                  value={formData.utm_source}
                  onChange={(e) => setFormData({ ...formData, utm_source: e.target.value })}
                  placeholder="direct_mail"
                  className="bg-gray-900/80 border-2 border-gray-700 text-white font-semibold placeholder:text-gray-500 h-12 text-base focus:border-[#c8ff00]"
                />
                <p className="text-xs font-semibold text-gray-400 mt-2">e.g., direct_mail, facebook, newsletter</p>
              </div>

              <div>
                <Label className="text-base font-bold text-white mb-2 block">UTM Medium</Label>
                <Input
                  value={formData.utm_medium}
                  onChange={(e) => setFormData({ ...formData, utm_medium: e.target.value })}
                  placeholder="postcard"
                  className="bg-gray-900/80 border-2 border-gray-700 text-white font-semibold placeholder:text-gray-500 h-12 text-base focus:border-[#c8ff00]"
                />
                <p className="text-xs font-semibold text-gray-400 mt-2">e.g., postcard, qr_code, email, cpc</p>
              </div>
            </div>

            <div>
              <Label className="text-base font-bold text-white mb-2 block">UTM Campaign</Label>
              <Input
                value={formData.utm_campaign}
                onChange={(e) => setFormData({ ...formData, utm_campaign: e.target.value })}
                placeholder="q1_2026_promo"
                className="bg-gray-900/80 border-2 border-gray-700 text-white font-semibold placeholder:text-gray-500 h-12 text-base focus:border-[#c8ff00]"
              />
              <p className="text-xs font-semibold text-gray-400 mt-2">Campaign name or promo code identifier</p>
            </div>

            <div>
              <Label className="text-base font-bold text-white mb-2 block">UTM Content (Optional)</Label>
              <Input
                value={formData.utm_content}
                onChange={(e) => setFormData({ ...formData, utm_content: e.target.value })}
                placeholder="variant_a"
                className="bg-gray-900/80 border-2 border-gray-700 text-white font-semibold placeholder:text-gray-500 h-12 text-base focus:border-[#c8ff00]"
              />
              <p className="text-xs font-semibold text-gray-400 mt-2">Use for A/B testing different creative variants</p>
            </div>

            <div>
              <Label className="text-base font-bold text-white mb-2 block">Campaign Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Campaign notes, targeting details, and internal documentation..."
                className="bg-gray-900/80 border-2 border-gray-700 text-white font-semibold placeholder:text-gray-500 min-h-[100px] text-base focus:border-[#c8ff00]"
              />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1 border-2 border-gray-600 h-14 text-base font-bold text-white hover:bg-gray-800"
              >
                ← Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createCampaignMutation.isPending}
                className="flex-1 bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-black text-lg h-14 shadow-lg"
              >
                {createCampaignMutation.isPending ? '⚡ Creating...' : '✨ Create Campaign'}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && qrCodeData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-4xl font-black text-white mb-3">Campaign Created!</h3>
              <p className="text-lg font-bold text-[#c8ff00]">Your tracking campaign is ready to launch 🚀</p>
            </div>

            {qrCodeData.qrCodeUrl && (
              <div className="bg-white p-8 rounded-xl shadow-2xl border-4 border-[#c8ff00]/30">
                <img src={qrCodeData.qrCodeUrl} alt="QR Code" className="w-full max-w-sm mx-auto" />
                <p className="text-center text-sm font-bold text-gray-700 mt-4">High-Resolution QR Code</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-[#c8ff00]" />
                  Tracking URL
                </Label>
                <div className="flex gap-3">
                  <Input
                    value={qrCodeData.trackingUrl}
                    readOnly
                    className="bg-gray-900/80 border-2 border-gray-700 text-white font-bold text-sm flex-1"
                  />
                  <Button 
                    onClick={copyTrackingUrl} 
                    size="lg" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                  >
                    📋 Copy
                  </Button>
                </div>
              </div>

              {formData.custom_domain && (
                <div className="p-4 bg-[#c8ff00]/10 rounded-lg border-2 border-[#c8ff00]/30">
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#c8ff00]" />
                    Using Custom Domain: <span className="text-[#c8ff00]">{formData.custom_domain}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {qrCodeData.qrCodeUrl && (
                <Button
                  onClick={downloadQRCode}
                  size="lg"
                  className="h-14 bg-gray-800 hover:bg-gray-700 text-white font-bold border-2 border-gray-600"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download QR
                </Button>
              )}
              <Button
                onClick={onSuccess}
                size="lg"
                className="h-14 bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-black text-lg"
              >
                ✓ Done
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}