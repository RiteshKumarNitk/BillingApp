// Renders in place of a page the tenant has switched off in the Website Builder's Pages tab.
// Not wired through notFound() — verified via live testing that notFound() thrown from a page
// under app/site/[tenantId]/* does not reliably set a 404 response status in this Next.js version
// (16.2.6), even though it does render the not-found boundary content. Tracked as a separate,
// pre-existing framework-level issue (also reproduces for a genuinely nonexistent tenant) rather
// than something to work around per-caller; this component keeps the page-toggle feature honest
// and correct regardless of that underlying bug.
export default function PageDisabled({ label }: { label: string }) {
  return (
    <div className="flex-1 flex items-center justify-center py-24 px-4 text-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide opacity-50 mb-2">{label}</p>
        <p className="text-lg opacity-70">This page isn&apos;t available right now.</p>
      </div>
    </div>
  );
}
