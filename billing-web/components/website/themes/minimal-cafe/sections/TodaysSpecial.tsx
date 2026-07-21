import React from 'react';
import { TodaysSpecialSection, WebsiteConfig } from '@/lib/website/types';

export default function TodaysSpecial({ data, config, tenant }: { data: TodaysSpecialSection['data'], config: WebsiteConfig, tenant: any }) {
  const featured = (tenant?.products || []).filter((p: any) => p.isFeatured);
  if (featured.length === 0) return null;
  const currency = tenant?.currency || 'INR';

  return (
    <section className="py-20 px-6 border-y border-black/10" style={{ backgroundColor: 'var(--theme-primary)' }}>
      <div className="max-w-2xl mx-auto text-center">
        <span className="text-xs uppercase tracking-widest text-white/60">{data.title || "Today's Special"}</span>
        {data.subtitle && <p className="text-white/70 mt-2 text-sm">{data.subtitle}</p>}
        <div className="mt-8 space-y-6">
          {featured.slice(0, 3).map((product: any) => (
            <div key={product.id} className="flex items-baseline justify-between gap-4 text-white">
              <h3 className="text-xl font-semibold">{product.name}</h3>
              <div className="flex-1 border-b border-dotted border-white/25 mb-1.5" />
              <span className="text-xl font-semibold whitespace-nowrap" style={{ color: 'var(--theme-background)' }}>
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(product.salePrice)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
