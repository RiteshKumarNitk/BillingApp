import { MapPin, Phone, Clock, Navigation } from 'lucide-react';
import { getMenuTenant } from '../data';
import { getMenuTheme } from '../menuThemes';
import { getDirectionsUrl } from '../menuUtils';

export default async function ContactPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const tenant = await getMenuTenant(tenantId);
  const theme = getMenuTheme(tenant.menuTheme);
  const isRestaurant = theme.id === 'RESTAURANT';

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 md:py-16">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)] mb-3">Get in Touch</p>
      <h1
        className={`text-balance ${isRestaurant ? 'text-3xl font-semibold' : 'text-2xl font-black'}`}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Visit or reach {tenant.name}
      </h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {tenant.address && (
          <ContactCard isRestaurant={isRestaurant} icon={<MapPin className="w-4 h-4" style={{ color: 'var(--primary)' }} />} label="Address">
            <p className="text-sm text-[var(--ink)]">{tenant.address}</p>
            <a
              href={getDirectionsUrl(tenant)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold hover:opacity-80 transition-opacity"
              style={{ color: 'var(--primary)' }}
            >
              <Navigation className="w-3.5 h-3.5" /> Get Directions
            </a>
          </ContactCard>
        )}

        {tenant.phone && (
          <ContactCard isRestaurant={isRestaurant} icon={<Phone className="w-4 h-4" style={{ color: 'var(--primary)' }} />} label="Phone">
            <p className="text-sm text-[var(--ink)]">{tenant.phone}</p>
            <a
              href={`tel:${tenant.phone}`}
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold hover:opacity-80 transition-opacity"
              style={{ color: 'var(--primary)' }}
            >
              <Phone className="w-3.5 h-3.5" /> Call Now
            </a>
          </ContactCard>
        )}

        {tenant.businessHours && (
          <ContactCard isRestaurant={isRestaurant} icon={<Clock className="w-4 h-4" style={{ color: 'var(--primary)' }} />} label="Hours">
            <p className="text-sm text-[var(--ink)]">{tenant.businessHours}</p>
          </ContactCard>
        )}
      </div>

      {!tenant.address && !tenant.phone && !tenant.businessHours && (
        <p className="text-sm text-[var(--muted)] mt-6 leading-relaxed">
          Contact details haven&apos;t been added yet.
        </p>
      )}
    </div>
  );
}

function ContactCard({ icon, label, children, isRestaurant }: { icon: React.ReactNode; label: string; children: React.ReactNode; isRestaurant: boolean }) {
  return (
    <div className={`p-5 border border-[var(--line)] rounded-2xl bg-[var(--surface)] ${isRestaurant ? '' : 'shadow-sm'}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      </div>
      {children}
    </div>
  );
}
