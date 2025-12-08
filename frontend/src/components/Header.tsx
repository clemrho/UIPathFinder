import React, { useState } from 'react';
import { Toast } from './Toast';

interface HeaderProps {
  onGeneratePaths: (userRequest: string, date: string, homeAddress: string, sleepAtLibrary: boolean, mealPreference: string) => void | Promise<void>;
  onShowRestore: () => void;
  onShowFavorites: () => void;
  onLogout: () => void;
  homeAddress: string;
  onHomeAddressChange: (value: string) => void;
  sleepAtLibrary: boolean;
  onSleepAtLibraryChange: (value: boolean) => void;
  mealPreference: string;
  onMealPreferenceChange: (value: string) => void;
}

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const HistoryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3v5h5M3.05 13A9 9 0 1 0 6 5.3L3 8" />
    <path d="M12 7v5l4 2" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 17l5-5-5-5" />
    <path d="M15 12H3" />
    <path d="M19 4v16" />
  </svg>
);

const FavoriteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 21s-6-4.5-6-10a6 6 0 1 1 12 0c0 5.5-6 10-6 10z" />
    <path d="M12 9l1.3 2 2.2.3-1.6 1.5.4 2.2L12 14.5 9.7 15l.4-2.2-1.6-1.5 2.2-.3z" />
  </svg>
);

const WeatherIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 16.5A4.5 4.5 0 0 1 7.5 12h9a4.5 4.5 0 1 1 0 9h-9A4.5 4.5 0 0 1 3 16.5Z" />
    <path d="M9 12a5 5 0 1 1 8-6" />
  </svg>
);

