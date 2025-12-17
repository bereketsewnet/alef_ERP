# Employee Mini App — Code Generation Prompt

**Target Framework**: Vite + React + TypeScript (Mobile-First)
**Backend**: Laravel 12 API (Already Deployment)
**Styling**: Tailwind CSS v4 (Custom Color Tokens provided)
**Role**: Field Staff / Employee Portal

## Project Overview
Create a **mobile-first** web application ("Mini App") for employees to manage their field duties. The app will be served via HTTPS and likely embedded in a Telegram Web App or used as a standalone PWA. It must be offline-capable, highly accessible, and secure.

## Core Requirements

### 1. Technology Stack
*   **Build Tool**: Vite
*   **Framework**: React (v18+)
*   **Language**: TypeScript (Strict mode)
*   **Styling**: Tailwind CSS v4. Use the following color tokens to match the existing branding:
    *   Primary: `#0B3D91` (Deep Indigo)
    *   Accent: `#0FA3A3` (Teal)
    *   Warning: `#FFB020`
    *   Error: `#D92D20`
    *   Background: `#F8FAFC`
    *   Text: `#0F1724`
*   **State Management**: React Query (TanStack Query) for server state; Context API or Zustand for local session state.
*   **Routing**: React Router v6.
*   **Offline/Storage**: `localForage` (IndexedDB wrapper) for offline queue.
*   **PWA**: `vite-plugin-pwa` for manifest and service worker.
*   **Maps**: Leaflet (react-leaflet) for lightweight map previews.

### 2. Authentication & Security
*   **Login**: `POST /api/auth/login` (Body: `{ phone, password }`).
    *   Response: `{ access_token, refresh_token, user, expires_in }`.
*   **Session**:
    *   Store `access_token` in memory (or short-lived storage).
    *   Handle `401 Unauthorized` by calling `POST /api/auth/refresh`.
    *   Persist "Remember Me" state securely.
*   **Profile**: `GET /api/auth/me` to get current user details.
*   **Security**: Implement Axios interceptors to inject `Authorization: Bearer <token>` header.

### 3. Core Features & Flows

#### A. Home / Dashboard (Shift View)
*   **Endpoint**: `GET /api/roster/my-roster` (Fetch upcoming shifts).
*   **UI**:
    *   Show **Today's Shift** prominently (Site Name, Time, Role).
    *   **Big Action Button**: "CLOCK IN" or "CLOCK OUT" based on status.
    *   **Map Preview**: Show site location radius circle and user position.
    *   **Distance**: Calculate Haversine distance client-side.
    *   **Status Indicators**: Online/Offline, GPS Accuracy.

#### B. Attendance (Clock In/Out)
*   **Endpoints**: 
    *   `POST /api/attendance/clock-in`
    *   `POST /api/attendance/clock-out`
*   **Payload**: `{ schedule_id, latitude, longitude, accuracy, selfie? (multipart) }`.
*   **Logic**:
    *   **Online**: Validate GPS radius server-side. If successful, show success modal. If outside radius, display error "Too far from site".
    *   **Offline**: If network fails, **QUEUE** the request in IndexedDB (`queued_attendance` table). Show "Pending Sync" status in UI.
    *   **Sync**: Auto-retry queued items when connection restores (background sync or manual trigger).

#### C. Roster & Schedule
*   **Endpoint**: `GET /api/roster/my-roster`.
*   **View**:
    *   List view of upcoming 7 days.
    *   Detail view: Site address, instructions, map link.

#### D. Incident Reporting
*   **Endpoint**: `POST /api/incidents`.
*   **UI**: Form with Type (Dropdown), Description (Textarea), and Photo Upload (`capture="environment"`).
*   **Offline**: Queue request if offline.

#### E. Panic Button
*   **Endpoint**: `POST /api/incidents/panic`.
*   **UI**: Floating Action Button (FAB) or accessible header button (Red).
*   **Action**: One-tap triggers immediate emergency alert with current GPS.

#### F. Payroll & Assets (Read-Only)
*   **Payroll**: List pay periods (Mock or use `GET /api/payroll/periods` filtered by user if available, otherwise just UI skeleton for now).
*   **Assets**: List assigned assets (Use `GET /api/assets` or `GET /api/auth/me` if assets included in user resource).

### 4. Implementation Details
*   **Offline First**: Crucial requirement. The app must load the "Shell" and cached roster even without internet.
*   **Validation**: Use `zod` schema validation for all forms.
*   **I18n**: Setup `i18next` with English (default) and Amharic support.
*   **Testing**: Basic Unit Tests for utility functions (Distance calc, Queue logic).

## Directory Structure
```
/src
  /api        # Axios setup, endpoints
  /assets     # Static files
  /components # Reusable UI (Buttons, Cards, Inputs)
  /contexts   # AuthContext, ThemeContext
  /hooks      # Custom hooks (useGPS, useQueue)
  /layouts    # Main layout (Bottom Nav, Header)
  /pages      # Dashboard, Roster, Profile, Incidents
  /types      # TypeScript interfaces (User, Shift, Log)
  /utils      # Helpers (haversine, date formatting)
  App.tsx
  main.tsx
```

## Deliverables
Generate the complete codebase including `package.json`, `vite.config.ts`, `tailwind.config.js`, and all source files. ensure standard linting rules are applied.
