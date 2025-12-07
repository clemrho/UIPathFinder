const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export interface LlmScheduleItem {
  time: string;
  location: string;
  activity: string;
  coordinates: { lat: number; lng: number };
  notes?: string;
}

export interface LlmPathOption {
  id: number;
  title: string;
  schedule: LlmScheduleItem[];
  modelId: string;
  modelName: string;
  status: string;
  reason: string;
   isFallback?: boolean;
}

export interface LlmSchedulesResponse {
  success: boolean;
  options: LlmPathOption[];
}

export async function generateSchedulesWithLlm(
  userRequest: string,
  date: string,
  homeAddress: string,
  sleepAtLibrary: boolean,
  mealPreference: string
): Promise<LlmSchedulesResponse> {
  const res = await fetch(`${API_BASE}/llm-schedules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userRequest, date, homeAddress, sleepAtLibrary, mealPreference })
  });

  if (!res.ok) {
    throw new Error(`LLM generation failed: ${res.status}`);
  }

  return res.json();
}
