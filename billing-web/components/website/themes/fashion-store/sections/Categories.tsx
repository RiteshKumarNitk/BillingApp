import React from 'react';
import { CategoriesSection, WebsiteConfig } from '@/lib/website/types';

export default function Categories({ data, config }: { data: CategoriesSection['data'], config: WebsiteConfig }) {
  const defaultCategories = [
    { id: '1', name: 'Women', imageUrl: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { id: '2', name: 'Men', imageUrl: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { id: '3', name: 'Accessories', imageUrl: 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }
  ];

  const categories = data.categories?.length ? data.categories : defaultCategories;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-serif text-gray-900 mb-4">{data.title || "Shop by Category"}</h2>
          {data.subtitle && <p className="text-gray-500 uppercase tracking-widest text-sm">{data.subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.slice(0, 3).map((cat) => (
            <a key={cat.id} href="#" className="group block relative overflow-hidden h-[500px]">
              <img 
                src={cat.imageUrl} 
                alt={cat.name} 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <h3 className="text-white text-3xl font-serif mb-4 drop-shadow-md">{cat.name}</h3>
                <span className="inline-block bg-white text-gray-900 px-6 py-3 text-xs font-bold uppercase tracking-widest opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  Explore
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
