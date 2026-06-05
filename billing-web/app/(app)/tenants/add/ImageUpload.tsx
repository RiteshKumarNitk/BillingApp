"use client";

import { useState, useRef } from 'react';
import { UploadCloud, X, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  label: string;
  onUploadSuccess: (url: string) => void;
  defaultImage?: string;
  className?: string;
}

export default function ImageUpload({ label, onUploadSuccess, defaultImage, className = "" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultImage || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('File size must be less than 5MB.');
      return;
    }

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      onUploadSuccess(data.url);
    } catch (err: any) {
      console.error(err);
      setError('Failed to upload image to server.');
      setPreviewUrl(null); // Revert preview on failure
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onUploadSuccess(''); // Clear the URL in the parent form
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      {previewUrl ? (
        <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button 
              type="button" 
              onClick={handleRemove}
              className="p-1.5 bg-white text-rose-600 rounded-full hover:bg-rose-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/50 transition-colors flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-indigo-600"
        >
          <UploadCloud className="w-6 h-6" />
          <span className="text-xs font-medium px-2 text-center">Click to upload</span>
        </button>
      )}
      
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  );
}
