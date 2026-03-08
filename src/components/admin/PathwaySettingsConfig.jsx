import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, AlertCircle, Save, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const FIELDS = [
  {
    key: 'pathway1_url',
    label: 'GovTech Grant URL',
    placeholder: 'https://funnel.yoursite.com/govtech-grant',
    hint: 'Primary CTA on Bridge page — landing or funnel page for the Gov Tech Grant pathway',
    color: 'purple',
  },
  {
    key: 'pathway2_url',
    label: 'Advisor Booking URL',
    placeholder: 'https://calendly.com/your-team/advisor',
    hint: 'Booking link for Done For You pathway — Calendly, Cal.com, etc.',
    color: 'blue',
  },
  {
    key: 'pathway3_checkout_url',
    label: 'DIY Checkout URL',
    placeholder: 'https://checkout.stripe.com/...',
    hint: 'Stripe or payment checkout for the DIY Software License pathway',
    color: 'green',
  },
];

function validateUrl(url) {
  if (!url || url.trim() === '') return 'URL is required';
  const trimmed = url.trim();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('http://'))
    return 'Only https:// URLs are allowed';
  if (!trimmed.startsWith('https://')) return 'Must start with https://';
  if (trimmed.includes('example.com')) return 'Cannot use example.com as URL';
  try { new URL(trimmed); return null; } catch { return 'Must be a valid URL'; }
}

const COLOR_MAP = {
  purple: { border: 'border-purple-500/40', bg: 'bg-purple-500/10', label: 'text-purple-300' },
  blue:   { border: 'border-blue-500/40',   bg: 'bg-blue-500/10',   label: 'text-blue-300'   },
  green:  { border: 'border-green-500/40',  bg: 'bg-green-500/10',  label: 'text-green-300'  },
};

export default function PathwaySettingsConfig() {
  const [urls, setUrls] = useState({ pathway1_url: '', pathway2_url: '', pathway3_checkout_url: '' });
  const [errors, setErrors] = useState({});
  const [settingId, setSettingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await base44.entities.AppSettings.filter({ setting_key: 'geenius_pathways' });
        if (settings.length > 0) {
          setSettingId(settings[0].id);
          const v = settings[0].setting_value || {};
          setUrls({
            pathway1_url: v.pathway1_url || '',
            pathway2_url: v.pathway2_url || '',
            pathway3_checkout_url: v.pathway3_checkout_url || '',
          });
        }
      } catch (e) {
        console.error('Failed to load pathway settings:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (key, value) => {
    setUrls(prev => ({ ...prev, [key]: value }));
    setSaved(false);
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const handleSave = async () => {
    const newErrors = {};
    FIELDS.forEach(f => { const err = validateUrl(urls[f.key]); if (err) newErrors[f.key] = err; });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Fix validation errors before saving');
      return;
    }
    setSaving(true);
    try {
      const data = {
        setting_key: 'geenius_pathways',
        setting_value: urls,
        category: 'general',
        description: 'Pathway URLs for the Bridge page (GovTech Grant, Advisor Booking, DIY Checkout)',
      };
      if (settingId) {
        await base44.entities.AppSettings.update(settingId, data);
      } else {
        const created = await base44.entities.AppSettings.create(data);
        setSettingId(created.id);
      }
      setSaved(true);
      toast.success('Pathway URLs saved — Bridge page will use updated URLs immediately');
    } catch (e) {
      toast.error(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 py-4">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-white font-bold text-lg">Pathway URL Configuration</h3>
          <p className="text-gray-400 text-sm mt-1">
            Controls where users are sent from the Bridge page. All URLs must use HTTPS.
          </p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle className="w-4 h-4" /> Saved
          </div>
        )}
      </div>

      <div className="space-y-4">
        {FIELDS.map(field => {
          const c = COLOR_MAP[field.color];
          const error = errors[field.key];
          const value = urls[field.key];
          const isValid = value && !validateUrl(value);
          return (
            <div key={field.key} className={`p-4 rounded-xl border ${c.border} ${c.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-sm font-semibold ${c.label}`}>{field.label}</label>
                {isValid && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                {error && <AlertCircle className="w-4 h-4 text-red-400" />}
              </div>
              <Input
                value={value}
                onChange={e => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="bg-black/30 border-gray-700 text-white placeholder-gray-600 text-sm"
              />
              {error ? (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {error}
                </p>
              ) : (
                <p className="text-gray-500 text-xs mt-1.5">{field.hint}</p>
              )}
              {isValid && (
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 text-xs mt-1.5 ${c.label} hover:underline`}
                >
                  <ExternalLink className="w-3 h-3" /> Test URL
                </a>
              )}
            </div>
          );
        })}
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-[#c8ff00] text-black hover:bg-[#b8ef00] font-bold py-5"
      >
        {saving ? (
          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
        ) : (
          <><Save className="w-4 h-4 mr-2" /> Save Pathway Configuration</>
        )}
      </Button>

      <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800">
        <p className="text-xs text-gray-500">
          <strong className="text-gray-400">Note:</strong> Changes take effect immediately on the next Bridge page load. Test each URL before publishing.
        </p>
      </div>
    </div>
  );
}