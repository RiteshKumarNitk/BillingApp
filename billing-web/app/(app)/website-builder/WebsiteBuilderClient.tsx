"use client";

import React, { useState } from 'react';
import { WebsiteConfig } from '@/lib/website/types';
import { themes } from '@/lib/website/registry';
import { Save, Layout, Palette, Settings, Layers, ChevronDown, ChevronUp, Eye, EyeOff, FileText, ShoppingBag, Info, PhoneCall, ExternalLink } from 'lucide-react';
import { useToast } from "@/components/ui/Toast";

export default function WebsiteBuilderClient({ initialConfig, tenantId }: { initialConfig: WebsiteConfig, tenantId: string }) {
  const { addToast } = useToast();
  const [config, setConfig] = useState<WebsiteConfig>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'theme' | 'appearance' | 'sections' | 'pages' | 'settings'>('theme');
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) throw new Error('Failed to save website config');
      addToast('success', 'Website configuration saved successfully!');
    } catch (error) {
      console.error(error);
      addToast('error', 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = async (themeId: string) => {
    if (config.theme !== themeId) {
      const useDefaults = window.confirm("Switch theme? This will load the default sections for the selected theme.");
      if (useDefaults) {
        try {
          const res = await fetch(`/api/website/theme-defaults?theme=${themeId}`);
          if (res.ok) {
            const defaults = await res.json();
            setConfig(defaults as WebsiteConfig);
            return;
          }
        } catch {}
      }
    }
    setConfig({ ...config, theme: themeId });
  };

  const handleColorChange = (key: 'primary' | 'secondary' | 'background' | 'text', value: string) => {
    setConfig({
      ...config,
      appearance: {
        ...config.appearance,
        colors: {
          ...config.appearance?.colors,
          [key]: value
        }
      }
    });
  };

  const handleSectionVisibility = (sectionId: string, isVisible: boolean) => {
    if (!config.sections) return;
    setConfig({
      ...config,
      sections: config.sections.map(s => s.id === sectionId ? { ...s, isVisible } : s) as any
    });
  };

  const handleSectionDataChange = (sectionId: string, field: string, value: string) => {
    if (!config.sections) return;
    setConfig({
      ...config,
      sections: config.sections.map(s => {
        if (s.id === sectionId) {
          return { ...s, data: { ...(s.data as any), [field]: value } } as any;
        }
        return s;
      }) as any
    });
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Settings Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10">
        <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('theme')}
            className={`flex-1 py-3 text-xs font-medium flex flex-col items-center gap-1 border-b-2 ${activeTab === 'theme' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Layout className="w-4 h-4" />
            Theme
          </button>
          <button 
            onClick={() => setActiveTab('appearance')}
            className={`flex-1 py-3 text-xs font-medium flex flex-col items-center gap-1 border-b-2 ${activeTab === 'appearance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Palette className="w-4 h-4" />
            Style
          </button>
          <button 
            onClick={() => setActiveTab('sections')}
            className={`flex-1 py-3 text-xs font-medium flex flex-col items-center gap-1 border-b-2 ${activeTab === 'sections' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Layers className="w-4 h-4" />
            Sections
          </button>
          <button 
            onClick={() => setActiveTab('pages')}
            className={`flex-1 py-3 text-xs font-medium flex flex-col items-center gap-1 border-b-2 ${activeTab === 'pages' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <FileText className="w-4 h-4" />
            Pages
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 text-xs font-medium flex flex-col items-center gap-1 border-b-2 ${activeTab === 'settings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Select Theme</h3>
              <div className="grid gap-3">
                {themes.map(theme => (
                  <div 
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    className={`cursor-pointer border rounded-xl p-4 transition-all ${config.theme === theme.id ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                  >
                    <h4 className="font-medium text-gray-900">{theme.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{theme.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Brand Colors</h3>
                <div className="space-y-4">
                  {(['primary', 'secondary', 'background', 'text'] as const).map(key => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">{key} Color</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={config.appearance?.colors?.[key] || '#000000'} 
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="h-8 w-8 rounded border border-gray-200 cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={config.appearance?.colors?.[key] || '#000000'}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="flex-1 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sections' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Manage Sections</h3>
              <p className="text-sm text-gray-500 mb-4">Toggle visibility and edit the text for your website sections.</p>
              
              <div className="space-y-3">
                {config.sections?.sort((a, b) => a.order - b.order).map(section => (
                  <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <div className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer" onClick={() => setExpandedSectionId(expandedSectionId === section.id ? null : section.id)}>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleSectionVisibility(section.id, !section.isVisible); }}
                          className={`p-1.5 rounded-md transition-colors ${section.isVisible ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-400 hover:bg-gray-200'}`}
                        >
                          {section.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <span className="font-medium text-sm text-gray-800 capitalize">
                          {section.type.replace('-', ' ')}
                        </span>
                      </div>
                      {expandedSectionId === section.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                    
                    {expandedSectionId === section.id && (
                      <div className="p-4 border-t border-gray-200 space-y-4">
                        {typeof (section.data as any).title !== 'undefined' && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                            <input 
                              type="text" 
                              value={(section.data as any).title}
                              onChange={(e) => handleSectionDataChange(section.id, 'title', e.target.value)}
                              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                        )}
                        
                        {typeof (section.data as any).subtitle !== 'undefined' && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Subtitle / Description</label>
                            <textarea 
                              value={(section.data as any).subtitle}
                              onChange={(e) => handleSectionDataChange(section.id, 'subtitle', e.target.value)}
                              rows={3}
                              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none"
                            />
                          </div>
                        )}
                        
                        {section.type === 'footer' && typeof (section.data as any).copyrightText !== 'undefined' && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Copyright Text</label>
                            <input 
                              type="text" 
                              value={(section.data as any).copyrightText}
                              onChange={(e) => handleSectionDataChange(section.id, 'copyrightText', e.target.value)}
                              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Use {'{year}'} and {'{tenant}'} as placeholders.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'pages' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Manage Pages</h3>
              <p className="text-sm text-gray-500 mb-4">
                Enable or disable sub-pages for your website.
              </p>

              <div className="space-y-3">
                <div className="border border-gray-200 rounded-xl p-4 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">Shop Page</h4>
                      <p className="text-xs text-gray-500">/menu/{'{tenantId}'}/shop</p>
                    </div>
                    <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-4 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Info className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">About Page</h4>
                      <p className="text-xs text-gray-500">/site/{'{tenantId}'}/about</p>
                    </div>
                    <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-4 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <PhoneCall className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">Contact Page</h4>
                      <p className="text-xs text-gray-500">/site/{'{tenantId}'}/contact</p>
                    </div>
                    <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Links</h4>
                  <div className="space-y-2">
                    <a href={`/site/${tenantId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                      <ExternalLink className="w-4 h-4" /> View Live Website
                    </a>
                    <a href={`/menu/${tenantId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                      <ExternalLink className="w-4 h-4" /> View Menu / Shop
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Print QR Code</h3>
              <p className="text-sm text-gray-500 mb-4">
                Place this QR code on tables or print it on flyers so customers can easily access your website.
              </p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col items-center">
                <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                  {typeof window !== 'undefined' ? (
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/s/' + tenantId)}`} 
                      alt="Website QR Code" 
                      className="w-32 h-32"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gray-200 animate-pulse rounded-lg"></div>
                  )}
                </div>
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(window.location.origin + '/s/' + tenantId)}`;
                    link.download = `QR_Code_${tenantId}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 w-full"
                >
                  Download HD Image
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 bg-gray-100 relative overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />
        <div className="flex-1 p-4 md:p-8 overflow-y-auto relative z-10 flex justify-center">
          <div className="w-full max-w-5xl h-[800px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col">
            <div className="h-10 bg-gray-100 border-b border-gray-200 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="mx-auto bg-white border border-gray-200 rounded-md px-3 py-1 text-xs text-gray-500 font-mono w-1/2 text-center truncate">
                Preview Mode - /site/{tenantId}
              </div>
            </div>
            <iframe 
              src={`/site/${tenantId}`}
              className="flex-1 w-full bg-white"
              title="Live Preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
