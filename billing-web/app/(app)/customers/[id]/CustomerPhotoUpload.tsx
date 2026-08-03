"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import { updateCustomerPhoto } from '@/lib/actions/customers';

export default function CustomerPhotoUpload({ customerId, currentPhotoUrl }: { customerId: string; currentPhotoUrl: string | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleUpload = async (url: string) => {
    setSaving(true);
    try {
      await updateCustomerPhoto(customerId, url);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4">
      <ImageUpload label="Customer Photo" defaultImage={currentPhotoUrl || undefined} onUploadSuccess={handleUpload} />
      {saving && <p className="text-xs text-gray-400 mt-1">Saving…</p>}
    </div>
  );
}
