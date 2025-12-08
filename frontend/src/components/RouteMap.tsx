import React, { useMemo } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Location {
  name: string;
  lat: number;
  lng: number;
}

interface SegmentPoint {
  lat: number;
  lng: number;
}

interface Segment {
  fromIndex: number;
  toIndex: number;
  route: SegmentPoint[];
}

interface RouteMapProps {
  locations: Location[];
  pathId: number;
  segments?: Segment[];
}

const FitBounds = ({ positions }: { positions: [number, number][] }) => {
  const map = useMap();
  React.useEffect(() => {
    if (!positions.length) return;
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [24, 24] });
  }, [positions, map]);
  return null;
};

const isAcademic = (name: string) => {
  const tokens = ['hall', 'center', 'building', 'lab', 'laboratory', 'library', 'academic'];
  const lower = name.toLowerCase();
  return tokens.some((t) => lower.includes(t));
};

const stopIcon = (index: number, name: string) =>
  L.divIcon({
    html: `<div style="
      width:30px;height:30px;border-radius:9999px;
      background:${isAcademic(name) ? '#2563eb' : '#ec4899'};color:#fff;border:2px solid #fff;
      display:flex;align-items:center;justify-content:center;
      font-weight:700;box-shadow:0 6px 12px rgba(0,0,0,0.18);
      ">${index + 1}</div>`,
    className: "",
  });

const palette = ["#2563eb", "#8b5cf6", "#22c55e", "#eab308", "#f97316", "#ef4444"];

export function RouteMap({ locations, segments }: RouteMapProps) {
  const fallbackOrigin =
    (locations || []).find((l) => Number.isFinite(l.lat) && Number.isFinite(l.lng)) || {
      lat: 40.1106,
      lng: -88.2073
    };

  const resolvedPositions: [number, number][] = (locations || []).map((l) => {
    if (Number.isFinite(l.lat) && Number.isFinite(l.lng)) return [l.lat, l.lng];
    return [fallbackOrigin.lat, fallbackOrigin.lng];
  });

  if (!resolvedPositions || resolvedPositions.length < 2) {
    return (
      <div className="mt-4">
        <div className="w-full h-[200px] rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50 text-sm text-gray-500">
          Not enough stops to draw a route.
        </div>
      </div>
    );
  }

  const positions: [number, number][] = useMemo(() => resolvedPositions, [resolvedPositions]);

  const routes = useMemo(() => {
    // Build a map for quick lookup of provided segment routes
    const segmentMap: Record<string, [number, number][]> = {};
    if (segments && segments.length) {
      segments.forEach((s) => {
        if (Array.isArray(s.route) && s.route.length >= 2) {
          segmentMap[`${s.fromIndex}-${s.toIndex}`] = s.route.map((p) => [p.lat, p.lng]);
        }
      });
    }

    // Ensure every consecutive pair of stops is drawn; use provided route if available, else straight line
    return positions.slice(0, -1).map((_, idx) => {
      const key = `${idx}-${idx + 1}`;
      const provided = segmentMap[key];
      const points = provided && provided.length >= 2 ? provided : [positions[idx], positions[idx + 1]];
      return {
        key,
        color: palette[idx % palette.length],
        points,
      };
    });
  }, [segments, positions]);

  const center = positions[0];

  return (
    <div className="mt-4 rounded-lg border border-gray-200 overflow-hidden shadow-sm w-full">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "320px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        />
        <FitBounds positions={positions} />

        {routes.map((r) => (
          <Polyline
            key={r.key}
            positions={r.points}
            pathOptions={{ color: r.color, weight: 6, opacity: 0.9 }}
          />
        ))}

        {(locations || []).map((loc, idx) => (
          <Marker
            key={loc.name + idx}
            position={positions[idx]}
            icon={stopIcon(idx, loc.name)}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold text-gray-800">{loc.name}</div>
                {idx + 1 < (locations?.length || 0) && (
                  <div className="text-gray-600">Next: {locations?.[idx + 1]?.name}</div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
