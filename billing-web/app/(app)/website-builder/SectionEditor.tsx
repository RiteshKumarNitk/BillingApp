"use client";

import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { WebsiteSection } from '@/lib/website/types';
import ImageUpload from '@/components/ImageUpload';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputClass = "w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500";

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />;
}

function TextArea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={`${inputClass} resize-none`} />;
}

// Generic add/edit/delete/reorder editor for the array-shaped section data (features, reviews,
// members, images, categories). Renders whatever field inputs the caller passes per item.
function ListEditor<T extends Record<string, any>>({
  items, onChange, newItem, renderFields, itemLabel, summary,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  newItem: () => T;
  renderFields: (item: T, update: (patch: Partial<T>) => void) => React.ReactNode;
  itemLabel: string;
  summary: (item: T) => string;
}) {
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const update = (index: number, patch: Partial<T>) => {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  const add = () => onChange([...items, newItem()]);

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-xs text-gray-400 italic">No {itemLabel.toLowerCase()}s yet — add one below.</p>
      )}
      {items.map((item, index) => (
        <div key={item.id ?? index} className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600 truncate">{summary(item) || `${itemLabel} ${index + 1}`}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Move up">
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Move down">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => remove(index)} className="p-1 text-red-400 hover:text-red-600" aria-label="Delete">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="space-y-2">{renderFields(item, (patch) => update(index, patch))}</div>
        </div>
      ))}
      <button type="button" onClick={add} className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-600 border border-dashed border-blue-300 rounded-lg hover:bg-blue-50">
        <Plus className="w-3.5 h-3.5" /> Add {itemLabel}
      </button>
    </div>
  );
}

let idCounter = 0;
function newId() {
  idCounter += 1;
  return `item-${Date.now()}-${idCounter}`;
}

