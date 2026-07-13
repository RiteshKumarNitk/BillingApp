// Plain helpers shared by server pages (about/contact) and client components (MenuShell) — kept
// out of MenuShell.tsx specifically because that file is "use client" and a Server Component
// can't safely import a plain function from a client-boundary module.

interface DirectionsTarget {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  name: string;
}

export function getDirectionsUrl(tenant: DirectionsTarget) {
  if (tenant.latitude && tenant.longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${tenant.latitude},${tenant.longitude}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(tenant.address || tenant.name)}`;
}
