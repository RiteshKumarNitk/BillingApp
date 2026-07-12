"use client";

import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, ExternalLink, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { updateTenantTheme, updateMenuContent } from '@/lib/actions/tenants';
import ImageUpload from '../../tenants/add/ImageUpload';

interface Props {
  tenantId: string;
  address: string;
  initialTheme: string;
  initialTagline: string;
  initialAboutText: string;
  initialCoverImageUrl: string;
  initialBusinessHours: string;
}

export default function MenuSettingsClient({
  tenantId, address, initialTheme,
  initialTagline, initialAboutText, initialCoverImageUrl, initialBusinessHours,
}: Props) {
  const { addToast } = useToast();
  const [menuUrl, setMenuUrl] = useState("");
  const [theme, setTheme] = useState(initialTheme);
  const [savingTheme, setSavingTheme] = useState(false);
  const qrRef = useRef<SVGSVGElement>(null);

  const [tagline, setTagline] = useState(initialTagline);
  const [aboutText, setAboutText] = useState(initialAboutText);
  const [coverImageUrl, setCoverImageUrl] = useState(initialCoverImageUrl);
  const [businessHours, setBusinessHours] = useState(initialBusinessHours);
  const [savingContent, setSavingContent] = useState(false);
  const contentDirty =
    tagline !== initialTagline || aboutText !== initialAboutText ||
    coverImageUrl !== initialCoverImageUrl || businessHours !== initialBusinessHours;

  // We determine the base URL dynamically on the client side
  if (typeof window !== 'undefined' && !menuUrl) {
    setMenuUrl(`${window.location.origin}/menu/${tenantId}`);
  }

  const copyToClipboard = () => {
    if (!menuUrl) return;
    navigator.clipboard.writeText(menuUrl);
    addToast('success', 'Menu URL copied to clipboard');
  };

  const downloadQR = () => {
    if (!qrRef.current) return;

    // Create a canvas to draw the SVG onto, then download as PNG
    const svg = qrRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Add padding for better printability
      const padding = 40;
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2;

      // Fill white background
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, padding, padding);
      }

      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = "digital-menu-qr.png";
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleSaveTheme = async () => {
    setSavingTheme(true);
    try {
      await updateTenantTheme(theme);
      addToast('success', 'Menu theme updated successfully');
    } catch (err) {
      addToast('error', 'Failed to update menu theme');
      console.error(err);
    } finally {
      setSavingTheme(false);
    }
  };

  const handleSaveContent = async () => {
    setSavingContent(true);
    try {
      await updateMenuContent({ tagline, aboutText, coverImageUrl, businessHours });
      addToast('success', 'Website content updated successfully');
    } catch (err) {
      addToast('error', 'Failed to update website content');
      console.error(err);
    } finally {
      setSavingContent(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Details */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Menu Configuration</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Public Menu Link</label>
              <div className="flex">
                <input
                  type="text"
                  readOnly
                  value={menuUrl}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-l-lg text-sm text-gray-600 focus:outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Customers do not need an account to view this page.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Menu Location</label>
              <textarea
                readOnly
                value={address || "No address configured. Go to Platform Settings to update."}
                rows={3}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Menu Theme</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {[
                  { id: 'MARKET', label: 'Market', desc: 'Retail & grocery', swatch: ['#1F5E4C', '#E3A335'] },
                  { id: 'RESTAURANT', label: 'Restaurant', desc: 'Food & dining', swatch: ['#C97B3D', '#1B1512'] },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`text-left py-3 px-3 border rounded-xl transition-colors ${
                      theme === t.id
                        ? 'bg-indigo-50 border-indigo-500 shadow-sm'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {t.swatch.map((c) => (
                        <span key={c} className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <p className={`text-xs font-bold ${theme === t.id ? 'text-indigo-700' : 'text-gray-700'}`}>{t.label}</p>
                    <p className="text-[10px] text-gray-400">{t.desc}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={handleSaveTheme}
                disabled={savingTheme || theme === initialTheme}
                className="mt-2 w-full py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
              >
                {savingTheme ? 'Saving...' : 'Save Theme'}
              </button>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <a
                href={menuUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
              >
                Open Menu in New Tab <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: QR Code */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Static QR Code</h2>
          <p className="text-sm text-gray-500 mb-8">Print this code for tables, counters, or stickers.</p>

          <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-200 mb-6">
            {menuUrl && (
              <QRCodeSVG
                id="qr-code-svg"
                value={menuUrl}
                size={200}
                level={"H"}
                includeMargin={false}
                ref={qrRef}
              />
            )}
          </div>

          <button
            onClick={downloadQR}
            className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download QR Code (PNG)
          </button>
        </div>
      </div>

      {/* Website Content */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-gray-400" />
          Website Content
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Shown at the top of your public menu so it reads as your own business&apos;s page, not just a product list.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6">
          <ImageUpload
            label="Cover Photo"
            defaultImage={coverImageUrl}
            onUploadSuccess={setCoverImageUrl}
          />

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                maxLength={120}
                placeholder="e.g. Fresh groceries, delivered from your neighbourhood store"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Hours</label>
              <input
                type="text"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                maxLength={80}
                placeholder="e.g. Mon–Sat: 9:00 AM – 9:00 PM"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">About / Story</label>
          <textarea
            value={aboutText}
            onChange={(e) => setAboutText(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="A couple of sentences about who you are — shown between your cover photo and the menu."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <button
          onClick={handleSaveContent}
          disabled={savingContent || !contentDirty}
          className="mt-4 py-2 px-5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {savingContent ? 'Saving...' : 'Save Website Content'}
        </button>
      </div>
    </div>
  );
}
