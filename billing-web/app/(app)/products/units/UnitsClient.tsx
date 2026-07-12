"use client";

import { useState } from 'react';
import { createUnit, updateUnit, deleteUnit } from '@/lib/actions/units';
import { Plus, Edit2, Trash2, Ruler, X, Check } from 'lucide-react';

export default function UnitsClient({ initialUnits }: { initialUnits: any[] }) {
  const [units, setUnits] = useState(initialUnits);
  const [newName, setNewName] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAddLoading(true);
    setError(null);
    try {
      const unit = await createUnit(newName);
      setUnits([...units, unit].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
    } catch (err: any) {
      setError(err.message || 'Failed to add unit');
    } finally {
      setAddLoading(false);
    }
  };

  const startEdit = (unit: any) => {
    setEditingId(unit.id);
    setEditingName(unit.name);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveEdit = async (unitId: string) => {
    if (!editingName.trim()) return;
    setSavingId(unitId);
    setError(null);
    try {
      const updated = await updateUnit(unitId, editingName);
      setUnits(units.map(u => u.id === unitId ? updated : u).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to rename unit');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (unit: any) => {
    if (!confirm(`Delete "${unit.name}"? It will no longer appear as an option when adding products.`)) return;
    try {
      const { productsUsingIt } = await deleteUnit(unit.id);
      setUnits(units.filter(u => u.id !== unit.id));
      if (productsUsingIt > 0) {
        alert(`${productsUsingIt} existing product(s) still use "${unit.name}" — they're unaffected, it just won't be offered for new products anymore.`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete unit');
    }
  };

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-6 flex gap-3">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="e.g. BAG, ROLL, BOTTLE"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 uppercase focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
        />
        <button
          type="submit"
          disabled={addLoading || !newName.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {addLoading ? 'Adding...' : 'Add Unit'}
        </button>
      </form>

      {error && (
        <div className="mb-6 rounded-lg bg-rose-50 p-3 text-sm text-rose-600 border border-rose-200">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {units.map(unit => (
          <div key={unit.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            {editingId === unit.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  autoFocus
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(unit.id); if (e.key === 'Escape') cancelEdit(); }}
                  className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm uppercase focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                <button onClick={() => saveEdit(unit.id)} disabled={savingId === unit.id} className="text-emerald-600 hover:text-emerald-700">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-indigo-500" />
                  <span className="font-medium text-gray-900">{unit.name}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(unit)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(unit)} className="text-gray-400 hover:text-rose-600 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {units.length === 0 && (
        <p className="text-sm text-gray-400 italic">No units yet — add one above.</p>
      )}
    </div>
  );
}
