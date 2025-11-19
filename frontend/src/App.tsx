import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { saveHistory } from './api/histories';
import { Header } from './components/Header';
import { MainContent } from './components/MainContent';
import { LoginPage } from './components/LoginPage';
import { SearchHistoryPage } from './components/SearchHistoryPage';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

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
  title?: string;
  subtitle?: string;
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
  const { isAuthenticated, isLoading, getAccessTokenSilently, logout } = useAuth0();
  const navigate = useNavigate();
  const [pathOptions, setPathOptions] = useState<PathOption[]>([]);
  const [showRestore, setShowRestore] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
  const [currentUserRequest, setCurrentUserRequest] = useState<string>('');
  const [currentRequestedDate, setCurrentRequestedDate] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    // If we already stored a login flag, trust it
    if (window.localStorage.getItem('uipathfinder_logged_in') === 'true') {
      return true;
    }
    // If we just came back from Auth0, there will be a ?code=... param
    const params = new URLSearchParams(window.location.search);
    if (params.get('code')) {
      window.localStorage.setItem('uipathfinder_logged_in', 'true');
      return true;
    }
    return false;
  });
  const isAuthed = isAuthenticated || isLoggedIn;

  const handleLogin = () => {
    // Local login: mark as logged in and go to main page
    setIsLoggedIn(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('uipathfinder_logged_in', 'true');
    }
    navigate('/');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPathOptions([]);
    setShowRestore(false);
    setSearchHistory([]);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('uipathfinder_logged_in');
    }
    // Call Auth0 logout if available
    if (typeof window !== 'undefined') {
      logout({
        logoutParams: {
          returnTo: `${window.location.origin}/login`
        }
      });
    } else {
      navigate('/login');
    }
  };

  const handleGeneratePaths = (userRequest: string, date: string) => {
    setShowRestore(false);
    setCurrentUserRequest(userRequest);
    setCurrentRequestedDate(date);
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
    // Do NOT save yet — only save when the user selects one option.
  };

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSelectPlan = async (selected: PathOption) => {
    // Update UI to show the selected plan
    setPathOptions([selected]);
    // Build subtitle as arrow-joined places (every place in the selected schedule)
    const subtitle = (selected.schedule || []).map(item => item.location).join(' → ');
    // Build payload for backend: title is the user's prompt
    const payload = {
      title: `Selected option for ${currentRequestedDate}`,
      subtitle,
      userRequest: currentUserRequest || '',
      requestedDate: currentRequestedDate || '',
      metadata: {},
      // store only the selected option so history reflects the chosen plan
      pathOptions: [selected]
    };
    // Try saving to backend for authenticated users, also update local history immediately
    try {
      if (isAuthenticated && typeof getAccessTokenSilently === 'function') {
        const saved = await saveHistory(getAccessTokenSilently, payload);
        const entry: SearchHistoryEntry = {
          id: saved._id || saved.id || Date.now().toString(),
          timestamp: saved.createdAt ? new Date(saved.createdAt) : new Date(),
          userRequest: saved.userRequest || saved.user_request || payload.userRequest,
          date: saved.requestedDate || payload.requestedDate,
          pathOptions: (saved.pathOptions || saved.path_options || [selected]).map((p: any, idx: number) => ({ id: idx, title: p.title, schedule: p.schedule || [] })),
          title: saved.title || payload.title,
          subtitle: saved.subtitle || payload.subtitle
        };
        setSearchHistory(prev => [entry, ...prev]);
        setToast({ message: 'Saved!', type: 'success' });
        setTimeout(() => setToast(null), 2000);
      } else {
        // not authenticated — just add to local history
        const entry: SearchHistoryEntry = {
          id: Date.now().toString(),
          timestamp: new Date(),
          userRequest: payload.userRequest,
          date: payload.requestedDate,
          pathOptions: [selected],
          title: payload.title,
          subtitle: payload.subtitle
        };
        setSearchHistory(prev => [entry, ...prev]);
        setToast({ message: 'Saved locally!', type: 'success' });
        setTimeout(() => setToast(null), 2000);
      }
    } catch (err) {
      console.debug('saveHistory failed', err);
      // fallback: add local entry so user sees it
      const entry: SearchHistoryEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        userRequest: payload.userRequest,
        date: payload.requestedDate,
        pathOptions: [selected],
        title: payload.title,
        subtitle: payload.subtitle
      };
      setSearchHistory(prev => [entry, ...prev]);
      setToast({ message: 'Saved locally!', type: 'success' });
      setTimeout(() => setToast(null), 2000);
    }
  };

  const handleShowRestore = () => {
    setShowRestore(false);
    navigate('/history');
  };

  const handleBackFromHistory = () => {
    navigate('/');
  };

  const handleRestoreFromHistory = (entry: SearchHistoryEntry) => {
    setPathOptions(entry.pathOptions);
    setShowRestore(false);
    navigate('/');
  };

  const mainElement = isLoading ? (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-500">Loading...</div>
    </div>
  ) : !isAuthed ? (
    <LoginPage onLogin={handleLogin} />
  ) : (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg bg-orange-500 text-white font-bold noto-sans-uniquifier">
          {toast.message}
        </div>
      )}
      <Header onGeneratePaths={handleGeneratePaths} onShowRestore={handleShowRestore} onLogout={handleLogout} />
      <MainContent pathOptions={pathOptions} showRestore={showRestore} onSelectPlan={handleSelectPlan} />
    </div>
  );

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Navigate to="/" replace />
        }
      />
      <Route
        path="/history"
        element={
          !isAuthed ? (
            <Navigate to="/login" replace />
          ) : (
            <SearchHistoryPage
              onBack={handleBackFromHistory}
              searchHistory={searchHistory}
              onRestoreSearch={handleRestoreFromHistory}
            />
          )
        }
      />
      <Route path="/" element={mainElement} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
