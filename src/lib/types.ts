export type BusResult = {
  id: string;
  reg_no: string;
  name: string | null;
  route_name: string;
  stops: string[];
  operator: string;
  is_demo: boolean;
  lat: number | null;
  lng: number | null;
  speed: number | null;
  heading: number | null;
  location_updated_at: string | null;
};

export type OwnerBus = {
  id: string;
  reg_no: string;
  name: string | null;
  route_name: string;
  stops: string[];
  active: boolean;
  driver_secret: string;
  lat: number | null;
  lng: number | null;
  location_updated_at: string | null;
};

export type OwnerDashboard = {
  owner: { name: string; company: string | null; phone: string; email: string | null; city: string | null };
  buses: OwnerBus[];
};

/** A position older than this is shown as "last seen" instead of live. */
export const LIVE_WINDOW_MS = 5 * 60 * 1000;

export function isLive(updatedAt: string | null): boolean {
  return !!updatedAt && Date.now() - new Date(updatedAt).getTime() < LIVE_WINDOW_MS;
}

export function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
}
