import { getUnits } from '@/lib/actions/units';
import UnitsClient from './UnitsClient';

export default async function UnitsPage() {
  const units = await getUnits();

  return (
    <div className="font-sans">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Base Units</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage the list of units offered when adding a product (PIECE, KG, LITRE, ...).
          </p>
        </header>

        <UnitsClient initialUnits={units} />
      </div>
    </div>
  );
}
