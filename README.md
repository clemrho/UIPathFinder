# UIPathFinder – UIUC Smart Schedule & Path Planner

> "Big Brother is Watching You."  --- _1984_

UIPathFinder is a web app that helps UIUC students plan their day as a sequence of activities and locations on campus. It combines a React frontend, an API backend, and an LLM/RAG layer that will ground suggestions in real campus data.

The current version focuses on:
- A full user flow (Auth0 login → main planner → history).
- A deterministic “mock” schedule generator in the frontend.
- A first LLM integration against Fireworks.ai with a reusable prompt and output schema (`reason` + `pathResult`).

---

## Features

- **Authentication**
  - Login via email/password UI plus Auth0 social login.
  - Auth-protected routes (`/` main planner, `/history` search history).
  - Logout support and session persistence.

![login](md_img/login.png)


- **Main Planning Page (`/`)**
  - Prompt-based request: users describe the kind of day they want (classes, study, gym, etc.) and pick a date.
  - Generates multiple “path options” – each is a sequence of time-stamped activities at UIUC locations.
  - UI shows each option as a structured schedule (time, location, activity) with coordinates for each stop.

![main](md_img/search.png)
![main](md_img/mapinfo.png)

- **Search History Page (`/history`)**
  - View previously saved schedules.
  - Click an entry to restore it into the main view.
  - Persists either via MongoDB (for authenticated users) or local in-memory history (fallback).

![hist](md_img/history.png)

- **Backend Integration**
  - API endpoints to save and list history entries.
  - History items store the original user request, requested date, and the selected path option(s).
  - Prototype LLM endpoint (`/api/fireworks-test`) that calls a Llama-based model on Fireworks.ai and returns a structured schedule-like JSON.

---

## Tech Stack

- **Frontend**
  - React 18 + TypeScript
  - Vite
  - React Router
  - Auth0 SPA SDK (`@auth0/auth0-react`)
  - Tailwind-style utility classes and custom components

- **Backend**
  - Node.js / Express
  - MongoDB models for `user` and `history`
  - REST API consumed by the frontend via `src/api/histories.ts`
  - Fireworks.ai LLM integration (via the `openai` client) using a Llama-based model

- **LLM / Prompting**
  - Central prompt builder in `LLM/llmama.js`
  - Prototype LLM caller + JSON post-processing in `backend/index.js` (`callFireworksAPI`)
  Models Using (To be implemented): qwen3-32b, llama-v3p1-8b-instruct, FalconH1


---

## High-Level Architecture

- **Frontend App**
  - `src/main.tsx`: mounts the React app and wraps it in `Auth0Provider` and `BrowserRouter`.
  - `src/App.tsx`: top-level routing and state:
    - `/` → login page or main planner depending on auth state.
    - `/history` → search history (requires login).
    - Logout resets state and calls Auth0 logout.
  - `src/components/LoginPage.tsx`: login UI, Auth0 redirect buttons.
  - `src/components/Header.tsx`: top bar with app name, history button, logout button, and schedule prompt form.
  - `src/components/MainContent.tsx`: shows either the “start planning” empty state or the generated path options.
  - `src/components/SearchHistoryPage.tsx`: grouped-by-date history list with restore behavior.

- **Backend App**
  - `backend/index.js`: Express server and API wiring.
  - `backend/models/user.js`, `backend/models/history.js`: Mongoose models.
  - Exposes endpoints used by `frontend/src/api/histories.ts`:
    - Save a selected plan.
    - List histories.
    - Get a single history by ID.
  - Provides a prototype LLM test endpoint:
    - `GET /api/fireworks-test` → calls Fireworks.ai with a structured prompt and returns:
      ```json
      {
        "success": true,
        "status": "GOOD RESULT" | "NOT ENOUGH CONTEXT" | "NOT FINAL RESULT" | "FAILED",
        "reason": "short explanation (3–150 words)",
        "pathResult": [ /* schedule items or empty */ ]
      }
      ```

- **LLM Prompt Module**
  - `LLM/llmama.js`:
    - `buildFireworksPrompt(...)` builds the full system + context + planning-rules + JSON-schema prompt.
    - Designed so future backends (local Llama, Mamba, etc.) can reuse the same prompt.

---

## LLM Prototype: Fireworks.ai + Llama

This project includes an early LLM integration to experiment with schedule generation before the full RAG pipeline is wired up.

