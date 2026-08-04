"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import { updateCustomerPhoto } from '@/lib/actions/customers';
import { useToast } from '@/components/ui/Toast';

export default function CustomerPhotoUpload({ customerId, currentPhotoUrl }: { customerId: string; currentPhotoUrl: string | null }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleUpload = async (url: string) => {
    setSaving(true);
    try {
      await updateCustomerPhoto(customerId, url);
      addToast('success', 'Customer photo updated');
      router.refresh();
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to save photo — please try again');
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
