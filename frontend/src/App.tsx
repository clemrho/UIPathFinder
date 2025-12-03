import React, { useState } from 'react';
import { Header } from './components/Header';
import { MainContent } from './components/MainContent';
import { ChatBot } from './components/ChatBot';
import { LoginPage } from './components/LoginPage';
import { SearchHistoryPage } from './components/SearchHistoryPage';

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

// UIUC 校园真实地点坐标
const UIUC_LOCATIONS = [
  { name: 'Illini Union', lat: 40.1093, lng: -88.2272 },
  { name: 'Grainger Library', lat: 40.1125, lng: -88.2267 },
  { name: 'Siebel Center', lat: 40.1138, lng: -88.2249 },
  { name: 'Main Quad', lat: 40.1073, lng: -88.2284 },
  { name: 'CRCE (Gym)', lat: 40.1014, lng: -88.2362 },
  { name: 'Memorial Stadium', lat: 40.0993, lng: -88.2359 },
  { name: 'Altgeld Hall', lat: 40.1095, lng: -88.2281 },
  { name: 'Foellinger Hall', lat: 40.1058, lng: -88.2272 },
  { name: 'Krannert Center', lat: 40.1080, lng: -88.2236 },
  { name: 'ISR Dining', lat: 40.1056, lng: -88.2187 },
  { name: 'ECE Building', lat: 40.1149, lng: -88.2280 },
  { name: 'Campus Rec Center', lat: 40.1015, lng: -88.2355 }
];

function generateRandomLocations(count: number) {
  const shuffled = [...UIUC_LOCATIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export default function App() {
  const [pathOptions, setPathOptions] = useState<PathOption[]>([]);
  const [showRestore, setShowRestore] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleGeneratePaths = (userRequest: string, date: string) => {
    setShowRestore(false);
    
    // Generate 3 path options
    const paths: PathOption[] = [
      {
        id: 1,
        title: 'Path Option 1: Productive Study Day',
        schedule: (() => {
          const locs = generateRandomLocations(6);
          const activities = [
            'Breakfast & Review',
            'Class - Data Structures',
            'Group Study Session',
            'Lunch Break',
            'Library Study',
            'Gym Workout'
          ];
          const times = ['08:00', '09:30', '11:00', '13:00', '14:30', '17:00'];
          return locs.map((loc, i) => ({
            time: times[i],
            location: loc.name,
            activity: activities[i],
            coordinates: { lat: loc.lat, lng: loc.lng }
          }));
        })()
      },
      {
        id: 2,
        title: 'Path Option 2: Balanced Schedule',
        schedule: (() => {
          const locs = generateRandomLocations(6);
          const activities = [
            'Breakfast',
            'Lab Session',
            'Office Hours',
            'Lunch & Rest',
            'Project Team Meeting',
            'Dinner & Social'
          ];
          const times = ['08:30', '10:00', '12:00', '13:30', '15:30', '18:00'];
          return locs.map((loc, i) => ({
            time: times[i],
            location: loc.name,
            activity: activities[i],
            coordinates: { lat: loc.lat, lng: loc.lng }
          }));
        })()
      },
      {
        id: 3,
        title: 'Path Option 3: Flexible Arrangement',
        schedule: (() => {
          const locs = generateRandomLocations(6);
          const activities = [
            'Online Class',
            'Coffee & Reading',
            'Career Fair',
            'Lunch',
            'Lab Work',
            'Student Org Activity'
          ];
          const times = ['09:00', '11:00', '13:00', '14:00', '15:30', '19:00'];
          return locs.map((loc, i) => ({
            time: times[i],
            location: loc.name,
            activity: activities[i],
            coordinates: { lat: loc.lat, lng: loc.lng }
          }));
        })()
      }
    ];

    setPathOptions(paths);
    
    // Add to search history
    const historyEntry: SearchHistoryEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      userRequest,
      date,
      pathOptions: paths
    };
    
    setSearchHistory(prev => [historyEntry, ...prev]);
  };

  const handleShowRestore = () => {
    setShowRestore(!showRestore);
    setShowHistory(true);
  };

  const handleBackFromHistory = () => {
    setShowHistory(false);
  };

  const handleRestoreFromHistory = (entry: SearchHistoryEntry) => {
    setPathOptions(entry.pathOptions);
    setShowHistory(false);
    setShowRestore(false);
  };

  // Show login page if not logged in
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Show history page if requested
  if (showHistory) {
    return <SearchHistoryPage 
      onBack={handleBackFromHistory} 
      searchHistory={searchHistory}
      onRestoreSearch={handleRestoreFromHistory}
    />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header onShowRestore={handleShowRestore} />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - ChatBot */}
        <div className="w-96 flex-shrink-0">
          <ChatBot onGeneratePaths={handleGeneratePaths} />
        </div>
        
        {/* Right content area - Map and Route details */}
        <div className="flex-1 overflow-hidden">
          <MainContent 
            pathOptions={pathOptions}
            showRestore={showRestore}
          />
        </div>
      </div>
    </div>
  );
}