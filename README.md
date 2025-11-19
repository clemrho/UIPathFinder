# UIPathFinder – UIUC Smart Schedule & Path Planner

> "Big Brother is Watching You."  --- _1984_

UIPathFinder is a web app that helps UIUC students plan their day as a sequence of activities and locations on campus. It combines a clean React frontend, an API backend, and (in the next stage) a RAG-based LLM pipeline that grounds suggestions in real campus data.

The current version focuses on the full user flow (login → plan generation → saving history) and establishes the data models and UI needed for more advanced AI features.

---

## Features

- **Authentication**
  - Login via email/password UI plus Auth0 social login.
  - Auth-protected routes (`/` main planner, `/history` search history).
  - Logout support and session persistence.

- **Main Planning Page (`/`)**
  - Prompt-based request: users describe the kind of day they want (classes, study, gym, etc.) and pick a date.
  - Generates multiple “path options” – each is a sequence of time-stamped activities at UIUC locations.
  - UI shows each option as a structured schedule (time, location, activity) with coordinates for each stop.

- **Search History Page (`/history`)**
  - View previously saved schedules.
  - Click an entry to restore it into the main view.
  - Persists either via MongoDB (for authenticated users) or local in-memory history (fallback).

- **Backend Integration**
  - API endpoints to save and list history entries.
  - History items store the original user request, requested date, and the selected path option(s).

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

UIPathFinder already supports login, schedule generation, and history management with a clean UI. The next iteration will focus on RAG-based, data-grounded path planning that uses real UIUC transit, weather, and building data, plus robust post-processing to deliver high-quality, structured schedules to the frontend.
s
