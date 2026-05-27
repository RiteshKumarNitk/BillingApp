"use client";

import { useState } from 'react';
import { createTenantUser, deleteTenantUser } from '@/lib/actions/users';
import { Plus, Trash2, User, Mail, Shield, X } from 'lucide-react';

export default function UsersClient({ initialUsers, roles, currentUserId, isSuperAdmin = false }: { initialUsers: any[], roles: any[], currentUserId: string, isSuperAdmin?: boolean }) {
  const [users, setUsers] = useState(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');

  const openCreateModal = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setRoleId('');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createTenantUser({ 
        name, 
        email, 
        phone, 
        password, 
        tenantRoleId: isSuperAdmin ? undefined : roleId,
        isSuperAdminUser: isSuperAdmin 
      });
      // Reload the page to get fresh data instead of complex client state sync
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await deleteTenantUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
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
          Invite User
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/40">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role & Tenant</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        {user.name}
                        {user.id === currentUserId && (
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 flex flex-col gap-1">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {user.email}</span>
                    {user.phone && <span className="flex items-center gap-1 text-xs text-gray-400">📞 {user.phone}</span>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col items-start gap-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                      <Shield className="h-3 w-3" />
                      {user.tenantRole?.name || (user.role === 'SUPERADMIN' ? 'Superadmin' : 'No Role')}
                    </span>
                    {user.tenant?.name && (
                      <span className="text-xs text-gray-500 font-medium">🏢 {user.tenant.name}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {user.id !== currentUserId && (
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-gray-400 hover:text-rose-600 transition-colors"
                      title="Delete User"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-800">Invite Team Member</h2>
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

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number (Optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="+91..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Role</label>
                  {isSuperAdmin ? (
                    <div className="w-full rounded-lg border-gray-300 border px-4 py-2 bg-gray-50 text-gray-700 sm:text-sm">
                      Superadmin (Global Access)
                    </div>
                  ) : (
                    <select
                      required
                      value={roleId}
                      onChange={e => setRoleId(e.target.value)}
                      className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white"
                    >
                      <option value="" disabled>Select a role...</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  )}
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
                  {loading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
