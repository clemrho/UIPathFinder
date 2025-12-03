import React, { useState } from 'react';
import { MapPin, ArrowLeft } from 'lucide-react';

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

interface SearchHistoryEntry {
  id: string;
  timestamp: Date;
  userRequest: string;
  date: string;
  pathOptions: PathOption[];
}

interface SearchHistoryPageProps {
  onBack: () => void;
  searchHistory: SearchHistoryEntry[];
  onRestoreSearch: (entry: SearchHistoryEntry) => void;
}

export function SearchHistoryPage({ onBack, searchHistory, onRestoreSearch }: SearchHistoryPageProps) {
  // Group entries by date
  const groupedByDate = searchHistory.reduce((acc, entry) => {
    const dateKey = entry.timestamp.toISOString().split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, SearchHistoryEntry[]>);

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const formattedDate = date.toLocaleDateString('en-US', options);

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return `Today - ${formattedDate}`;
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return `Yesterday - ${formattedDate}`;
    } else {
      return formattedDate;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getFirstTwoLocations = (entry: SearchHistoryEntry): string[] => {
    // Get the first two unique locations from the first path option
    if (entry.pathOptions.length === 0 || entry.pathOptions[0].schedule.length === 0) {
      return [];
    }
    
    const locations: string[] = [];
    const seenLocations = new Set<string>();
    
    for (const item of entry.pathOptions[0].schedule) {
      if (!seenLocations.has(item.location)) {
        seenLocations.add(item.location);
        locations.push(item.location);
        
        if (locations.length === 2) {
          break;
        }
      }
    }
    
    return locations;
  };

  return (
    <div 
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 50%, #8b5a5a 100%)'
      }}
    >
      {/* Header with back button */}
      <div className="bg-[#1e3a5f] text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-slate-600/50 hover:bg-slate-600 rounded-lg transition-colors border border-slate-500 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Schedule</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 3v5h5M3.05 13A9 9 0 1 0 6 5.3L3 8" />
                <path d="M12 7v5l4 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl">Search History</h1>
              <p className="text-xs text-slate-300">View your past schedule searches</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl mx-auto">
          {/* Content */}
          <div className="p-6">
            <div className="space-y-8">
              {searchHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No search history yet</p>
                  <p className="text-sm mt-2">Generate some schedules to see them here</p>
                </div>
              ) : (
                Object.entries(groupedByDate)
                  .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                  .map(([date, entries]) => (
                    <div key={date}>
                      <h2 className="text-gray-900 mb-4">
                        {formatDateHeader(date)}
                      </h2>
                      <div className="space-y-2">
                        {entries.map((entry) => {
                          const firstTwoLocations = getFirstTwoLocations(entry);
                          return (
                            <div
                              key={entry.id}
                              className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => onRestoreSearch(entry)}
                            >
                              <div className="text-gray-700 min-w-[80px] pt-1">
                                {formatTime(entry.timestamp)}
                              </div>
                              <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                              <div className="flex-1">
                                <div className="text-gray-900 leading-relaxed">
                                  {firstTwoLocations.length > 0 && (
                                    <>
                                      {firstTwoLocations[0]}
                                      {firstTwoLocations.length > 1 && (
                                        <>
                                          {' → '}
                                          {firstTwoLocations[1]}
                                        </>
                                      )}
                                    </>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {entry.userRequest}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}