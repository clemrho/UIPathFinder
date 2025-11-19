import { useState } from 'react';
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

  const togglePath = (pathId: number) => {
    setExpandedPaths(prev => ({
      ...prev,
      [pathId]: !prev[pathId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-2xl text-gray-800 mb-2">🗺️ Schedule Path Suggestions</h3>
        <p className="text-sm text-gray-600">Generated {pathOptions.length} path options with UIUC campus route maps and real-time traffic conditions</p>
      </div>

      {pathOptions.map((path) => {
        const isExpanded = expandedPaths[path.id] ?? true;
        const locations: Location[] = path.schedule.map(item => ({
          name: item.location,
          lat: item.coordinates.lat,
          lng: item.coordinates.lng
        }));

        const isSelected = selectedId === path.id;

        return (
          <div key={path.id} className="rounded-xl border border-gray-200 bg-white shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div 
              className="p-5 bg-gradient-to-r from-slate-50 to-gray-50 cursor-pointer hover:from-slate-100 hover:to-gray-100 transition-colors border-b border-gray-200"
              onClick={() => togglePath(path.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className={`text-lg text-gray-800 noto-sans-uniquifier font-bold`}>
                    {isSelected
                      ? `Selected Path: ${path.title.replace(/^Path Option \d+:\s*/, '')}`
                      : path.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {path.schedule.length} stops • 
                    {path.schedule[0]?.time} - {path.schedule[path.schedule.length - 1]?.time}
                  </p>
                </div>
                <button className="text-gray-600 hover:text-gray-700 transition-colors">
                  {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="p-5">
                {/* 路线地图 */}
                <RouteMap locations={locations} pathId={path.id} />

                {/* 详细时间表 */}
                <div className="mt-6">
                  <h4 className="text-sm text-gray-600 mb-3">详细时间安排</h4>
                  <div className="space-y-2">
                    {path.schedule.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <span className="text-sky-500"><ClockIcon /></span>
                          <span className="text-sm">{item.time}</span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start gap-2">
                            <span className="text-gray-400 mt-0.5"><MapPinIcon /></span>
                            <div>
                              <p className="text-sm text-gray-600">{item.location}</p>
                              <p className="text-sm mt-0.5">{item.activity}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
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
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
