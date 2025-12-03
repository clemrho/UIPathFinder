import React, { useState } from 'react';
import { RouteMap } from './RouteMap';

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

interface MainContentProps {
  pathOptions: PathOption[];
  showRestore: boolean;
}

const CalendarIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8 2v4M16 2v4M3 10h18" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const MapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h5l7 7-1.5 1.5c-.7.7-1.5.5-2.5-.5L3 6Z" />
    <path d="m8 8 9 9" />
    <path d="M15 5h6v6" />
    <path d="m21 5-9 9" />
  </svg>
);

const RouteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="6" cy="19" r="3" />
    <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
    <circle cx="18" cy="5" r="3" />
  </svg>
);

export function MainContent({ pathOptions, showRestore }: MainContentProps) {
  const [selectedPathId, setSelectedPathId] = useState<number | null>(null);

  // Select first path by default when paths are generated
  React.useEffect(() => {
    if (pathOptions.length > 0 && selectedPathId === null) {
      setSelectedPathId(pathOptions[0].id);
    }
  }, [pathOptions, selectedPathId]);

  const selectedPath = pathOptions.find(p => p.id === selectedPathId);

  if (pathOptions.length === 0) {
    return (
      <div className="flex flex-col h-full">
        {/* Map area */}
        <div className="flex-[7] bg-gray-100 border-b border-gray-200 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-300 mx-auto mb-3 flex justify-center">
              <MapIcon />
            </div>
            <p className="text-sm text-gray-500">Map will appear here</p>
          </div>
        </div>

        {/* Route details area */}
        <div className="flex-[3] bg-white flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-gray-300 mx-auto mb-4 flex justify-center">
              <CalendarIcon />
            </div>
            <h3 className="text-gray-700 mb-2">Start Planning Your Day</h3>
            <p className="text-sm text-gray-500 max-w-md">
              Chat with the AI assistant on the left to describe your schedule needs and date, then I'll generate personalized path suggestions with maps and routes
            </p>
          </div>
        </div>
      </div>
    );
  }

  const locations = selectedPath ? selectedPath.schedule.map(item => ({
    name: item.location,
    lat: item.coordinates.lat,
    lng: item.coordinates.lng
  })) : [];

  return (
    <div className="flex flex-col h-full">
      {/* Map area */}
      <div className="flex-[7] bg-white border-b border-gray-200 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-slate-100 to-gray-100 flex-shrink-0">
            <h3 className="text-sm text-gray-700 flex items-center gap-2">
              <MapIcon />
              <span>Campus Route Map</span>
            </h3>
          </div>
          <div className="flex-1 overflow-hidden">
            {selectedPath && (
              <RouteMap locations={locations} pathId={selectedPath.id} />
            )}
          </div>
        </div>
      </div>

      {/* Route details area */}
      <div className="flex-[3] bg-white overflow-y-auto">
        <div className="h-full flex flex-col">
          <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-slate-100 to-gray-100">
            <h3 className="text-sm text-gray-700 flex items-center gap-2">
              <RouteIcon />
              <span>Route Details & Options</span>
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {/* Path selector tabs */}
            <div className="flex gap-2 mb-4">
              {pathOptions.map((path) => (
                <button
                  key={path.id}
                  onClick={() => setSelectedPathId(path.id)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedPathId === path.id
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Option {path.id}
                </button>
              ))}
            </div>

            {selectedPath && (
              <div>
                {/* Path title */}
                <div className="mb-4">
                  <h4 className="text-gray-800 mb-1">{selectedPath.title}</h4>
                  <p className="text-sm text-gray-600">
                    {selectedPath.schedule.length} stops • 
                    {selectedPath.schedule[0]?.time} - {selectedPath.schedule[selectedPath.schedule.length - 1]?.time}
                  </p>
                </div>

                {/* Schedule items */}
                <div className="space-y-2">
                  {selectedPath.schedule.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 text-white text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <ClockIcon />
                          <span className="text-sm">{item.time}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPinIcon />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-600">{item.location}</p>
                            <p className="text-sm mt-0.5">{item.activity}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm text-sm">
                    Select This Plan
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    Modify
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}