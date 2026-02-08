import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Trash2 } from 'lucide-react';

export default function ABTestCreator({ onClose, onCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    page: 'quiz',
    element: 'headline',
    variants: [
      { id: 'variant_a', name: 'Control', content: {} },
      { id: 'variant_b', name: 'Variant B', content: {} }
    ],
    traffic_split: { variant_a: 50, variant_b: 50 }
  });

  const [contentFields, setContentFields] = useState([
    { key: 'headline', type: 'text', label: 'Headline' }
  ]);

  const addVariant = () => {
    const newId = `variant_${String.fromCharCode(97 + formData.variants.length)}`;
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { id: newId, name: `Variant ${String.fromCharCode(65 + prev.variants.length)}`, content: {} }],
      traffic_split: { ...prev.traffic_split, [newId]: 0 }
    }));
  };

  const removeVariant = (index) => {
    if (formData.variants.length <= 2) return;
    const variantId = formData.variants[index].id;
    setFormData(prev => {
      const newVariants = prev.variants.filter((_, i) => i !== index);
      const newSplit = { ...prev.traffic_split };
      delete newSplit[variantId];
      return { ...prev, variants: newVariants, traffic_split: newSplit };
    });
  };

  const updateVariantContent = (variantIndex, field, value) => {
    setFormData(prev => {
      const newVariants = [...prev.variants];
      newVariants[variantIndex].content[field] = value;
      return { ...prev, variants: newVariants };
    });
  };

  const updateTrafficSplit = (variantId, value) => {
    setFormData(prev => ({
      ...prev,
      traffic_split: { ...prev.traffic_split, [variantId]: parseInt(value) || 0 }
    }));
  };

  const addContentField = () => {
    const fieldName = prompt('Enter field name (e.g., cta_text, subheadline):');
    if (fieldName) {
      setContentFields(prev => [...prev, { key: fieldName, type: 'text', label: fieldName }]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await base44.entities.ABTest.create({
        ...formData,
        status: 'active',
        start_date: new Date().toISOString()
      });
      
      onCreated();
    } catch (error) {
      console.error('Error creating test:', error);
      alert('Failed to create test');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 border border-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Create A/B Test</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Test Details */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white mb-2 block">Test Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Quiz Headline Test"
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>

            <div>
              <Label className="text-white mb-2 block">Page</Label>
              <Select value={formData.page} onValueChange={(value) => setFormData(prev => ({ ...prev, page: value }))}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="pricing">Pricing</SelectItem>
                  <SelectItem value="upsell">Upsell (Monthly)</SelectItem>
                  <SelectItem value="upsell1">Upsell 1 (Rapid Repair)</SelectItem>
                  <SelectItem value="upsell2">Upsell 2 (DFY)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label className="text-white mb-2 block">Element Being Tested</Label>
              <Input
                value={formData.element}
                onChange={(e) => setFormData(prev => ({ ...prev, element: e.target.value }))}
                placeholder="e.g., headline, cta, pricing"
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>
          </div>

          {/* Content Fields */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-white">Content Fields</Label>
              <Button type="button" variant="outline" size="sm" onClick={addContentField}>
                <Plus className="w-4 h-4 mr-1" />
                Add Field
              </Button>
            </div>
            <div className="text-sm text-gray-400 mb-2">
              Fields: {contentFields.map(f => f.key).join(', ')}
            </div>
          </div>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-white">Variants</Label>
              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                <Plus className="w-4 h-4 mr-1" />
                Add Variant
              </Button>
            </div>

            <div className="space-y-4">
              {formData.variants.map((variant, index) => (
                <div key={variant.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Input
                      value={variant.name}
                      onChange={(e) => {
                        const newVariants = [...formData.variants];
                        newVariants[index].name = e.target.value;
                        setFormData(prev => ({ ...prev, variants: newVariants }));
                      }}
                      className="bg-gray-800 border-gray-700 text-white max-w-xs"
                    />
                    {formData.variants.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVariant(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 mb-3">
                    {contentFields.map(field => (
                      <div key={field.key}>
                        <Label className="text-gray-400 text-xs mb-1 block">{field.label}</Label>
                        <Textarea
                          value={variant.content[field.key] || ''}
                          onChange={(e) => updateVariantContent(index, field.key, e.target.value)}
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                          className="bg-gray-900 border-gray-700 text-white text-sm h-20"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <Label className="text-gray-400 text-xs mb-1 block">Traffic Split (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.traffic_split[variant.id] || 0}
                      onChange={(e) => updateTrafficSplit(variant.id, e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white w-24"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-800">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black">
              Create Test
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}