"use client";

import { useState } from 'react';
import { toggleTenantStatus } from '@/lib/actions/tenants';

export default function TenantStatusToggle({ tenantId, currentStatus }: { tenantId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false);
  const isActive = currentStatus === 'ACTIVE';

  const handleToggle = async () => {
    if (!confirm(`Are you sure you want to ${isActive ? 'deactivate' : 'activate'} this tenant?`)) return;
    
    setLoading(true);
    try {
      await toggleTenantStatus(tenantId);
    } catch (err: any) {
      alert(err.message || 'Failed to update tenant status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
        isActive 
          ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' 
          : 'bg-green-100 text-green-700 hover:bg-green-200'
      }`}
    >
      {loading ? 'Updating...' : isActive ? 'Deactivate Tenant' : 'Activate Tenant'}
    </button>
  );
}
