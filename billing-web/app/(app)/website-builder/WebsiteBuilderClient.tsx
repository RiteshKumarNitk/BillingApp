"use client";

import { useState } from 'react';
import { WebsiteConfig } from '@/lib/website/types';
import { themes } from '@/lib/website/registry';
import { Save, Layout, Palette, Settings, Layers, ChevronDown, ChevronUp, Eye, EyeOff, FileText, ShoppingBag, Info, PhoneCall, ExternalLink, BookOpen, MessageCircle, Search } from 'lucide-react';
import { useToast } from "@/components/ui/Toast";
import { updateMenuContent, type MenuContentInput } from '@/lib/actions/tenants';
import SectionEditor from './SectionEditor';
import ImageUpload from '@/components/ImageUpload';
import WebsiteRenderer from '@/components/website/WebsiteRenderer';
import { CartProvider } from '@/components/website/CartContext';

type TabId = 'theme' | 'appearance' | 'sections' | 'about' | 'contact' | 'seo' | 'pages' | 'settings';

export default function WebsiteBuilderClient({
  initialConfig, tenantId, tenantWebsiteSlug, tenant, initialAboutInfo,
}: {
  initialConfig: WebsiteConfig;
  tenantId: string;
  tenantWebsiteSlug?: string;
  tenant: any;
  initialAboutInfo: MenuContentInput;
}) {
  const siteId = tenantWebsiteSlug || tenantId;
  const { addToast } = useToast();
  const [config, setConfig] = useState<WebsiteConfig>(initialConfig);
  const [aboutInfo, setAboutInfo] = useState<MenuContentInput>(initialAboutInfo);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('theme');
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const [websiteRes] = await Promise.all([
        fetch('/api/website', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        }),
        updateMenuContent(aboutInfo),
      ]);

      if (!websiteRes.ok) throw new Error('Failed to save website config');
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

  const handleColorChange = (key: 'primary' | 'secondary' | 'accent' | 'background' | 'text', value: string) => {
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

  const handleSectionDataUpdate = (sectionId: string, data: any) => {
    if (!config.sections) return;
    setConfig({
      ...config,
      sections: config.sections.map(s => (s.id === sectionId ? { ...s, data } : s)) as any
    });
  };

  const handleSectionMove = (sectionId: string, dir: -1 | 1) => {
    if (!config.sections) return;
    const sorted = [...config.sections].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex(s => s.id === sectionId);
    const target = index + dir;
    if (index === -1 || target < 0 || target >= sorted.length) return;
    const a = sorted[index], b = sorted[target];
    setConfig({
      ...config,
      sections: config.sections.map(s => {
        if (s.id === a.id) return { ...s, order: b.order };
        if (s.id === b.id) return { ...s, order: a.order };
        return s;
      }) as any
    });
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Settings Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {([
            { id: 'theme', label: 'Theme', icon: Layout },
            { id: 'appearance', label: 'Style', icon: Palette },
            { id: 'sections', label: 'Sections', icon: Layers },
            { id: 'about', label: 'About', icon: BookOpen },
            { id: 'contact', label: 'Contact', icon: MessageCircle },
            { id: 'seo', label: 'SEO', icon: Search },
            { id: 'pages', label: 'Pages', icon: FileText },
            { id: 'settings', label: 'Settings', icon: Settings },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[64px] py-3 text-xs font-medium flex flex-col items-center gap-1 border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
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
                  {(['primary', 'secondary', 'accent', 'background', 'text'] as const).map(key => (
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

              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Typography</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Heading Font</label>
                    <input
                      type="text"
                      value={config.appearance?.typography?.headingFont || ''}
                      onChange={(e) => setConfig({ ...config, appearance: { ...config.appearance, typography: { ...config.appearance?.typography, headingFont: e.target.value } } })}
                      placeholder="Leave blank to use the theme default"
                      className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Body Font</label>
                    <input
                      type="text"
                      value={config.appearance?.typography?.bodyFont || ''}
                      onChange={(e) => setConfig({ ...config, appearance: { ...config.appearance, typography: { ...config.appearance?.typography, bodyFont: e.target.value } } })}
                      placeholder="Leave blank to use the theme default"
                      className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Any valid CSS font-family value, e.g. &quot;Georgia, serif&quot; or a Google Font name already loaded by your theme.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sections' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Manage Sections</h3>
              <p className="text-sm text-gray-500 mb-4">Toggle visibility and edit the text for your website sections.</p>
              
              <div className="space-y-3">
                {config.sections?.slice().sort((a, b) => a.order - b.order).map((section, idx, sorted) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <div className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer" onClick={() => setExpandedSectionId(expandedSectionId === section.id ? null : section.id)}>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col -my-1">
                          <button onClick={(e) => { e.stopPropagation(); handleSectionMove(section.id, -1); }} disabled={idx === 0} className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20" aria-label="Move section up">
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleSectionMove(section.id, 1); }} disabled={idx === sorted.length - 1} className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20" aria-label="Move section down">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
                        <SectionEditor section={section} onUpdate={(data) => handleSectionDataUpdate(section.id, data)} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-1">About Page</h3>
              <p className="text-sm text-gray-500 mb-4">Your story, shown on the About page and used as the homepage hero subtitle when a section doesn&apos;t set its own.</p>

              <ImageUpload
                label="Logo"
                defaultImage={aboutInfo.logoUrl}
                onUploadSuccess={(url) => setAboutInfo({ ...aboutInfo, logoUrl: url })}
              />

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={aboutInfo.tagline || ''}
                  onChange={(e) => setAboutInfo({ ...aboutInfo, tagline: e.target.value })}
                  placeholder="A short line under your business name"
                  className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Our Story</label>
                <textarea
                  value={aboutInfo.aboutText || ''}
                  onChange={(e) => setAboutInfo({ ...aboutInfo, aboutText: e.target.value })}
                  rows={6}
                  placeholder="Tell customers about your business..."
                  className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none"
                />
              </div>

              <ImageUpload
                label="Cover Image"
                defaultImage={aboutInfo.coverImageUrl}
                onUploadSuccess={(url) => setAboutInfo({ ...aboutInfo, coverImageUrl: url })}
              />
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-1">Business Hours</h3>
                <textarea
                  value={aboutInfo.businessHours || ''}
                  onChange={(e) => setAboutInfo({ ...aboutInfo, businessHours: e.target.value })}
                  rows={3}
                  placeholder={'Mon - Fri: 9:00 AM - 9:00 PM\nSat - Sun: 10:00 AM - 6:00 PM'}
                  className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-1">WhatsApp & Maps</h3>
                <p className="text-xs text-gray-500 mb-3">Business address and phone are managed in Tenant Settings — these are website-only extras.</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">WhatsApp Number</label>
                    <input
                      type="text"
                      value={config.businessInfo?.whatsapp || ''}
                      onChange={(e) => setConfig({ ...config, businessInfo: { ...config.businessInfo, whatsapp: e.target.value } })}
                      placeholder="+91XXXXXXXXXX"
                      className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Google Maps Link</label>
                    <input
                      type="text"
                      value={config.businessInfo?.mapsLink || ''}
                      onChange={(e) => setConfig({ ...config, businessInfo: { ...config.businessInfo, mapsLink: e.target.value } })}
                      placeholder="https://maps.google.com/..."
                      className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Social Links</h3>
                <div className="space-y-3">
                  {(['facebook', 'instagram', 'twitter', 'youtube', 'linkedin'] as const).map((key) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">{key}</label>
                      <input
                        type="text"
                        value={config.businessInfo?.socialLinks?.[key] || ''}
                        onChange={(e) => setConfig({
                          ...config,
                          businessInfo: {
                            ...config.businessInfo,
                            socialLinks: { ...config.businessInfo?.socialLinks, [key]: e.target.value }
                          }
                        })}
                        placeholder={`https://${key}.com/...`}
                        className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-1">Search Engine Optimization</h3>
              <p className="text-sm text-gray-500 mb-4">Controls how your homepage appears in search results and when shared on social media.</p>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Meta Title</label>
                <input
                  type="text"
                  value={config.seo?.metaTitle || ''}
                  onChange={(e) => setConfig({ ...config, seo: { ...config.seo, metaTitle: e.target.value } })}
                  placeholder="Defaults to your business name"
                  maxLength={70}
                  className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Meta Description</label>
                <textarea
                  value={config.seo?.metaDescription || ''}
                  onChange={(e) => setConfig({ ...config, seo: { ...config.seo, metaDescription: e.target.value } })}
                  rows={3}
                  maxLength={160}
                  placeholder="A short summary shown under your listing in search results"
                  className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Keywords</label>
                <input
                  type="text"
                  value={config.seo?.keywords || ''}
                  onChange={(e) => setConfig({ ...config, seo: { ...config.seo, keywords: e.target.value } })}
                  placeholder="comma, separated, keywords"
                  className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Canonical URL</label>
                <input
                  type="text"
                  value={config.seo?.canonicalUrl || ''}
                  onChange={(e) => setConfig({ ...config, seo: { ...config.seo, canonicalUrl: e.target.value } })}
                  placeholder={`https://yourdomain.com`}
                  className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-[10px] text-gray-500 mt-1">Only set this if your site is also reachable at a custom domain — it tells search engines which URL is the real one.</p>
              </div>

              <ImageUpload
                label="Social Share Image (OG Image)"
                defaultImage={config.seo?.ogImageUrl}
                onUploadSuccess={(url) => setConfig({ ...config, seo: { ...config.seo, ogImageUrl: url } })}
              />

              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <h4 className="text-sm font-medium text-gray-900 mb-1">Sitemap & Robots</h4>
                <a href={`/site/${siteId}/sitemap.xml`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                  <ExternalLink className="w-4 h-4" /> View sitemap.xml
                </a>
                <a href={`/site/${siteId}/robots.txt`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                  <ExternalLink className="w-4 h-4" /> View robots.txt
                </a>
              </div>
            </div>
          )}

          {activeTab === 'pages' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Manage Pages</h3>
              <p className="text-sm text-gray-500 mb-4">
                Enable or disable sub-pages for your website. Disabled pages are removed from navigation and show a "not available" message if visited directly.
              </p>

              <div className="space-y-3">
                {([
                  { key: 'shop' as const, icon: ShoppingBag, iconBg: 'bg-green-100', iconColor: 'text-green-600', title: 'Shop Page', path: '/site/{tenantId}/shop' },
                  { key: 'about' as const, icon: Info, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', title: 'About Page', path: '/site/{tenantId}/about' },
                  { key: 'contact' as const, icon: PhoneCall, iconBg: 'bg-purple-100', iconColor: 'text-purple-600', title: 'Contact Page', path: '/site/{tenantId}/contact' },
                ]).map(({ key, icon: Icon, iconBg, iconColor, title, path }) => {
                  const enabled = config.pages?.[key] !== false;
                  return (
                    <div key={key} className="border border-gray-200 rounded-xl p-4 bg-white">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${iconColor}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
                          <p className="text-xs text-gray-500">{path}</p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          onClick={() => setConfig({ ...config, pages: { ...config.pages, [key]: !enabled } })}
                          className={`relative w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-4' : ''}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Links</h4>
                  <div className="space-y-2">
                    <a href={`/site/${siteId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                      <ExternalLink className="w-4 h-4" /> View Live Website
                    </a>
                    <a href={`/site/${siteId}/shop`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
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

      {/* Preview Area — renders the real theme components live from in-memory state, so every
          edit shows up immediately with no save and no reload. Link clicks inside the preview are
          swallowed so the builder page itself never navigates away. */}
      <div className="flex-1 bg-gray-100 relative overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />
        <div className="flex-1 p-4 md:p-8 overflow-y-auto relative z-10 flex justify-center">
          <div className="w-full max-w-5xl h-[800px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col">
            <div className="h-10 bg-gray-100 border-b border-gray-200 flex items-center px-4 gap-2 flex-shrink-0">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="mx-auto bg-white border border-gray-200 rounded-md px-3 py-1 text-xs text-gray-500 font-mono w-1/2 text-center truncate">
                Live Preview
              </div>
            </div>
            <div
              className="flex-1 w-full bg-white overflow-y-auto"
              onClickCapture={(e) => {
                const anchor = (e.target as HTMLElement).closest('a');
                if (anchor) e.preventDefault();
              }}
            >
              <CartProvider tenantId={tenantId}>
                <WebsiteRenderer config={config} tenant={tenant} trackVisit={false} />
              </CartProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
