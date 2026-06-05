"use client";

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteTenant } from '@/lib/actions/tenants';

export default function DeleteTenantButton({ tenantId, tenantName }: { tenantId: string, tenantName: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const isConfirmed = window.confirm(
      `Are you ABSOLUTELY sure you want to delete the tenant "${tenantName}"?\n\n` +
      `WARNING: This will instantly and permanently delete all users, products, transactions, and settings associated with this tenant. This action CANNOT BE UNDONE.`
    );

    if (!isConfirmed) return;

    try {
      setIsDeleting(true);
      await deleteTenant(tenantId);
    } catch (error) {
      console.error("Failed to delete tenant:", error);
      alert("Failed to delete tenant. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
      title="Delete Tenant"
    >
      <Trash2 className="w-4 h-4" />
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  );
}
