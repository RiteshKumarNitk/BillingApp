import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { hasPermission } from '@/lib/permissions';
import { listDiscounts } from '@/lib/actions/discounts';
import { getTenantTimeZone, wallClockInTz } from '@/lib/tenantTime';
import DiscountsClient, { type DiscountRow } from './DiscountsClient';

export const dynamic = 'force-dynamic';

export default async function DiscountsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || session.user.role === 'SUPERADMIN') redirect('/dashboard');

  if (!(await hasPermission('EDIT_PRODUCT'))) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center text-red-600 bg-red-50 p-6 rounded-lg border border-red-200">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p>Managing discounts needs the Edit Product permission.</p>
        </div>
      </div>
    );
  }

  const tz = await getTenantTimeZone(session.user.tenantId);
  // Dates are shown/edited as the cafe's own calendar days (the actions store them in that zone).
  const dayKey = (d: Date | null) => {
    if (!d) return '';
    const w = wallClockInTz(d, tz);
    return `${w.year}-${String(w.month).padStart(2, '0')}-${String(w.day).padStart(2, '0')}`;
  };
  const { discounts, categories } = await listDiscounts();
  const now = new Date();
  const rows: DiscountRow[] = discounts.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    code: d.code,
    discountPercentage: d.discountPercentage,
    applicableCategory: d.applicableCategory,
    minimumQuantity: d.minimumQuantity,
    startDay: dayKey(d.startDate),
    endDay: dayKey(d.endDate),
    isActive: d.isActive,
    state: !d.isActive ? 'off' : d.startDate && d.startDate > now ? 'scheduled' : d.endDate && d.endDate < now ? 'expired' : 'live',
  }));

  return (
    <div className="font-sans mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Discounts &amp; Coupons</h1>
        <p className="mt-1 text-sm text-gray-500">
          <strong>Coupons</strong> have a code the cashier enters at billing. <strong>Automatic offers</strong> have no code and apply
          to online &amp; QR orders on their own (the best eligible one wins; they don&apos;t stack).
        </p>
      </header>
      <DiscountsClient discounts={rows} categories={categories} />
    </div>
  );
}
