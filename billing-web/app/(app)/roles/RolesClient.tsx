"use client";

import { useState } from 'react';
import { PERMISSIONS, hasClientPermission, Permission } from "@/lib/permissions.client";
import { createRole, updateRole, deleteRole } from '@/lib/actions/roles';
import { Plus, Edit2, Trash2, Shield, X, Check } from 'lucide-react';

export default function RolesClient({ initialRoles }: { initialRoles: any[] }) {
  const [roles, setRoles] = useState(initialRoles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const openCreateModal = () => {
    setEditingRole(null);
    setName('');
    setSelectedPermissions([]);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (role: any) => {
    setEditingRole(role);
    setName(role.name);
    setSelectedPermissions(role.permissions);
    setError(null);
    setIsModalOpen(true);
  };

  const togglePermission = (perm: string) => {
    setSelectedPermissions(prev => 
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingRole) {
        const updated = await updateRole(editingRole.id, name, selectedPermissions);
        setRoles(roles.map(r => r.id === updated.id ? { ...updated, _count: r._count } : r));
      } else {
        const created = await createRole(name, selectedPermissions);
        setRoles([...roles, { ...created, _count: { users: 0 } }]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    
    try {
      await deleteRole(roleId);
      setRoles(roles.filter(r => r.id !== roleId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete role');
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Role
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {roles.map(role => (
          <div key={role.id} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg shadow-gray-200/40 relative group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{role.name}</h3>
              </div>
              <div className="flex gap-2">
                {role.name !== 'Owner' && (
                  <>
                    <button onClick={() => openEditModal(role)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {role._count.users === 0 && (
                      <button onClick={() => handleDelete(role.id)} className="text-gray-400 hover:text-rose-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              Assigned to {role._count.users} user{role._count.users !== 1 && 's'}
            </p>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Permissions</p>
              <div className="flex flex-wrap gap-2">
                {role.permissions.map((perm: string) => (
                  <span key={perm} className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                    {perm.replace('_', ' ')}
                  </span>
                ))}
                {role.permissions.length === 0 && (
                  <span className="text-sm text-gray-400 italic">No permissions</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingRole ? 'Edit Role' : 'Create New Role'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-6 rounded-lg bg-rose-50 p-4 text-sm text-rose-600 border border-rose-200">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Inventory Manager"
                  className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1">
                  {Object.keys(PERMISSIONS).map((perm) => (
                    <label 
                      key={perm} 
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPermissions.includes(perm) 
                          ? 'border-indigo-600 bg-indigo-50/50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`flex h-5 w-5 items-center justify-center rounded border ${
                        selectedPermissions.includes(perm) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'
                      }`}>
                        {selectedPermissions.includes(perm) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{perm.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