export default function SectionEditor({ section, onUpdate }: { section: WebsiteSection; onUpdate: (data: any) => void }) {
  const data = section.data as any;
  const set = (patch: Record<string, any>) => onUpdate({ ...data, ...patch });

  switch (section.type) {
    case 'hero':
      return (
        <>
          <Field label="Title"><TextInput value={data.title} onChange={(v) => set({ title: v })} /></Field>
          <Field label="Subtitle"><TextArea value={data.subtitle} onChange={(v) => set({ subtitle: v })} /></Field>
          <ImageUpload label="Background Image" defaultImage={data.backgroundImageUrl} onUploadSuccess={(url) => set({ backgroundImageUrl: url })} />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Primary Button Text"><TextInput value={data.ctaPrimary?.label} onChange={(v) => set({ ctaPrimary: { ...data.ctaPrimary, label: v } })} /></Field>
            <Field label="Primary Button Link"><TextInput value={data.ctaPrimary?.url} onChange={(v) => set({ ctaPrimary: { ...data.ctaPrimary, url: v } })} placeholder="/shop" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Secondary Button Text"><TextInput value={data.ctaSecondary?.label} onChange={(v) => set({ ctaSecondary: { ...data.ctaSecondary, label: v } })} /></Field>
            <Field label="Secondary Button Link"><TextInput value={data.ctaSecondary?.url} onChange={(v) => set({ ctaSecondary: { ...data.ctaSecondary, url: v } })} placeholder="/about" /></Field>
          </div>
        </>
      );

    case 'features':
      return (
        <>
          <Field label="Title"><TextInput value={data.title} onChange={(v) => set({ title: v })} /></Field>
          <Field label="Subtitle"><TextArea value={data.subtitle} onChange={(v) => set({ subtitle: v })} /></Field>
          <ListEditor
            items={data.features || []}
            onChange={(features) => set({ features })}
            newItem={() => ({ title: '', description: '', icon: '' })}
            itemLabel="Feature"
            summary={(f) => f.title}
            renderFields={(item, update) => (
              <>
                <Field label="Icon (emoji)"><TextInput value={item.icon} onChange={(v) => update({ icon: v })} placeholder="⭐" /></Field>
                <Field label="Title"><TextInput value={item.title} onChange={(v) => update({ title: v })} /></Field>
                <Field label="Description"><TextArea value={item.description} onChange={(v) => update({ description: v })} /></Field>
              </>
            )}
          />
        </>
      );

    case 'categories':
      return (
        <>
          <Field label="Title"><TextInput value={data.title} onChange={(v) => set({ title: v })} /></Field>
          <Field label="Subtitle"><TextArea value={data.subtitle} onChange={(v) => set({ subtitle: v })} /></Field>
          <ListEditor
            items={data.categories || []}
            onChange={(categories) => set({ categories })}
            newItem={() => ({ id: newId(), name: '', imageUrl: '' })}
            itemLabel="Category"
            summary={(c) => c.name}
            renderFields={(item, update) => (
              <>
                <Field label="Name"><TextInput value={item.name} onChange={(v) => update({ name: v })} /></Field>
                <ImageUpload label="Image" defaultImage={item.imageUrl} onUploadSuccess={(url) => update({ imageUrl: url })} />
              </>
            )}
          />
        </>
      );

    case 'gallery':
      return (
        <>
          <Field label="Title"><TextInput value={data.title} onChange={(v) => set({ title: v })} /></Field>
          <Field label="Subtitle"><TextArea value={data.subtitle} onChange={(v) => set({ subtitle: v })} /></Field>
          <ListEditor
            items={data.images || []}
            onChange={(images) => set({ images })}
            newItem={() => ({ url: '', caption: '' })}
            itemLabel="Image"
            summary={(img) => img.caption || img.url}
            renderFields={(item, update) => (
              <>
                <ImageUpload label="Image" defaultImage={item.url} onUploadSuccess={(url) => update({ url })} />
                <Field label="Caption (optional)"><TextInput value={item.caption} onChange={(v) => update({ caption: v })} /></Field>
              </>
            )}
          />
        </>
      );

    case 'testimonials':
      return (
        <>
          <Field label="Title"><TextInput value={data.title} onChange={(v) => set({ title: v })} /></Field>
          <Field label="Subtitle"><TextArea value={data.subtitle} onChange={(v) => set({ subtitle: v })} /></Field>
          <ListEditor
            items={data.reviews || []}
            onChange={(reviews) => set({ reviews })}
            newItem={() => ({ id: newId(), authorName: '', authorRole: '', text: '', avatarUrl: '', rating: 5 })}
            itemLabel="Testimonial"
            summary={(r) => r.authorName}
            renderFields={(item, update) => (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Name"><TextInput value={item.authorName} onChange={(v) => update({ authorName: v })} /></Field>
                  <Field label="Role / Position"><TextInput value={item.authorRole} onChange={(v) => update({ authorRole: v })} /></Field>
                </div>
                <Field label="Review"><TextArea value={item.text} onChange={(v) => update({ text: v })} /></Field>
                <Field label="Rating (1-5)">
                  <input type="number" min={1} max={5} value={item.rating ?? 5} onChange={(e) => update({ rating: Number(e.target.value) })} className={`${inputClass} w-24`} />
                </Field>
                <ImageUpload label="Photo" defaultImage={item.avatarUrl} onUploadSuccess={(url) => update({ avatarUrl: url })} />
              </>
            )}
          />
        </>
      );

    case 'team':
      return (
        <>
          <Field label="Title"><TextInput value={data.title} onChange={(v) => set({ title: v })} /></Field>
          <Field label="Subtitle"><TextArea value={data.subtitle} onChange={(v) => set({ subtitle: v })} /></Field>
          <ListEditor
            items={data.members || []}
            onChange={(members) => set({ members })}
            newItem={() => ({ id: newId(), name: '', role: '', imageUrl: '' })}
            itemLabel="Team Member"
            summary={(m) => m.name}
            renderFields={(item, update) => (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Name"><TextInput value={item.name} onChange={(v) => update({ name: v })} /></Field>
                  <Field label="Role"><TextInput value={item.role} onChange={(v) => update({ role: v })} /></Field>
                </div>
                <ImageUpload label="Photo" defaultImage={item.imageUrl} onUploadSuccess={(url) => update({ imageUrl: url })} />
              </>
            )}
          />
        </>
      );

    case 'promo-banner':
      return (
        <>
          <Field label="Title"><TextInput value={data.title} onChange={(v) => set({ title: v })} /></Field>
          <Field label="Subtitle"><TextArea value={data.subtitle} onChange={(v) => set({ subtitle: v })} /></Field>
          <Field label="Button Text"><TextInput value={data.buttonText} onChange={(v) => set({ buttonText: v })} /></Field>
          <ImageUpload label="Banner Image" defaultImage={data.imageUrl} onUploadSuccess={(url) => set({ imageUrl: url })} />
        </>
      );

    case 'newsletter':
      return (
        <>
          <Field label="Title"><TextInput value={data.title} onChange={(v) => set({ title: v })} /></Field>
          <Field label="Subtitle"><TextArea value={data.subtitle} onChange={(v) => set({ subtitle: v })} /></Field>
          <Field label="Input Placeholder"><TextInput value={data.placeholderText} onChange={(v) => set({ placeholderText: v })} /></Field>
          <Field label="Button Text"><TextInput value={data.buttonText} onChange={(v) => set({ buttonText: v })} /></Field>
        </>
      );

    case 'reservation':
      return (
        <>
          <Field label="Title"><TextInput value={data.title} onChange={(v) => set({ title: v })} /></Field>
          <Field label="Subtitle"><TextArea value={data.subtitle} onChange={(v) => set({ subtitle: v })} /></Field>
          <Field label="Button Text"><TextInput value={data.buttonText} onChange={(v) => set({ buttonText: v })} /></Field>
        </>
      );

    case 'app-download':
      return (
        <>
          <Field label="Title"><TextInput value={data.title} onChange={(v) => set({ title: v })} /></Field>
          <Field label="Subtitle"><TextArea value={data.subtitle} onChange={(v) => set({ subtitle: v })} /></Field>
          <Field label="App Store URL"><TextInput value={data.appStoreUrl} onChange={(v) => set({ appStoreUrl: v })} placeholder="https://..." /></Field>
          <Field label="Play Store URL"><TextInput value={data.playStoreUrl} onChange={(v) => set({ playStoreUrl: v })} placeholder="https://..." /></Field>
        </>
      );

    case 'footer':
      return (
        <>
          <Field label="Copyright Text">
            <TextInput value={data.copyrightText} onChange={(v) => set({ copyrightText: v })} />
          </Field>
          <p className="text-[10px] text-gray-500">Use {'{year}'} and {'{tenant}'} as placeholders.</p>
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
            <input type="checkbox" checked={!!data.showSocialLinks} onChange={(e) => set({ showSocialLinks: e.target.checked })} className="rounded border-gray-300" />
            Show social links
          </label>
        </>
      );

    default:
      return (
        <>
          {typeof data.title !== 'undefined' && <Field label="Title"><TextInput value={data.title} onChange={(v) => set({ title: v })} /></Field>}
          {typeof data.subtitle !== 'undefined' && <Field label="Subtitle"><TextArea value={data.subtitle} onChange={(v) => set({ subtitle: v })} /></Field>}
        </>
      );
  }
}
