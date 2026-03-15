import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, CheckCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPathwayConfig() {
  const [urls, setUrls] = useState({ pathway1_url: '', pathway2_url: '', pathway3_checkout_url: '' });
  const [settingId, setSettingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const settings = await base44.entities.AppSettings.filter({ setting_key: 'geenius_pathways' });
      if (settings.length > 0) {
        setSettingId(settings[0].id);
        const v = settings[0].setting_value || {};
        setUrls({
          pathway1_url: v.pathway1_url || '',
          pathway2_url: v.pathway2_url || '',
          pathway3_checkout_url: v.pathway3_checkout_url || ''
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    const value = { ...urls, updated_at: new Date().toISOString() };
    if (settingId) {
      await base44.entities.AppSettings.update(settingId, { setting_value: value });
    } else {
      const rec = await base44.entities.AppSettings.create({
        setting_key: 'geenius_pathways',
        setting_value: value,
        category: 'general',
        description: 'GeeNius pathway URLs configuration'
      });
      setSettingId(rec.id);
    }
    setSaving(false);
    toast.success('Pathway URLs saved');
  };

  const isValid = (url) => url?.startsWith('https://') && !url.includes('example.com') && !url.includes('test_example');

  const pathways = [
    {
      key: 'pathway1_url',
      label: 'Pathway 1 — Gov Tech Grant',
      description: 'URL for the grant eligibility scan (e.g. scan.geeniuspay.com)',
      color: 'purple'
    },
    {
      key: 'pathway2_url',
      label: 'Pathway 2 — Done For You',
      description: 'Your booking/calendar or DFY sales page URL',
      color: 'blue'
    },
    {
      key: 'pathway3_checkout_url',
      label: 'Pathway 3 — DIY Software',
      description: 'Your Stripe checkout or DIY software signup URL',
      color: 'green'
    }
  ];

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8ff00]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Pathway URL Configuration</h1>
          <p className="text-gray-400 text-sm mt-1">
            Set the destination URLs for each pathway on the BridgeGeenius page. A pathway card only shows when its URL is set and valid.
          </p>
        </div>

        <div className="space-y-6">
          {pathways.map(({ key, label, description, color }) => {
            const val = urls[key];
            const valid = isValid(val);
            const empty = !val;
            return (
              <div key={key} className="bg-[#1a1a2e] rounded-xl border border-gray-800 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white text-sm">{label}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{description}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    empty ? 'bg-gray-700 text-gray-400' :
                    valid ? 'bg-green-500/20 text-green-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {empty ? 'Not set' : valid ? '✓ Active' : '⚠ Invalid URL'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={val}
                    onChange={e => setUrls(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder="https://..."
                    className="bg-[#0a0a0f] border-gray-700 text-white placeholder-gray-600 flex-1"
                  />
                  {valid && (
                    <a href={val} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" className="border-gray-700 text-gray-400 hover:text-white shrink-0">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-yellow-200/80 text-sm">
            URLs must start with <code className="text-yellow-300">https://</code>. Pathway cards are hidden from users if their URL is empty or invalid.
          </p>
        </div>

        <Button
          onClick={save}
          disabled={saving}
          className="w-full mt-6 bg-[#c8ff00] text-black hover:bg-[#b8ef00] font-semibold h-11"
        >
          {saving ? (
            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save Pathway URLs</>
          )}
        </Button>
      </div>
    </div>
  );
}