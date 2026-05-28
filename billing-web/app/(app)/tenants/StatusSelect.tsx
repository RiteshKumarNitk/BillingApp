'use client';

export default function StatusSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select
      name="status"
      defaultValue={defaultValue}
      onChange={(e) => e.target.form?.submit()}
      className="pl-4 pr-8 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-gray-900 text-sm appearance-none bg-white"
    >
      <option value="">All Status</option>
      <option value="ACTIVE">Active</option>
      <option value="INACTIVE">Inactive</option>
    </select>
  );
}
