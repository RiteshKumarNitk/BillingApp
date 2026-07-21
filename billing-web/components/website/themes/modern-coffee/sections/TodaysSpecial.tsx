import React from 'react';
import { TodaysSpecialSection, WebsiteConfig } from '@/lib/website/types';
import { Coffee } from 'lucide-react';

export default function TodaysSpecial({ data, config, tenant }: { data: TodaysSpecialSection['data'], config: WebsiteConfig, tenant: any }) {
  const featured = (tenant?.products || []).filter((p: any) => p.isFeatured);
  if (featured.length === 0) return null;
  const currency = tenant?.currency || 'INR';

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
              <p className="font-black text-2xl mt-3" style={{ color: 'var(--theme-primary)' }}>
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(product.salePrice)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
