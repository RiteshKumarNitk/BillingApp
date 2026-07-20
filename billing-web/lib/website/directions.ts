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
