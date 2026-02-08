import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Palette,
  Type,
  Image,
  Settings,
  Save,
  Download,
  RotateCcw,
  Upload,
  Smartphone,
  Monitor,
  LayoutTemplate
} from 'lucide-react';
import BrandPreview from '@/components/BrandPreview';

// Default brand configuration
const DEFAULT_BRAND_CONFIG = {
  // Brand Identity
  brandName: 'LocalRnk',
  tagline: 'Rank Higher. Get Found. Grow Faster.',
  logo: null,
  favicon: null,

  // Colors
  colors: {
    primary: '#c8ff00',
    secondary: '#1a1a1a',
    accent: '#3b82f6',
    background: '#0a0a0a',
    text: '#ffffff'
  },

  // Typography
  typography: {
    fontFamily: 'Inter',
    headingSize: 48,
    bodySize: 16
  },

  // Features
  features: {
    darkMode: true,
    analytics: true,
    whiteLabel: false,
    customDomain: true,
    apiAccess: true,
    affiliateProgram: false
  }
};

// Google Fonts options
const GOOGLE_FONTS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Work Sans', label: 'Work Sans' },
  { value: 'DM Sans', label: 'DM Sans' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' }
];

export default function BrandEditor() {
  const [config, setConfig] = useState(DEFAULT_BRAND_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState(null);
  const [activeTab, setActiveTab] = useState('landing');
  const [isDragging, setIsDragging] = useState(false);

  // Update brand identity
  const updateBrandIdentity = useCallback((field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Update colors
  const updateColor = useCallback((colorKey, value) => {
    setConfig(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value
      }
    }));
  }, []);

  // Update typography
  const updateTypography = useCallback((field, value) => {
    setConfig(prev => ({
      ...prev,
      typography: {
        ...prev.typography,
        [field]: value
      }
    }));
  }, []);

  // Update features
  const updateFeature = useCallback((feature, value) => {
    setConfig(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: value
      }
    }));
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback((type, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target.result;
      if (type === 'logo') {
        setLogoPreview(result);
        updateBrandIdentity('logo', result);
      } else {
        setFaviconPreview(result);
        updateBrandIdentity('favicon', result);
      }
    };
    reader.readAsDataURL(file);
  }, [updateBrandIdentity]);

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(type, file);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    setConfig(DEFAULT_BRAND_CONFIG);
    setLogoPreview(null);
    setFaviconPreview(null);
    toast.info('Settings reset to defaults');
  };

  // Save configuration
  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    toast.success('Brand settings saved successfully!');
  };

  // Export configuration
  const handleExport = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'brand-config.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success('Configuration exported!');
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#c8ff00]/10 rounded-lg">
                <Palette className="w-6 h-6 text-[#c8ff00]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Brand Editor</h1>
                <p className="text-sm text-gray-400">Customize your white-label experience</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleReset}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-medium"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left Side - Editor */}
          <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-140px)] pr-2">
            {/* Brand Identity Card */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Image className="w-5 h-5 text-[#c8ff00]" />
                  Brand Identity
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Define your brand's core identity elements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Brand Name</Label>
                    <Input
                      value={config.brandName}
                      onChange={(e) => updateBrandIdentity('brandName', e.target.value)}
                      className="bg-gray-950 border-gray-700 text-white"
                      placeholder="Your Brand Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Tagline</Label>
                    <Input
                      value={config.tagline}
                      onChange={(e) => updateBrandIdentity('tagline', e.target.value)}
                      className="bg-gray-950 border-gray-700 text-white"
                      placeholder="Your tagline"
                    />
                  </div>
                </div>

                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Logo</Label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'logo')}
                    className={`
                      relative border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer
                      ${isDragging ? 'border-[#c8ff00] bg-[#c8ff00]/5' : 'border-gray-700 hover:border-gray-600'}
                    `}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload('logo', e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {logoPreview ? (
                      <div className="flex flex-col items-center gap-3">
                        <img src={logoPreview} alt="Logo preview" className="h-16 object-contain" />
                        <span className="text-sm text-gray-400">Click or drag to replace</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-gray-500" />
                        <span className="text-sm text-gray-400">Drop logo here or click to upload</span>
                        <span className="text-xs text-gray-600">SVG, PNG, JPG up to 2MB</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Favicon Upload */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Favicon</Label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'favicon')}
                    className={`
                      relative border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer
                      ${isDragging ? 'border-[#c8ff00] bg-[#c8ff00]/5' : 'border-gray-700 hover:border-gray-600'}
                    `}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload('favicon', e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {faviconPreview ? (
                      <div className="flex items-center justify-center gap-3">
                        <img src={faviconPreview} alt="Favicon preview" className="w-8 h-8 rounded" />
                        <span className="text-sm text-gray-400">Click or drag to replace</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Upload className="w-5 h-5 text-gray-500" />
                        <span className="text-sm text-gray-400">Upload favicon (32x32px recommended)</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Colors Card */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Palette className="w-5 h-5 text-[#c8ff00]" />
                  Colors
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Customize your brand color palette
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(config.colors).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-gray-300 capitalize">{key} Color</Label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={value}
                            onChange={(e) => updateColor(key, e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                          />
                        </div>
                        <Input
                          value={value}
                          onChange={(e) => updateColor(key, e.target.value)}
                          className="bg-gray-950 border-gray-700 text-white font-mono uppercase"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Typography Card */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Type className="w-5 h-5 text-[#c8ff00]" />
                  Typography
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Configure fonts and text sizes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-gray-300">Font Family</Label>
                  <Select
                    value={config.typography.fontFamily}
                    onValueChange={(value) => updateTypography('fontFamily', value)}
                  >
                    <SelectTrigger className="bg-gray-950 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      {GOOGLE_FONTS.map((font) => (
                        <SelectItem
                          key={font.value}
                          value={font.value}
                          className="text-white hover:bg-gray-800"
                        >
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-gray-300">Heading Size</Label>
                      <span className="text-sm text-gray-400">{config.typography.headingSize}px</span>
                    </div>
                    <Slider
                      value={[config.typography.headingSize]}
                      onValueChange={([value]) => updateTypography('headingSize', value)}
                      min={24}
                      max={72}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-gray-300">Body Size</Label>
                      <span className="text-sm text-gray-400">{config.typography.bodySize}px</span>
                    </div>
                    <Slider
                      value={[config.typography.bodySize]}
                      onValueChange={([value]) => updateTypography('bodySize', value)}
                      min={12}
                      max={24}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features Card */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="w-5 h-5 text-[#c8ff00]" />
                  Features
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Enable or disable platform features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(config.features).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 bg-gray-950/50 rounded-lg border border-gray-800"
                    >
                      <div>
                        <Label className="text-gray-300 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        <p className="text-xs text-gray-500">
                          {key === 'darkMode' && 'Enable dark mode toggle'}
                          {key === 'analytics' && 'Show analytics dashboard'}
                          {key === 'whiteLabel' && 'Hide LocalRnk branding'}
                          {key === 'customDomain' && 'Allow custom domains'}
                          {key === 'apiAccess' && 'Enable API key management'}
                          {key === 'affiliateProgram' && 'Show affiliate settings'}
                        </p>
                      </div>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) => updateFeature(key, checked)}
                        className="data-[state=checked]:bg-[#c8ff00]"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Live Preview */}
          <div className="xl:sticky xl:top-6 h-fit">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Monitor className="w-5 h-5 text-[#c8ff00]" />
                      Live Preview
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      See changes in real-time
                    </CardDescription>
                  </div>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-gray-950 border border-gray-800">
                      <TabsTrigger value="landing" className="data-[state=active]:bg-gray-800">
                        <LayoutTemplate className="w-4 h-4 mr-1" />
                        Landing
                      </TabsTrigger>
                      <TabsTrigger value="dashboard" className="data-[state=active]:bg-gray-800">
                        <Monitor className="w-4 h-4 mr-1" />
                        Dashboard
                      </TabsTrigger>
                      <TabsTrigger value="mobile" className="data-[state=active]:bg-gray-800">
                        <Smartphone className="w-4 h-4 mr-1" />
                        Mobile
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <BrandPreview config={config} activeTab={activeTab} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
