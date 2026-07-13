import Link from 'next/link';
import { MapPin, Phone, ChevronRight } from 'lucide-react';
import { getMenuTenant } from '../data';
import { getMenuTheme } from '../menuThemes';

export default async function AboutPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const tenant = await getMenuTenant(tenantId);
  const theme = getMenuTheme(tenant.menuTheme);
  const isRestaurant = theme.id === 'RESTAURANT';

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 md:py-16">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)] mb-3">
        {isRestaurant ? 'Our Story' : 'About Us'}
      </p>
      <h1
        className={`text-balance ${isRestaurant ? 'text-3xl font-semibold' : 'text-2xl font-black'}`}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {isRestaurant ? `The story behind ${tenant.name}` : `About ${tenant.name}`}
      </h1>

      {tenant.tagline && (
        <p className={`text-[var(--muted)] mt-3 text-base ${isRestaurant ? 'italic' : 'font-medium'}`}>{tenant.tagline}</p>
      )}

      {tenant.aboutText ? (
        <p
          className={`text-[var(--ink)] leading-relaxed mt-6 whitespace-pre-line ${isRestaurant ? 'text-base' : 'text-sm'}`}
          style={isRestaurant ? { fontFamily: 'var(--font-display)' } : undefined}
        >
          {tenant.aboutText}
        </p>
      ) : (
        <p className="text-sm text-[var(--muted)] mt-6 leading-relaxed">
          We haven&apos;t added our story yet — but we&apos;d love to have you visit. Reach out any time.
        </p>
      )}

      <div className="mt-10 pt-8 border-t border-[var(--line)] flex flex-wrap items-center gap-3">
        {tenant.address && (
          <span className="text-xs font-semibold text-[var(--muted)] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} /> {tenant.address}
          </span>
        )}
        {tenant.phone && (
          <a href={`tel:${tenant.phone}`} className="text-xs font-semibold text-[var(--muted)] flex items-center gap-1.5 hover:text-[var(--ink)] transition-colors">
            <Phone className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} /> {tenant.phone}
          </a>
        )}
        <Link
          href={`/menu/${tenantId}/contact`}
          className="ml-auto inline-flex items-center gap-1 text-xs font-bold hover:opacity-80 transition-opacity"
          style={{ color: 'var(--primary)' }}
        >
          Get directions <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
