import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, Sparkles, Copy } from 'lucide-react';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';

export default function PURLGenerator({ campaigns }) {
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [singleData, setSingleData] = useState({
    recipient_name: '',
    recipient_email: '',
    recipient_company: ''
  });
  const [bulkData, setBulkData] = useState('');
  const [generatedLinks, setGeneratedLinks] = useState([]);
  const queryClient = useQueryClient();

  const generatePURLMutation = useMutation({
    mutationFn: async (data) => {
      const campaign = campaigns.find(c => c.id === selectedCampaign);
      if (!campaign) throw new Error('Campaign not found');

      const results = [];
      
      for (const recipient of data.recipients) {
        // Create PURL slug
        const purl = recipient.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        
        // Generate short code
        const shortCode = Math.random().toString(36).substr(2, 8);
        
        // Build tracking URL
        const params = new URLSearchParams();
        params.append('purl', purl);
        params.append('sc', shortCode);
        if (campaign.utm_source) params.append('utm_source', campaign.utm_source);
        if (campaign.utm_medium) params.append('utm_medium', campaign.utm_medium);
        if (campaign.utm_campaign) params.append('utm_campaign', campaign.utm_campaign);
        
        const fullUrl = `${campaign.base_url}?${params.toString()}`;
        
        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(fullUrl, {
          width: 512,
          margin: 2
        });

        // Create link record
        const link = await base44.asServiceRole.entities.CampaignLink.create({
          campaign_id: selectedCampaign,
          purl,
          short_code: shortCode,
          full_url: fullUrl,
          recipient_name: recipient.name,
          recipient_email: recipient.email,
          recipient_company: recipient.company,
          qr_code_url: qrCodeUrl
        });

        results.push({ ...link, qr_code_url: qrCodeUrl });
      }

      // Update campaign total links
      await base44.asServiceRole.entities.Campaign.update(selectedCampaign, {
        total_links: (campaign.total_links || 0) + results.length
      });

      return results;
    },
    onSuccess: (data) => {
      setGeneratedLinks(data);
      queryClient.invalidateQueries(['campaigns']);
      alert(`Successfully generated ${data.length} personalized tracking links!`);
    }
  });

  const handleSingleGenerate = () => {
    if (!singleData.recipient_name || !selectedCampaign) {
      alert('Please fill in recipient name and select a campaign');
      return;
    }

    generatePURLMutation.mutate({
      recipients: [{
        name: singleData.recipient_name,
        email: singleData.recipient_email,
        company: singleData.recipient_company
      }]
    });
  };

  const handleBulkGenerate = () => {
    if (!bulkData || !selectedCampaign) {
      alert('Please provide recipient data and select a campaign');
      return;
    }

    try {
      const lines = bulkData.trim().split('\n');
      const recipients = lines.map(line => {
        const [name, email, company] = line.split(',').map(s => s.trim());
        return { name, email: email || '', company: company || '' };
      }).filter(r => r.name);

      if (recipients.length === 0) {
        alert('No valid recipients found. Format: Name, Email, Company (one per line)');
        return;
      }

      generatePURLMutation.mutate({ recipients });
    } catch (error) {
      alert('Error parsing recipient data. Please check format.');
    }
  };

  const downloadCSV = () => {
    const csv = [
      ['Name', 'Email', 'Company', 'PURL', 'Short Code', 'Full URL'].join(','),
      ...generatedLinks.map(link => [
        link.recipient_name,
        link.recipient_email || '',
        link.recipient_company || '',
        link.purl,
        link.short_code,
        link.full_url
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaign_purls.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#c8ff00]" />
            Personalized URL (PURL) Generator
          </CardTitle>
          <CardDescription className="text-gray-300">
            Create custom tracking links for direct mail, events, or personalized campaigns
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-300">Select Campaign</Label>
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                <SelectValue placeholder="Choose campaign..." />
              </SelectTrigger>
              <SelectContent>
                {campaigns?.filter(c => c.type === 'direct_mail' || c.type === 'qr_code').map(campaign => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setBulkMode(false)}
              variant={!bulkMode ? 'default' : 'outline'}
              className={!bulkMode ? 'bg-[#c8ff00] text-black' : 'border-gray-600'}
            >
              Single Link
            </Button>
            <Button
              onClick={() => setBulkMode(true)}
              variant={bulkMode ? 'default' : 'outline'}
              className={bulkMode ? 'bg-[#c8ff00] text-black' : 'border-gray-600'}
            >
              Bulk Upload
            </Button>
          </div>
        </CardContent>
      </Card>

      {!bulkMode ? (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Single Link Generator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-300">Recipient Name *</Label>
              <Input
                value={singleData.recipient_name}
                onChange={(e) => setSingleData({ ...singleData, recipient_name: e.target.value })}
                placeholder="John Smith"
                className="bg-gray-900 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Email (Optional)</Label>
              <Input
                value={singleData.recipient_email}
                onChange={(e) => setSingleData({ ...singleData, recipient_email: e.target.value })}
                placeholder="john@company.com"
                className="bg-gray-900 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Company (Optional)</Label>
              <Input
                value={singleData.recipient_company}
                onChange={(e) => setSingleData({ ...singleData, recipient_company: e.target.value })}
                placeholder="ACME Corp"
                className="bg-gray-900 border-gray-600 text-white"
              />
            </div>
            <Button
              onClick={handleSingleGenerate}
              disabled={generatePURLMutation.isPending}
              className="w-full bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold"
            >
              {generatePURLMutation.isPending ? 'Generating...' : 'Generate PURL & QR Code'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Bulk Link Generator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-300">Recipient List</Label>
              <Textarea
                value={bulkData}
                onChange={(e) => setBulkData(e.target.value)}
                placeholder="John Smith, john@company.com, ACME Corp&#10;Jane Doe, jane@business.com, Business Inc&#10;..."
                className="bg-gray-900 border-gray-600 text-white font-mono text-sm h-48"
              />
              <p className="text-xs text-gray-400 mt-2">
                Format: Name, Email, Company (one per line, CSV format)
              </p>
            </div>
            <Button
              onClick={handleBulkGenerate}
              disabled={generatePURLMutation.isPending}
              className="w-full bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold"
            >
              <Upload className="w-4 h-4 mr-2" />
              {generatePURLMutation.isPending ? 'Generating...' : `Generate ${bulkData.split('\n').filter(l => l.trim()).length} PURLs`}
            </Button>
          </CardContent>
        </Card>
      )}

      {generatedLinks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">Generated Links ({generatedLinks.length})</CardTitle>
                <Button onClick={downloadCSV} variant="outline" size="sm" className="border-gray-600">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {generatedLinks.map((link, index) => (
                  <div key={index} className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-white">{link.recipient_name}</div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(link.full_url);
                          alert('URL copied!');
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-xs text-gray-400 font-mono break-all">{link.full_url}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}