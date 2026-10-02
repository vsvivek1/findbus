"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { isLive, timeAgo, type BusResult } from "@/lib/types";

// Default view: Kerala. The map re-fits to buses once results arrive.
const DEFAULT_CENTER: [number, number] = [11.2588, 75.7804];

function busIcon(live: boolean, selected: boolean) {
  const bg = live ? "#f59e0b" : "#a8a29e";
  const ring = selected ? "0 0 0 4px rgba(245,158,11,.45)," : "";
  return L.divIcon({
    className: "",
    html: `<div style="background:${bg};width:30px;height:30px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid white;box-shadow:${ring}0 1px 4px rgba(0,0,0,.4)">🚌</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function FitToBuses({ points, selected }: { points: [number, number][]; selected: [number, number] | null }) {
  const map = useMap();
  const key = points.map((p) => p.join(",")).join("|");
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) map.setView(points[0], 13);
    else map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
    // Re-fit only when the set of buses changes, not on every position tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, points.length, key.length]);
  useEffect(() => {
    if (selected) map.setView(selected, Math.max(map.getZoom(), 13));
  }, [map, selected]);
  return null;
}

export default function BusMap({
  buses,
  selectedId,
  onSelect,
}: {
  buses: BusResult[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const located = buses.filter((b) => b.lat != null && b.lng != null);
  const points = located.map((b) => [b.lat!, b.lng!] as [number, number]);
  const sel = located.find((b) => b.id === selectedId);

  return (
    <MapContainer center={DEFAULT_CENTER} zoom={11} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToBuses points={points} selected={sel ? [sel.lat!, sel.lng!] : null} />
      {located.map((b) => (
        <Marker
          key={b.id}
          position={[b.lat!, b.lng!]}
          icon={busIcon(isLive(b.location_updated_at), b.id === selectedId)}
          eventHandlers={{ click: () => onSelect(b.id) }}
        >
          <Popup>
            <strong>{b.name || b.reg_no}</strong>
            <br />
            {b.route_name}
            <br />
            {b.reg_no} · seen {timeAgo(b.location_updated_at)}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
