"use client";

import { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { deleteTenant } from '@/lib/actions/tenants';

export default function DeleteTenantButton({ tenantId, tenantName }: { tenantId: string, tenantName: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setShowModal(false);
      await deleteTenant(tenantId);
    } catch (error) {
      console.error("Failed to delete tenant:", error);
      alert("Failed to delete tenant. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isDeleting}
        className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
        title="Delete Tenant"
      >
        <Trash2 className="w-4 h-4" />
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Delete Tenant</h3>
                  <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Are you absolutely sure you want to delete <strong>{tenantName}</strong>?
                </p>
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-700 font-medium">
                    This will instantly and permanently delete all users, products, transactions, and settings associated with this tenant. This action <strong>CANNOT BE UNDONE</strong>.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
