import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Plus, Edit2, Trash2, Eye, Loader2, RefreshCw, Globe } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY_FORM = {
  key: '', location_type: 'city', location_value: '', page_slug: '',
  headline: '', subheadline: '', hero_image_url: '',
  primary_cta: '', secondary_cta: '', proof_snippet: '', trust_bar_text: '',
  is_active: true, priority: 5
};

const TYPE_COLORS = {
  city:    'bg-blue-500/20 text-blue-400 border-blue-500/30',
  state:   'bg-purple-500/20 text-purple-400 border-purple-500/30',
  region:  'bg-orange-500/20 text-orange-400 border-orange-500/30',
  country: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  default: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
};

const LOCATION_TYPE_PLACEHOLDERS = {
  city: 'Charlotte', state: 'North Carolina', region: 'Southeast', country: 'United States', default: ''
};

export default function LocationVariantManager() {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.LocationContentVariant.list('priority', 200);
    setVariants(data);
    setLoading(false);
  };

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); };
  const openEdit   = (v) => { setForm({ ...EMPTY_FORM, ...v }); setEditingId(v.id); setShowForm(true); };

  const handleSave = async () => {
    if (!form.location_type) { toast.error('Location type required'); return; }
    if (form.location_type !== 'default' && !form.location_value.trim()) {
      toast.error('Location value required (or choose type = Default)'); return;
    }
    setSaving(true);
    const data = { ...form };
    if (!data.key) {
      data.key = `${data.location_type}_${(data.location_value || 'default').toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    }
    if (editingId) {
      await base44.entities.LocationContentVariant.update(editingId, data);
      toast.success('Variant updated');
    } else {
      await base44.entities.LocationContentVariant.create(data);
      toast.success('Variant created');
    }
    setSaving(false);
    setShowForm(false);
    await load();
  };

  const handleToggle = async (v) => {
    await base44.entities.LocationContentVariant.update(v.id, { is_active: !v.is_active });
    toast.success(v.is_active ? 'Deactivated' : 'Activated');
    await load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this variant?')) return;
    await base44.entities.LocationContentVariant.delete(id);
    toast.success('Deleted');
    await load();
  };

  const filtered = filterType === 'all' ? variants : variants.filter(v => v.location_type === filterType);

  const stats = {
    total:   variants.length,
    active:  variants.filter(v => v.is_active).length,
    cities:  variants.filter(v => v.location_type === 'city').length,
    states:  variants.filter(v => v.location_type === 'state').length
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Variants', value: stats.total,  color: 'text-white' },
          { label: 'Active',         value: stats.active, color: 'text-green-400' },
          { label: 'City Variants',  value: stats.cities, color: 'text-blue-400' },
          { label: 'State Variants', value: stats.states, color: 'text-purple-400' }
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {['all', 'city', 'state', 'region', 'default'].map(t => (
            <Button key={t} size="sm"
              variant={filterType === t ? 'default' : 'ghost'}
              onClick={() => setFilterType(t)}
              className={filterType === t ? 'bg-[#c8ff00] text-black' : 'text-gray-400'}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={load} className="text-gray-300 border-gray-600">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={openCreate} className="bg-[#c8ff00] text-black font-semibold">
            <Plus className="w-4 h-4 mr-1" />Add Variant
          </Button>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Resolution order: City › State › Region › Country › Default. Lower priority number = matched first.
        Use <code className="text-[#c8ff00] bg-gray-800 px-1 rounded">{'{{city}}'}</code> and{' '}
        <code className="text-[#c8ff00] bg-gray-800 px-1 rounded">{'{{state}}'}</code> in text fields for dynamic injection.
      </p>

      {/* Variant List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-700 rounded-xl">
          <Globe className="w-10 h-10 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-500 mb-3">
            {filterType === 'all'
              ? 'No location variants yet. Add one to override hero content by city or state.'
              : `No ${filterType} variants.`}
          </p>
          <Button size="sm" className="bg-[#c8ff00] text-black" onClick={openCreate}>
            Create First Variant
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(v => (
            <div key={v.id} className="p-4 rounded-xl border border-gray-700/50 bg-gray-800/30 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs border ${TYPE_COLORS[v.location_type]}`}>{v.location_type}</Badge>
                    <span className="text-white font-medium text-sm">
                      {v.location_value || 'Default Fallback'}
                    </span>
                    {v.page_slug && <span className="text-xs text-gray-500">/{v.page_slug}</span>}
                    <span className="text-xs text-gray-600">priority: {v.priority ?? 5}</span>
                    <Badge className={`text-xs border-0 ${v.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/40 text-gray-500'}`}>
                      {v.is_active ? 'active' : 'inactive'}
                    </Badge>
                  </div>
                  {v.headline && (
                    <p className="text-sm text-gray-300 mt-1 truncate">"{v.headline}"</p>
                  )}
                  {(v.primary_cta || v.hero_image_url) && (
                    <div className="flex gap-3 mt-0.5">
                      {v.primary_cta   && <span className="text-xs text-[#c8ff00]/70 truncate">CTA: {v.primary_cta}</span>}
                      {v.hero_image_url && <span className="text-xs text-gray-600 truncate">🖼 {v.hero_image_url.slice(0, 40)}…</span>}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Switch checked={v.is_active} onCheckedChange={() => handleToggle(v)} />
                <Button size="icon" variant="ghost" onClick={() => setPreview(v)} className="text-gray-400 hover:text-blue-400 h-8 w-8">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => openEdit(v)} className="text-gray-400 hover:text-white h-8 w-8">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(v.id)} className="text-gray-400 hover:text-red-400 h-8 w-8">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit' : 'New'} Location Variant</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div>
              <Label className="text-gray-300 text-xs">Location Type *</Label>
              <Select value={form.location_type} onValueChange={v => setField('location_type', v)}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {['city', 'state', 'region', 'country', 'default'].map(t => (
                    <SelectItem key={t} value={t} className="text-white">
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300 text-xs">
                Location Value {form.location_type !== 'default' ? '*' : '(N/A for default)'}
              </Label>
              <Input value={form.location_value}
                onChange={e => setField('location_value', e.target.value)}
                placeholder={LOCATION_TYPE_PLACEHOLDERS[form.location_type] || ''}
                disabled={form.location_type === 'default'}
                className="bg-gray-800 border-gray-600 text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Page Slug (blank = all)</Label>
              <Input value={form.page_slug} onChange={e => setField('page_slug', e.target.value)}
                placeholder="quiz" className="bg-gray-800 border-gray-600 text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Priority (1 = highest)</Label>
              <Input type="number" value={form.priority}
                onChange={e => setField('priority', parseInt(e.target.value) || 5)}
                className="bg-gray-800 border-gray-600 text-white mt-1" />
            </div>
            <div className="col-span-2">
              <Label className="text-gray-300 text-xs">Headline</Label>
              <Input value={form.headline} onChange={e => setField('headline', e.target.value)}
                placeholder="Get More {{city}} Customers with AI-Powered Local SEO"
                className="bg-gray-800 border-gray-600 text-white mt-1" />
            </div>
            <div className="col-span-2">
              <Label className="text-gray-300 text-xs">Subheadline</Label>
              <Input value={form.subheadline} onChange={e => setField('subheadline', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Primary CTA</Label>
              <Input value={form.primary_cta} onChange={e => setField('primary_cta', e.target.value)}
                placeholder="Get My Free {{city}} Audit"
                className="bg-gray-800 border-gray-600 text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Secondary CTA</Label>
              <Input value={form.secondary_cta} onChange={e => setField('secondary_cta', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white mt-1" />
            </div>
            <div className="col-span-2">
              <Label className="text-gray-300 text-xs">Hero Image URL</Label>
              <Input value={form.hero_image_url} onChange={e => setField('hero_image_url', e.target.value)}
                placeholder="https://images.unsplash.com/..." className="bg-gray-800 border-gray-600 text-white mt-1" />
            </div>
            <div className="col-span-2">
              <Label className="text-gray-300 text-xs">Proof / Testimonial Snippet</Label>
              <Textarea value={form.proof_snippet} onChange={e => setField('proof_snippet', e.target.value)}
                placeholder='"We doubled our calls in 60 days" — Charlotte HVAC owner'
                className="bg-gray-800 border-gray-600 text-white mt-1" rows={2} />
            </div>
            <div className="col-span-2">
              <Label className="text-gray-300 text-xs">Trust Bar Text</Label>
              <Input value={form.trust_bar_text} onChange={e => setField('trust_bar_text', e.target.value)}
                placeholder="Trusted by 200+ Charlotte businesses"
                className="bg-gray-800 border-gray-600 text-white mt-1" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-gray-600 text-gray-300">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#c8ff00] text-black font-semibold">
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {editingId ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Preview — {preview?.location_value || 'Default'}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-4">
              {preview.hero_image_url && (
                <div className="h-40 rounded-xl overflow-hidden bg-gray-800">
                  <img src={preview.hero_image_url} alt="Hero preview"
                    className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = 'none'; }} />
                </div>
              )}
              {preview.headline && (
                <h2 className="text-xl font-bold text-white">
                  {preview.headline
                    .replace(/\{\{city\}\}/g, preview.location_value || 'Your City')
                    .replace(/\{\{state\}\}/g, '')}
                </h2>
              )}
              {preview.subheadline && <p className="text-gray-400 text-sm">{preview.subheadline}</p>}
              {preview.primary_cta && (
                <button className="px-5 py-2.5 rounded-lg font-semibold text-black text-sm" style={{ backgroundColor: '#c8ff00' }}>
                  {preview.primary_cta.replace(/\{\{city\}\}/g, preview.location_value || 'Your City')}
                </button>
              )}
              {preview.proof_snippet && (
                <div className="p-3 bg-gray-800/60 rounded-lg border border-gray-700 text-sm text-gray-300 italic">
                  {preview.proof_snippet}
                </div>
              )}
              {preview.trust_bar_text && (
                <p className="text-xs text-center text-gray-500">{preview.trust_bar_text}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}