'use client';
import React from 'react';
import { CategoriesSection, WebsiteConfig } from '@/lib/website/types';
import Link from 'next/link';

export default function Categories({ data, config, tenant }: { data: CategoriesSection['data'], config: WebsiteConfig, tenant: any }) {
  const products = tenant?.products || [];
  const categoryNames: string[] = Array.from(new Set(products.map((p: any) => p.category || 'Other')));
  const defaultCategories = [
    { id: '1', name: 'Leafy Greens', imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { id: '2', name: 'Root Vegetables', imageUrl: 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { id: '3', name: 'Fresh Fruits', imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { id: '4', name: 'Herbs', imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
  ];

  const displayCategories = categoryNames.length > 0
    ? categoryNames.slice(0, 4).map((name: string, i: number) => ({
        id: String(i),
        name,
        imageUrl: defaultCategories[i]?.imageUrl || defaultCategories[0].imageUrl
      }))
    : defaultCategories;

  if (products.length === 0 && !data.categories?.length) return null;

  return (
    <section id="categories" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wider">Categories</span>
          <h2 className="text-4xl font-extrabold text-green-900 tracking-tight mt-2 mb-4">
            {data.title || "Shop by Category"}
          </h2>
          {data.subtitle && <p className="text-green-700/60 max-w-xl mx-auto">{data.subtitle}</p>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {displayCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/site/${tenant?.id}/shop`}
              className="group relative overflow-hidden rounded-2xl aspect-square shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <img
                src={cat.imageUrl}
                alt={cat.name}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-green-900/80 via-green-900/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-center">
                <h3 className="text-white font-bold text-lg drop-shadow-sm">{cat.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
