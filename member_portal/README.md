# Alef Member Portal

Mobile-first employee portal for field staff to manage attendance, view schedules, and report incidents.

## Tech Stack

- **Framework**: Vite + React + TypeScript
- **Styling**: Tailwind CSS
- **State**: React Query + Context API
- **Offline**: LocalForage (IndexedDB)
- **Maps**: Leaflet

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd member_portal
npm install
```

### Development

```bash
npm run dev
```

The app will run at `http://localhost:7070`

### Backend API

The app expects the Laravel backend to be running at `http://localhost:8000`. 
The Vite dev server proxies `/api` requests to the backend.

## Features

- ✅ Phone/password authentication with JWT
- ✅ View today's shift and upcoming schedule
- ✅ Clock in/out with GPS verification
- ✅ Optional selfie capture
- ✅ Offline queue for clock-in when no network
- ✅ Attendance history
- ✅ Panic/SOS button
- ✅ Bilingual: English + Amharic

## Folder Structure

```
src/
├── api/          # Axios instance and API endpoints
├── components/   # Reusable UI components
├── contexts/     # React contexts (Auth)
├── hooks/        # Custom hooks (GPS, Queue, Roster)
├── layouts/      # Page layouts
├── lib/          # Utilities and i18n
├── locales/      # Translation files
├── pages/        # Page components
├── types/        # TypeScript types
└── utils/        # Helper functions
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Alef Member Portal
```
