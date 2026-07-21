"use client";

import { useState } from 'react';
import { createTable, updateTable, deleteTable } from '@/lib/actions/tables';
import { useToast } from '@/components/ui/Toast';
import { Plus, Trash2, Download, QrCode, X } from 'lucide-react';

interface Table {
  id: string;
  label: string;
  qrToken: string;
  isActive: boolean;
}

export default function TablesClient({ tables: initialTables, siteId }: { tables: Table[]; siteId: string }) {
  const { addToast } = useToast();
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [qrTable, setQrTable] = useState<Table | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const getTableUrl = (table: Table) => `${origin}/site/${siteId}?t=${table.qrToken}`;
  const getQrImageUrl = (table: Table, size: number) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(getTableUrl(table))}`;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setAdding(true);
    try {
      const table = await createTable(newLabel.trim());
      setTables(prev => [...prev, table].sort((a, b) => a.label.localeCompare(b.label)));
      setNewLabel('');
      addToast('success', `${table.label} added`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to add table');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleActive = async (table: Table) => {
    try {
      const updated = await updateTable(table.id, { isActive: !table.isActive });
      setTables(prev => prev.map(t => (t.id === table.id ? updated : t)));
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update table');
    }
  };

  const handleDelete = async (table: Table) => {
    try {
      await deleteTable(table.id);
      setTables(prev => prev.filter(t => t.id !== table.id));
      addToast('success', `${table.label} removed`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to remove table');
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tables & QR Ordering</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Create a table, print its QR code, and customers who scan it land straight on your menu with the table already set — no manual entry needed.
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="e.g. Table 5, Patio 2"
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
        />
        <button
          type="submit"
          disabled={adding || !newLabel.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Add Table
        </button>
      </form>

      {tables.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <QrCode className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No tables yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first table above to generate its QR code.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tables.map(table => (
            <div key={table.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <button
                onClick={() => setQrTable(table)}
                className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0 hover:border-indigo-300 transition-colors"
              >
                <img src={getQrImageUrl(table, 120)} alt={`QR for ${table.label}`} className="w-14 h-14" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{table.label}</p>
                <button
                  onClick={() => handleToggleActive(table)}
                  className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full ${
                    table.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {table.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
              <button onClick={() => handleDelete(table)} className="p-2 text-gray-400 hover:text-rose-500 flex-shrink-0" aria-label={`Delete ${table.label}`}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {qrTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setQrTable(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center">
            <button onClick={() => setQrTable(null)} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-1">{qrTable.label}</h2>
            <p className="text-xs text-gray-400 mb-5 break-all">{getTableUrl(qrTable)}</p>
            <div className="bg-gray-50 rounded-xl p-6 mb-5 inline-block">
              <img src={getQrImageUrl(qrTable, 260)} alt={`QR for ${qrTable.label}`} className="w-56 h-56" />
            </div>
            <a
              href={getQrImageUrl(qrTable, 800)}
              download={`QR_${qrTable.label.replace(/\s+/g, '_')}.png`}
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Download className="w-4 h-4" /> Download HD Image
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
