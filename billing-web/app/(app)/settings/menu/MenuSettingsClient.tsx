"use client";

import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface Props {
  tenantId: string;
  address: string;
  initialTheme: string;
}

import { updateTenantTheme } from '@/lib/actions/tenants';

export default function MenuSettingsClient({ tenantId, address, initialTheme }: Props) {
  const { addToast } = useToast();
  const [menuUrl, setMenuUrl] = useState("");
  const [theme, setTheme] = useState(initialTheme);
  const [savingTheme, setSavingTheme] = useState(false);
  const qrRef = useRef<SVGSVGElement>(null);

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

  return (
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
            <div className="flex gap-2 mb-2">
              {['DEFAULT', 'DARK', 'ELEGANT', 'PLAYFUL'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex-1 py-2 px-3 border rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                    theme === t 
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' 
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {t}
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
  );
}
