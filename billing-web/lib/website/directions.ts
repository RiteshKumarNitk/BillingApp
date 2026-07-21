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

// No Google Maps API key needed — the `output=embed` query param on the plain maps.google.com
// URL renders a basic interactive embed for free, same mechanism as "share > embed a map" in the
// Maps UI.
export function getMapEmbedUrl(tenant: DirectionsTarget) {
  const query = tenant.latitude && tenant.longitude
    ? `${tenant.latitude},${tenant.longitude}`
    : (tenant.address || tenant.name);
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}
