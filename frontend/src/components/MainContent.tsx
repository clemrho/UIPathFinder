// no React hooks needed here
import { EnhancedPathSuggestions } from './EnhancedPathSuggestions';
import { RecommendedSpots } from './RecommendedSpots';

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
  userRequest?: string;
  isGenerating?: boolean;
  onSelectPlan?: (selected: PathOption) => void | Promise<void>;
}

const CalendarIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8 2v4M16 2v4M3 10h18" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
  </svg>
);

export function MainContent({ pathOptions, showRestore, onSelectPlan, isGenerating }: MainContentProps) {
  if (showRestore) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
          <h2 className="text-2xl mb-2 text-gray-800">History</h2>
          <p className="text-gray-500 mb-6">View and restore previous schedules</p>
          <div className="p-12 bg-gray-50 rounded-lg text-center">
            <div className="text-gray-300 mx-auto mb-4 flex justify-center">
              <CalendarIcon />
            </div>
            <p className="text-gray-400">No history records yet</p>
          </div>
        </div>
      </div>
    );
  }

  if (isGenerating && pathOptions.length === 0) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200 flex flex-col gap-6 items-center">
          <div className="w-16 h-16 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
          <div>
            <h3 className="text-xl text-gray-800 font-semibold">Generating paths…</h3>
            <p className="text-gray-600 text-sm">Gathering buildings, history, weather, and restaurant options.</p>
          </div>
          <RecommendedSpots />
        </div>
      </div>
    );
  }

  if (pathOptions.length === 0) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
          <div className="text-gray-300 mx-auto mb-4 flex justify-center">
            <CalendarIcon />
          </div>
          <h3 className="text-xl text-gray-700 mb-2">Start Planning Your Day</h3>
          <p className="text-gray-500">
            Enter your schedule requirements and date above, and AI will generate personalized path suggestions for you
          </p>
          <RecommendedSpots />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 relative">
      {isGenerating && pathOptions.length > 0 && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl border border-orange-200">
          <div className="w-14 h-14 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-700">Updating paths…</p>
        </div>
      )}
      <EnhancedPathSuggestions pathOptions={pathOptions} onSelectPlan={onSelectPlan} />
    </div>
  );
}
