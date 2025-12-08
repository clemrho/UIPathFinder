import React, { useState } from 'react';
import { RouteMap } from './RouteMap';

interface Location {
  name: string;
  lat: number;
  lng: number;
}

interface ScheduleItem {
  time: string;
  location: string;
  activity: string;
  coordinates: { lat: number; lng: number };
}

interface PathOption {
  id: number;
  title: string;
  schedule: ScheduleItem[];
  modelName?: string;
  isFallback?: boolean;
  reason?: string;
  segments?: {
    fromIndex: number;
    toIndex: number;
    route: { lat: number; lng: number }[];
  }[];
}

interface EnhancedPathSuggestionsProps {
  pathOptions: PathOption[];
  onSelectPlan?: (selected: PathOption) => void | Promise<void>;
}

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m18 15-6-6-6 6" />
  </svg>
);

export function EnhancedPathSuggestions({ pathOptions, onSelectPlan }: EnhancedPathSuggestionsProps) {
  const [expandedPaths, setExpandedPaths] = useState<Record<number, boolean>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const allowSelection = typeof onSelectPlan === 'function';

  const isAcademic = (name?: string) => {
    if (!name) return false;
    const tokens = ['hall', 'center', 'building', 'lab', 'laboratory', 'library', 'academic'];
    const lower = name.toLowerCase();
    return tokens.some((t) => lower.includes(t));
  };

  const estimateTravel = (from?: ScheduleItem, to?: ScheduleItem) => {
    if (!from || !to || !from.coordinates || !to.coordinates) {
      return { mins: 8, km: 0.6 };
    }
    const R = 6371; // km
    const dLat = ((to.coordinates.lat - from.coordinates.lat) * Math.PI) / 180;
    const dLon = ((to.coordinates.lng - from.coordinates.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((from.coordinates.lat * Math.PI) / 180) *
        Math.cos((to.coordinates.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;
    const walkingSpeed = 4.5; // km/h
    const mins = (distanceKm / walkingSpeed) * 60;
    const safeMins = !Number.isFinite(mins) || mins <= 0 ? 6 : Math.max(3, Math.round(mins));
    const safeKm = !Number.isFinite(distanceKm) || distanceKm <= 0 ? 0.6 : distanceKm;
    return { mins: safeMins, km: safeKm };
  };

  const togglePath = (pathId: number) => {
    setExpandedPaths(prev => ({
      ...prev,
      [pathId]: !prev[pathId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="mb-2 text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">🗺️ Schedule Path Suggestions</h3>
        <p className="text-sm text-gray-700 font-semibold">Generated {pathOptions.length} path options with UIUC campus route maps and real-time traffic conditions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {pathOptions.map((path) => {
        const isExpanded = expandedPaths[path.id] ?? true;
        // Fill missing coordinates from segment endpoints when available
        const getCoordForIndex = (idx: number) => {
          const item = path.schedule[idx];
          const coord = item?.coordinates || {};
          // accept multiple key shapes from the model
          const lat =
            coord.lat ??
            coord.latitude ??
            coord.Latitude ??
            coord.latitudes ??
            coord.latlng?.[0];
          const lng =
            coord.lng ??
            coord.long ??
            coord.longitude ??
            coord.Longitude ??
            coord.latlng?.[1];
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            return { lat, lng };
          }
          if (Array.isArray(path.segments)) {
            const segFrom = path.segments.find((s) => s.fromIndex === idx && Array.isArray(s.route) && s.route.length);
            if (segFrom) {
              const p = segFrom.route[0];
              if (Number.isFinite(p.lat) && Number.isFinite(p.lng)) return { lat: p.lat, lng: p.lng };
            }
            const segTo = path.segments.find((s) => s.toIndex === idx && Array.isArray(s.route) && s.route.length);
            if (segTo) {
              const p = segTo.route[segTo.route.length - 1];
              if (Number.isFinite(p.lat) && Number.isFinite(p.lng)) return { lat: p.lat, lng: p.lng };
            }
          }
          return null;
        };

        const locations: Location[] = path.schedule.map((item, idx) => {
          const coord = getCoordForIndex(idx);
          return {
            name: item.location,
            lat: coord?.lat ?? NaN,
            lng: coord?.lng ?? NaN,
          };
        });

        const isSelected = selectedId === path.id;

        return (
          <div key={path.id} className="rounded-xl border border-gray-200 bg-white shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div 
              className="p-5 bg-slate-800 text-white cursor-pointer hover:bg-slate-700 transition-colors border-b border-slate-700"
              onClick={() => togglePath(path.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <h3 className={`text-lg noto-sans-uniquifier font-bold`}>
                    {isSelected
                      ? `Selected Path: ${path.title.replace(/^Path Option \d+:\s*/, '')}`
                      : path.title}
                  </h3>
                  {path.modelName && (
                    <p className="text-xs text-slate-200 mt-0.5">
                      Generated by model: {path.modelName}
                    </p>
                  )}
                  <p className="text-sm text-slate-200 mt-1">
                    {path.schedule.length} stops • 
                    {path.schedule[0]?.time} - {path.schedule[path.schedule.length - 1]?.time}
                  </p>
                </div>
                <button className="text-slate-200 hover:text-white transition-colors">
                  {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="p-5">
                {/* 路线地图 */}
                {path.isFallback ? (
                  <div className="mt-4 w-full h-[200px] rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50 text-sm text-gray-500">
                    no where to go, sleep at grainger 2F.
                  </div>
                ) : (
                  <RouteMap locations={locations} pathId={path.id} segments={path.segments} />
                )}

                {/* LLM reason / explanation */}
                {path.reason && (
                  <div className="mt-4 text-sm text-gray-600">
                    {path.reason}
                  </div>
                )}

                {/* Detailed Schedule */}
                <div className="mt-6">
                  <h4 className="text-sm text-gray-800 mb-3 flex items-center gap-2 justify-center font-bold">
                    <span>Detailed Schedule</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Timeline</span>
                  </h4>
                  <div className="space-y-6">
                    {path.schedule.map((item, index) => {
                      const next = path.schedule[index + 1];
                      const travel = next ? estimateTravel(item, next) : null;
                      const academic = isAcademic(item.location);
                      const stopColor = academic ? 'bg-blue-600' : 'bg-pink-500';
                      const stopShadow = academic ? 'shadow-blue-200' : 'shadow-pink-200';
                      return (
                        <React.Fragment key={index}>
                          <div className="relative overflow-hidden rounded-xl border border-gray-100 shadow-sm bg-white">
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-50 via-indigo-50 to-cyan-50 opacity-60" />
                            <div className="relative p-4 flex flex-col gap-2">
                              <div className="flex items-center gap-3">
                                <span className={`flex items-center justify-center w-10 h-10 rounded-full text-white font-semibold shadow-md ${stopColor} ${stopShadow}`}>
                                  {index + 1}
                                </span>
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <span className="text-indigo-500"><ClockIcon /></span>
                                  <span className="font-semibold text-[#E84A27]">{item.time}</span>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <span className="text-gray-500 mt-1.5"><MapPinIcon /></span>
                                <div className="space-y-1">
                                  <p className="text-base font-semibold text-gray-900">{item.location}</p>
                                  <p className="text-sm text-gray-700">{item.activity}</p>
                                </div>
                              </div>
                              {travel !== null && (
                                <div className="mt-2 flex items-center gap-2 text-xs text-sky-700 font-medium bg-white/80 rounded-full px-3 py-1 w-fit border border-sky-100 shadow-xs">
                                  <span>Est. distance to next: ~{travel.km.toFixed(1)} km</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {index < path.schedule.length - 1 && (
                            <div className="flex items-center justify-center gap-3 text-sm text-orange-600">
                              <div className="w-px h-10 bg-gradient-to-b from-indigo-300 via-orange-300 to-pink-300" />
                              <div className="flex items-center gap-2 bg-white/70 px-3 py-1 rounded-full border border-orange-100 shadow-sm">
                                <span className="text-lg">↓</span>
                                {travel !== null && (
                                  <span className="font-medium text-gray-700">Est. distance ~{travel.km.toFixed(1)} km</span>
                                )}
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Action buttons */}
                {allowSelection && (
                  <div className="mt-5 flex gap-3">
                    <button
                      className={`flex-1 px-4 py-2.5 rounded-lg transition-colors shadow-sm noto-sans-uniquifier ${isSelected ? 'bg-gray-400 text-white cursor-default' : 'bg-orange-500 text-white hover:bg-orange-600'} ${savingId === path.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                      disabled={savingId === path.id || isSelected}
                      onClick={async () => {
                        if (savingId !== null || isSelected) return;
                        setSavingId(path.id);
                        await onSelectPlan?.(path);
                        setSavingId(null);
                        setSelectedId(path.id);
                      }}
                    >
                      {isSelected ? 'SELECTED' : savingId === path.id ? 'Saving...' : 'Select This Plan'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
