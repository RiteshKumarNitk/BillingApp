import React from 'react';
import { TodaysSpecialSection, WebsiteConfig } from '@/lib/website/types';
import { Coffee } from 'lucide-react';

export type TodaysSpecialStyle = 'pill' | 'minimal';

export default function TodaysSpecial({ data, tenant, variant = 'pill' }: { data: TodaysSpecialSection['data']; config: WebsiteConfig; tenant: any; variant?: TodaysSpecialStyle }) {
  const featured = (tenant?.products || []).filter((p: any) => p.isFeatured);
  if (featured.length === 0) return null;
  const currency = tenant?.currency || 'INR';
  const format = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

  if (variant === 'minimal') {
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
                <span className="text-xl font-semibold whitespace-nowrap" style={{ color: 'var(--theme-background)' }}>{format(product.salePrice)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // 'pill' (modern-coffee's original look)
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--theme-accent)' }}>
      <div className="max-w-5xl mx-auto text-center">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white mb-6" style={{ backgroundColor: 'var(--theme-primary)' }}>
          <Coffee className="w-3.5 h-3.5" /> {data.title || "Today's Special"}
        </span>
        {data.subtitle && <p className="mb-8" style={{ color: 'var(--theme-primary)' }}>{data.subtitle}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {featured.slice(0, 3).map((product: any) => (
            <div key={product.id} className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="font-black text-lg" style={{ color: 'var(--theme-primary)' }}>{product.name}</h3>
              {product.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>}
              <p className="font-black text-2xl mt-3" style={{ color: 'var(--theme-primary)' }}>{format(product.salePrice)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