export function Header({
  onGeneratePaths,
  onShowRestore,
  onShowFavorites,
  onLogout,
  homeAddress,
  onHomeAddressChange,
  sleepAtLibrary,
  onSleepAtLibraryChange,
  mealPreference,
  onMealPreferenceChange,
}: HeaderProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showWeather, setShowWeather] = useState(false);
  const [weatherText, setWeatherText] = useState('Loading weather...');
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [tempUnit, setTempUnit] = useState<'F' | 'C'>('F');
  const [currentConditions, setCurrentConditions] = useState<{
    temp: number | null;
    shortForecast: string;
    windSpeed: string;
    humidity: number | null;
    icon?: string;
  } | null>(null);
  const [forecastPeriods, setForecastPeriods] = useState<any[]>([]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) {
      showToast('Please enter your requirements', 'error');
      return;
    }

    if (!selectedDate) {
      showToast('Please select a date', 'error');
      return;
    }

    await onGeneratePaths(inputMessage, selectedDate, homeAddress, sleepAtLibrary, mealPreference);
    showToast('Generating schedule suggestions...', 'success');
  };

  const handleWeatherClick = async () => {
    setShowWeather(true);
    setWeatherLoading(true);
    setWeatherError(null);
    setWeatherText('Loading weather...');
    const today = selectedDate || new Date().toISOString().slice(0, 10);
    try {
      const pointResp = await fetch(`https://api.weather.gov/points/40.1163,-88.2435`);
      if (!pointResp.ok) throw new Error(`points status ${pointResp.status}`);
      const pointData = await pointResp.json();
      const forecastUrl = pointData?.properties?.forecast;
      if (!forecastUrl) throw new Error('No forecast URL');
      const forecastResp = await fetch(forecastUrl);
      if (!forecastResp.ok) throw new Error(`forecast status ${forecastResp.status}`);
      const forecastData = await forecastResp.json();
      const periods = forecastData?.properties?.periods || [];
      setForecastPeriods(periods.slice(0, 8));

      const now = periods?.[0];
      setCurrentConditions({
        temp: now?.temperature ?? null,
        shortForecast: now?.shortForecast || 'N/A',
        windSpeed: now?.windSpeed || 'N/A',
        humidity: now?.relativeHumidity?.value ?? null,
        icon: now?.icon,
      });
      setWeatherText(`Date ${today}: ${now?.shortForecast || 'N/A'} with temp ${now?.temperature ?? '?'}°${now?.temperatureUnit || 'F'}`);
    } catch (err: any) {
      setWeatherError('Weather unavailable; please check later or open the full forecast.');
    }
    setWeatherLoading(false);
  };

  const convertTemp = (value: number | null) => {
    if (value == null) return '--';
    return tempUnit === 'F' ? `${value}°F` : `${Math.round(((value - 32) * 5) / 9)}°C`;
  };

  return (
    <header className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white shadow-lg">
      {toast && <Toast message={toast.message} type={toast.type} />}
      {showWeather && (
        <div className="fixed inset-0 z-[1200] bg-black/50 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[420px] text-slate-800 relative z-[1201]">
            <button
              className="absolute top-2 right-2 text-slate-500 hover:text-slate-700"
              onClick={() => setShowWeather(false)}
            >
              ✕
            </button>
            <div className="flex items-center gap-2 mb-3">
              <WeatherIcon />
              <h3 className="text-lg font-semibold">Champaign / KCMI Weather</h3>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-slate-600">Temperature unit:</span>
              <button
                type="button"
                onClick={() => setTempUnit('F')}
                className={`px-2 py-1 rounded border text-xs ${tempUnit === 'F' ? 'bg-slate-800 text-white border-slate-700' : 'bg-white border-slate-300 text-slate-700'}`}
              >
                °F
              </button>
              <button
                type="button"
                onClick={() => setTempUnit('C')}
                className={`px-2 py-1 rounded border text-xs ${tempUnit === 'C' ? 'bg-slate-800 text-white border-slate-700' : 'bg-white border-slate-300 text-slate-700'}`}
              >
                °C
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 flex gap-3 items-center">
                <div className="w-16 h-16 rounded-md bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                  {currentConditions?.icon ? (
                    <img src={currentConditions.icon} alt="icon" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🌥️</span>
                  )}
                </div>
                <div>
                  <div className="text-3xl font-semibold text-slate-800">
                    {convertTemp(currentConditions?.temp ?? null)}
                  </div>
                  <div className="text-sm text-slate-600">{currentConditions?.shortForecast || weatherText}</div>
                  <div className="text-xs text-slate-500">
                    Wind: {currentConditions?.windSpeed || 'N/A'} · Humidity: {currentConditions?.humidity ?? 'N/A'}%
                  </div>
                </div>
              </div>

              {weatherLoading && <p className="text-sm text-slate-600">Loading weather...</p>}
              {weatherError && <p className="text-sm text-red-600">{weatherError}</p>}

              {!weatherLoading && !weatherError && forecastPeriods.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Extended forecast</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {forecastPeriods.map((p) => (
                      <div key={p.number} className="rounded-lg border border-slate-200 p-2 bg-white/80">
                        <div className="text-xs font-semibold text-slate-700">{p.name}</div>
                        <div className="text-xs text-slate-500 mb-1">{p.shortForecast}</div>
                        <div className="text-sm font-semibold text-orange-600">{convertTemp(p.temperature)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  window.open('https://forecast.weather.gov/MapClick.php?lat=40.116328&lon=-88.243522', '_blank')
                }
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors"
              >
                Open full forecast
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-6 py-4">
        {/* Top row - Logo and title */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl">UIPathFinder</h1>
              <p className="text-xs text-slate-300">UIUC Smart Schedule Planner</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleWeatherClick}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#13294B] to-sky-500 hover:from-[#0f2140] hover:to-sky-400 rounded-lg transition-colors border border-sky-400 shadow-sm"
            >
              <WeatherIcon />
              <span className="text-sm font-medium">Weather</span>
            </button>
            <button
              type="button"
              onClick={() => window.open('https://mtd.org', '_blank')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 via-pink-500 to-orange-500 hover:from-sky-400 hover:via-pink-400 hover:to-orange-400 rounded-lg transition-colors border border-pink-200 shadow-sm"
            >
              <span className="text-sm font-medium">Bus Route</span>
            </button>
            <button
              type="button"
              onClick={onShowFavorites}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#d14d2a] via-[#E84A27] to-amber-400 hover:from-[#c03f1f] hover:via-[#f0612f] hover:to-amber-300 rounded-lg transition-colors border border-orange-300 shadow-sm"
            >
              <FavoriteIcon />
              <span className="text-sm font-medium">My Favorite Place</span>
            </button>
            <button
              onClick={onShowRestore}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-[#13294B] hover:from-amber-400 hover:to-[#0f2140] rounded-lg transition-colors border border-slate-600 shadow-sm"
            >
              <HistoryIcon />
              <span className="text-sm">History</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/70 hover:bg-slate-700 rounded-lg transition-colors border border-slate-500 text-sm"
            >
              <LogoutIcon />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Bottom row - Input form */}
        <form onSubmit={handleSubmit} className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] max-w-[360px]">
            <label className="block text-xs text-slate-300 mb-1.5">
              💬 Describe Your Schedule Needs
            </label>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="e.g., study + gym + clubs..."
              className="w-full h-10 rounded-lg border border-slate-500 bg-slate-700/50 px-4 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div className="w-56">
            <label className="block text-xs text-slate-300 mb-1.5">
              🏠 Home Address
            </label>
            <input
              type="text"
              value={homeAddress}
              onChange={(e) => onHomeAddressChange(e.target.value)}
              placeholder="e.g., 123 E Green St, Champaign"
              className="w-full h-10 rounded-lg border border-slate-500 bg-slate-700/50 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div className="w-40">
            <label className="block text-xs text-slate-300 mb-1.5">
              📅 Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-500 bg-slate-700/50 px-3 py-2 text-sm text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div className="w-48">
            <label className="block text-xs text-slate-300 mb-1.5">🍽️ Meal Preference</label>
            <select
              value={mealPreference}
              onChange={(e) => onMealPreferenceChange(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-500 bg-slate-700/50 px-3 py-2 text-sm text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            >
              {[
                'Any',
                'Northern Chinese Cuisine',
                'Shanghaiese / Cantonese / Sichuanese Cuisine',
                'Chinese food (Other)',
                'Japanese',
                'Korean',
                'Indian',
                'Thai',
                'Asian food (Other)',
                'American',
                'Mexican',
                'Italian',
                'Mediterranean',
                'Vegan/Vegetarian',
              ].map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-200 mb-2 order-last lg:order-none">
            <input
              type="checkbox"
              checked={sleepAtLibrary}
              onChange={(e) => onSleepAtLibraryChange(e.target.checked)}
              className="h-4 w-4 rounded border-slate-400 bg-slate-700"
            />
            allows sleep at Grainger
          </label>

          <button
            type="submit"
            className="h-10 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors inline-flex items-center justify-center gap-2 shadow-md"
          >
            <SendIcon />
            <span>Generate Paths</span>
          </button>
        </form>
      </div>
    </header>
  );
}
