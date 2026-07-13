import Link from 'next/link';
import { MapPin, Phone, ChevronRight, Store } from 'lucide-react';
import { getMenuTenant } from './data';
import { getMenuTheme } from './menuThemes';

export default async function MenuHomePage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const tenant = await getMenuTenant(tenantId);
  const theme = getMenuTheme(tenant.menuTheme);
  const isRestaurant = theme.id === 'RESTAURANT';

  return (
    <>
      {/* Hero — establishes this as the tenant's own business page, not just a product list */}
      <section
        className="relative bg-cover bg-center"
        style={tenant.coverImageUrl ? { backgroundImage: `url(${tenant.coverImageUrl})` } : undefined}
      >
        <div
          className="absolute inset-0"
          style={{
            background: tenant.coverImageUrl
              ? 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.65) 100%)'
              : 'linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 55%, black) 100%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 pt-14 pb-12 md:pt-24 md:pb-16">
          <div className={`w-16 h-16 flex items-center justify-center flex-shrink-0 overflow-hidden mb-5 ring-2 ring-[var(--primary-ink)]/25 ${isRestaurant ? 'rounded-full bg-[var(--surface)]' : 'rounded-2xl bg-[var(--accent)]'}`}>
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt={tenant.name} className="w-full h-full object-cover" />
            ) : isRestaurant ? (
              <span className="text-xl font-semibold text-[var(--ink)]" style={{ fontFamily: 'var(--font-display)' }}>
                {tenant.name.slice(0, 2).toUpperCase()}
              </span>
            ) : (
              <Store className="w-7 h-7 text-[var(--accent-ink)]" />
            )}
          </div>
          <h1
            className={`text-[var(--primary-ink)] text-balance ${isRestaurant ? 'text-3xl md:text-5xl font-semibold' : 'text-2xl md:text-4xl font-black'}`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {tenant.name}
          </h1>
          {tenant.tagline && (
            <p className={`text-[var(--primary-ink)]/85 mt-3 max-w-lg text-base md:text-lg ${isRestaurant ? 'italic' : 'font-medium'}`}>
              {tenant.tagline}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-6">
            {tenant.businessHours && (
              <span className="text-xs font-semibold text-[var(--primary-ink)] bg-white/15 px-3 py-1.5 rounded-full backdrop-blur-sm">
                🕐 {tenant.businessHours}
              </span>
            )}
            {tenant.address && (
              <Link
                href={`/menu/${tenantId}/contact`}
                className="text-xs font-semibold text-[var(--primary-ink)] bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1 transition-colors"
              >
                <MapPin className="w-3 h-3" /> {tenant.address}
              </Link>
            )}
            {tenant.phone && (
              <a
                href={`tel:${tenant.phone}`}
                className="text-xs font-semibold text-[var(--primary-ink)] bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1 transition-colors"
              >
                <Phone className="w-3 h-3" /> {tenant.phone}
              </a>
            )}
          </div>
          <Link
            href={`/menu/${tenantId}/shop`}
            className={`mt-8 inline-flex items-center gap-2 px-6 py-3 text-sm font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all bg-[var(--accent)] text-[var(--accent-ink)] ${isRestaurant ? 'rounded-full' : 'rounded-xl'}`}
          >
            {isRestaurant ? 'View Menu' : 'Shop Now'} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* About teaser — the business's own words, with a link through to the full story */}
      {tenant.aboutText && (
        <section className="bg-[var(--surface)] border-b border-[var(--line)]">
          <div className="max-w-5xl mx-auto px-4 py-9 md:py-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)] mb-2">
              {isRestaurant ? 'Our Story' : 'About Us'}
            </p>
            <p
              className={`text-[var(--ink)] max-w-2xl leading-relaxed ${isRestaurant ? 'text-base' : 'text-sm'}`}
              style={isRestaurant ? { fontFamily: 'var(--font-display)' } : undefined}
            >
              {tenant.aboutText.length > 280 ? `${tenant.aboutText.slice(0, 280).trim()}…` : tenant.aboutText}
            </p>
            <Link
              href={`/menu/${tenantId}/about`}
              className="inline-flex items-center gap-1 mt-4 text-xs font-bold hover:opacity-80 transition-opacity"
              style={{ color: 'var(--primary)' }}
            >
              Read more <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </section>
      )}

      {/* Highlights strip — quick reasons to visit, reusing what we already know about the business */}
      <section className="max-w-5xl mx-auto px-4 py-10 md:py-14 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <HighlightCard isRestaurant={isRestaurant} title={isRestaurant ? 'Fresh, made to order' : 'Quality you can trust'}
          body={isRestaurant ? 'Every dish is prepared when you order it — nothing sits around.' : 'Every product is sourced and stocked with care.'} />
        <HighlightCard isRestaurant={isRestaurant} title={tenant.businessHours ? 'Open ' + tenant.businessHours : 'Open daily'}
          body={tenant.address ? `Find us at ${tenant.address}.` : 'Visit us in person or order for pickup.'} />
        <HighlightCard isRestaurant={isRestaurant} title="Order ahead"
          body={`Browse the ${isRestaurant ? 'menu' : 'catalog'}, add what you need, and we'll have it ready.`} />
      </section>
    </>
  );
}

function HighlightCard({ title, body, isRestaurant }: { title: string; body: string; isRestaurant: boolean }) {
  return (
    <div className={`p-5 border border-[var(--line)] ${isRestaurant ? 'rounded-2xl bg-[var(--surface)]' : 'rounded-2xl bg-[var(--surface)] shadow-sm'}`}>
      <p className="text-sm font-bold text-[var(--ink)]" style={{ fontFamily: 'var(--font-display)' }}>{title}</p>
      <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">{body}</p>
    </div>
  );
}