- **Prompt Contract**
  - Model is instructed to:
    - Create exactly one schedule (a “path”) for the given day.
    - Return a single JSON object with:
      - `reason`: 3–150 word explanation of how the schedule was built or why context is limited.
      - `pathResult`: array with at most one element, each containing a `title` and a `schedule` array of `{ time, location, activity, coordinates, notes }`.
    - Use one of three leading flags in raw text:
      - `GOOD RESULT` → schedule is acceptable.
      - `NOT FINAL RESULT` → model isn’t ready; backend will retry up to 3 times.
      - `NOT ENOUGH CONTEXT` → schedule may be incomplete, but is still treated as a “success” with an explanatory `reason`.

- **Backend Post-Processing**
  - Strips the leading flag, extracts the JSON block, and parses it.
  - Ensures:
    - `pathResult` exists; if more than one path is returned, only the first is kept.
    - A `reason` field is always present and truncated to ~150 words.
    - If no usable JSON is returned, the backend falls back to:
      ```json
      {
        "status": "FAILED" | "NOT ENOUGH CONTEXT",
        "data": {
          "reason": "model explanation / error text",
          "pathResult": []
        }
      }
      ```
  - The `/api/fireworks-test` route surfaces this as:
    ```json
    {
      "success": true,
      "status": "...",
      "reason": "...",
      "pathResult": [ ... ]
    }
    ```

- **Configuring Fireworks.ai Locally**
  - Set your API key and model in `backend/.env`:
    ```env
    FIREWORKS_API_KEY=sk-...
    ```
  - The backend uses:
    - `baseURL = https://api.fireworks.ai/inference/v1`
    - `model = "accounts/fireworks/models/llama-v3p1-8b-instruct"`
  - To test:
    - Start the backend: `cd backend && npm install && node index.js`
    - Call from a terminal or REST client:
      ```bash
      curl http://localhost:3001/api/fireworks-test
      ```
    - You should see JSON with `status`, `reason`, and `pathResult`.

---

## Planned Next Steps: RAG & Data-Aware Scheduling

The next phase is to make schedules grounded in real-world UIUC data using a Retrieval-Augmented Generation (RAG) pipeline.

Planned components:

1. **Knowledge Sources**
   - **MongoDB**: existing and future collections containing:
     - Course times and locations.
     - User-specific constraints / preferences.
   - **UIUC MTD API** (bus system):
     - Live/near-live bus times and routes.
     - Travel time between campus locations.
   - **Weather API**:
     - Current and forecasted weather to adjust outdoor vs. indoor paths, walking vs. bus, etc.
   - **UIUC Building Database**:
     - Canonical list of buildings, coordinates, and categories (academic, dining, recreation).
     - Possibly building opening hours and amenities.

2. **RAG Pipeline**
   - Given the user’s text request and target date:
     - Retrieve relevant facts from MongoDB and the building database.
     - Query MTD and weather APIs for time- and location-dependent information.
   - Construct a **grounded context** and feed it as part of the LLM prompt so the model reasons over real UIUC data, not just generic knowledge.

3. **Post-Processing & Output Tuning**
   - The model will return a candidate schedule; we will:
     - Normalize it into a strict internal schema:
       ```ts
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
       ```
     - Validate times, locations, and travel feasibility (e.g., ensure transit time is realistic).
     - Attach coordinates via the building database so the frontend can easily render maps or visualizations.
   - This post-tuned structure is exactly what the current frontend already expects, so the UI can remain largely unchanged while the backend logic becomes more intelligent.

4. **Better Personalization**
   - Use stored search histories and user preferences to:
     - Bias the model toward favorite buildings or study spots.
     - Avoid time conflicts with known commitments.
     - Suggest variety (not the same building every day).

---

## Running the Project (High Level)

> Adjust ports/commands if your local setup differs.

- **Frontend**
  - `cd UIPathFinder/frontend`
  - `npm install`
  - `npm run dev`
  - Open `http://localhost:3000` (or Vite’s default port).

- **Backend**
  - `cd UIPathFinder/backend`
  - `npm install`
  - Configure `.env` (MongoDB URI, Auth0 audience, etc.).
  - `node index.js` (or `npm start` if configured).

---

## Summary

UIPathFinder already supports login, schedule generation (deterministic mock paths), and history management with a clean UI. On the backend, a prototype LLM pipeline (via Fireworks.ai + Llama and a centralized prompt in `LLM/llmama.js`) is in place to experiment with JSON-based schedule generation and reliability flags. The next iterations will focus on wiring real RAG context (MongoDB data, UIUC MTD, weather, building DB) into that pipeline so the suggested paths are grounded in live campus information.***
