import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Crown, Wrench, GraduationCap, Save, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const PATHWAYS = [
  {
    key: 'grant',
    label: 'Gov Tech Grant',
    icon: Crown,
    color: '#a855f7',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    defaultSequence: [
      { day: 0,  subject: '🏛️ Your Gov Tech Grant eligibility is being reviewed', tag: 'welcome' },
      { day: 2,  subject: "Here's what happens next with your grant application", tag: 'followup' },
      { day: 7,  subject: 'Quick update on your GeeNius grant status', tag: 'nurture' },
      { day: 14, subject: 'Final step to lock in your free infrastructure upgrade', tag: 'urgency' },
    ],
  },
  {
    key: 'dfy',
    label: 'Done For You',
    icon: Wrench,
    color: '#3b82f6',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    defaultSequence: [
      { day: 0, subject: '🔧 Your Done-For-You onboarding has started', tag: 'welcome' },
      { day: 3, subject: 'Meet your verified GMB provider', tag: 'intro' },
      { day: 7, subject: "First milestone: Here's what we've accomplished", tag: 'update' },
      { day: 21, subject: 'Your 3-week DFY progress report', tag: 'report' },
    ],
  },
  {
    key: 'diy',
    label: 'DIY License',
    icon: GraduationCap,
    color: '#10b981',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    defaultSequence: [
      { day: 0, subject: '🎓 Welcome to your DIY Software License', tag: 'welcome' },
      { day: 1, subject: 'Your quick-start guide is ready', tag: 'onboarding' },
      { day: 5, subject: 'Have you completed Step 1? (Most users miss this)', tag: 'engagement' },
      { day: 14, subject: 'Upgrade to DFY? Here's what you're missing', tag: 'upsell' },
    ],
  },
];

export default function PathwayNurtureConfig() {
  const [config, setConfig] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      const settings = await base44.entities.AppSettings.filter({ setting_key: 'pathway_nurture_config' });
      if (settings.length > 0) {
        setConfig(settings[0].setting_value);
      } else {
        // Init defaults
        const defaults = {};
        PATHWAYS.forEach(p => { defaults[p.key] = { sequence: p.defaultSequence, active: true }; });
        setConfig(defaults);
      }
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    const existing = await base44.entities.AppSettings.filter({ setting_key: 'pathway_nurture_config' });
    if (existing.length > 0) {
      await base44.entities.AppSettings.update(existing[0].id, { setting_value: config });
    } else {
      await base44.entities.AppSettings.create({
        setting_key: 'pathway_nurture_config',
        setting_value: config,
        category: 'email',
        description: 'Pathway-specific nurture sequence configurations',
      });
    }
    setSaving(false);
    setSaved(true);
    toast.success('Nurture config saved');
    setTimeout(() => setSaved(false), 2000);
  };

  const updateStep = (pathwayKey, idx, field, value) => {
    setConfig(prev => {
      const seq = [...(prev[pathwayKey]?.sequence || [])];
      seq[idx] = { ...seq[idx], [field]: value };
      return { ...prev, [pathwayKey]: { ...prev[pathwayKey], sequence: seq } };
    });
  };

  const addStep = (pathwayKey) => {
    setConfig(prev => {
      const seq = [...(prev[pathwayKey]?.sequence || [])];
      seq.push({ day: seq.length * 7, subject: '', tag: 'followup' });
      return { ...prev, [pathwayKey]: { ...prev[pathwayKey], sequence: seq } };
    });
  };

  const removeStep = (pathwayKey, idx) => {
    setConfig(prev => {
      const seq = (prev[pathwayKey]?.sequence || []).filter((_, i) => i !== idx);
      return { ...prev, [pathwayKey]: { ...prev[pathwayKey], sequence: seq } };
    });
  };

  const toggleActive = (pathwayKey) => {
    setConfig(prev => ({
      ...prev,
      [pathwayKey]: { ...prev[pathwayKey], active: !prev[pathwayKey]?.active },
    }));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-lg">Pathway Nurture Sequences</h2>
        <Button
          size="sm"
          onClick={save}
          disabled={saving}
          className="bg-[#c8ff00] text-black hover:bg-[#b8ef00] font-semibold text-xs"
        >
          {saved ? <CheckCircle className="w-3 h-3 mr-1" /> : <Save className="w-3 h-3 mr-1" />}
          {saved ? 'Saved' : saving ? 'Saving...' : 'Save Config'}
        </Button>
      </div>

      {PATHWAYS.map(({ key, label, icon: Icon, color, bg, border, defaultSequence }) => {
        const pathConfig = config[key] || { sequence: defaultSequence, active: true };
        const sequence = pathConfig.sequence || defaultSequence;

        return (
          <div key={key} className={`${bg} ${border} border rounded-xl p-5 space-y-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" style={{ color }} />
                <span className="text-white font-semibold text-sm">{label} Nurture</span>
                <span className="text-xs text-gray-500">{sequence.length} emails</span>
              </div>
              <button
                onClick={() => toggleActive(key)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  pathConfig.active
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-gray-800 border-gray-700 text-gray-500'
                }`}
              >
                {pathConfig.active ? 'Active' : 'Paused'}
              </button>
            </div>

            <div className="space-y-2">
              {sequence.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2 group">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black/30 text-xs font-bold shrink-0" style={{ color }}>
                    D{step.day}
                  </div>
                  <Input
                    value={step.subject}
                    onChange={e => updateStep(key, idx, 'subject', e.target.value)}
                    placeholder="Email subject line..."
                    className="flex-1 bg-black/20 border-white/10 text-white text-xs h-8"
                  />
                  <Input
                    value={step.tag}
                    onChange={e => updateStep(key, idx, 'tag', e.target.value)}
                    placeholder="tag"
                    className="w-24 bg-black/20 border-white/10 text-gray-400 text-xs h-8"
                  />
                  <Input
                    type="number"
                    value={step.day}
                    onChange={e => updateStep(key, idx, 'day', parseInt(e.target.value) || 0)}
                    className="w-16 bg-black/20 border-white/10 text-gray-400 text-xs h-8"
                  />
                  <button
                    onClick={() => removeStep(key, idx)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => addStep(key)}
              className="flex items-center gap-1 text-xs transition-colors hover:text-white"
              style={{ color }}
            >
              <Plus className="w-3 h-3" /> Add email step
            </button>
          </div>
        );
      })}
    </div>
  );
}