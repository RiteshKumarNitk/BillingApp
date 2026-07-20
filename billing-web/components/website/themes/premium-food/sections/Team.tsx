import React from 'react';
import { TeamSection, WebsiteConfig } from '@/lib/website/types';

export default function Team({ data, config }: { data: TeamSection['data'], config: WebsiteConfig }) {
  const members = data.members || [];
  if (!members.length) return null;

  return (
    <section className="py-20 bg-[var(--theme-background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            {data.title || "Meet Our Chefs"}
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {members.map(member => (
            <div key={member.id} className="bg-white rounded-3xl p-4 pb-6 text-center shadow-sm border border-gray-100 group">
              <div className="w-full aspect-square rounded-2xl overflow-hidden mb-4 bg-gray-100">
                <img 
                  src={member.imageUrl} 
                  alt={member.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                />
              </div>
              <h4 className="font-bold text-gray-900 text-lg mb-1">{member.name}</h4>
              <p className="text-gray-500 text-sm">{member.role || 'Chef'}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
