import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, ExternalLink, RefreshCw, BookOpen, Link2, Video, FileText } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['guide', 'video', 'doc', 'tool', 'link'];

const CATEGORY_META = {
  guide:  { icon: BookOpen,  color: 'bg-purple-500/20 text-purple-300' },
  video:  { icon: Video,     color: 'bg-red-500/20 text-red-300'     },
  doc:    { icon: FileText,  color: 'bg-blue-500/20 text-blue-300'   },
  tool:   { icon: RefreshCw, color: 'bg-amber-500/20 text-amber-300' },
  link:   { icon: Link2,     color: 'bg-gray-500/20 text-gray-300'   },
};

const DEFAULT_RESOURCES = [
  { title: 'Google Business Profile Help Center', url: 'https://support.google.com/business', category: 'guide' },
  { title: 'LocalRank Platform Docs', url: 'https://docs.localrank.ai', category: 'doc' },
  { title: 'Resend Email Dashboard', url: 'https://resend.com/dashboard', category: 'tool' },
];

export default function ResourcesManager() {
  const [resources, setResources] = useState([]);
  const [settingId, setSettingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', url: '', category: 'link' });

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await base44.entities.AppSettings.filter({ setting_key: 'resource_links' });
        if (settings.length > 0) {
          setSettingId(settings[0].id);
          setResources(settings[0].setting_value?.links || DEFAULT_RESOURCES);
        } else {
          setResources(DEFAULT_RESOURCES);
        }
      } catch {
        setResources(DEFAULT_RESOURCES);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const persist = async (newResources) => {
    setSaving(true);
    try {
      const data = {
        setting_key: 'resource_links',
        setting_value: { links: newResources },
        category: 'general',
        description: 'Admin knowledge base resource links',
      };
      if (settingId) {
        await base44.entities.AppSettings.update(settingId, data);
      } else {
        const created = await base44.entities.AppSettings.create(data);
        setSettingId(created.id);
      }
      setResources(newResources);
      toast.success('Resources updated');
    } catch (e) {
      toast.error(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    if (!addForm.title.trim() || !addForm.url.trim()) {
      toast.error('Title and URL are required');
      return;
    }
    if (!addForm.url.startsWith('https://')) {
      toast.error('URL must start with https://');
      return;
    }
    persist([...resources, { ...addForm }]);
    setAddForm({ title: '', url: '', category: 'link' });
    setShowAdd(false);
  };

  const handleDelete = (idx) => {
    persist(resources.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 py-4">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading resources...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-white font-bold text-lg">Knowledge Base Resources</h3>
          <p className="text-gray-400 text-sm mt-1">Manage platform documentation, guides, and tool links.</p>
        </div>
        <Button
          onClick={() => setShowAdd(!showAdd)}
          size="sm"
          variant="ghost"
          className="bg-[#00F2FF]/10 text-[#00F2FF] hover:bg-[#00F2FF]/20 border border-[#00F2FF]/30"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Resource
        </Button>
      </div>

      {showAdd && (
        <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl space-y-3">
          <h4 className="text-sm font-semibold text-white">Add New Resource</h4>
          <div className="flex flex-col md:flex-row gap-2">
            <Input
              placeholder="Title"
              value={addForm.title}
              onChange={e => setAddForm(p => ({ ...p, title: e.target.value }))}
              className="bg-gray-800 border-gray-700 text-white flex-1"
            />
            <Input
              placeholder="https://..."
              value={addForm.url}
              onChange={e => setAddForm(p => ({ ...p, url: e.target.value }))}
              className="bg-gray-800 border-gray-700 text-white flex-1"
            />
            <select
              value={addForm.category}
              onChange={e => setAddForm(p => ({ ...p, category: e.target.value }))}
              className="bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2 text-sm"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} size="sm" disabled={saving} className="bg-[#c8ff00] text-black hover:bg-[#b8ef00]">
              {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Add'}
            </Button>
            <Button onClick={() => setShowAdd(false)} size="sm" variant="ghost" className="text-gray-400">
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {resources.length === 0 ? (
          <div className="text-center py-12 border border-gray-800/50 rounded-xl">
            <Link2 className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No resources yet. Add one above.</p>
          </div>
        ) : resources.map((r, i) => {
          const meta = CATEGORY_META[r.category] || CATEGORY_META.link;
          const Icon = meta.icon;
          return (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-gray-900/50 border border-gray-800 rounded-xl group hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs flex-shrink-0 ${meta.color}`}>
                  <Icon className="w-3 h-3" />
                  {r.category}
                </span>
                <span className="text-white text-sm font-medium truncate">{r.title}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-[#00F2FF] transition-colors"
                  title={r.url}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDelete(i)}
                  className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove resource"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}