# ALEF DELTA ERP - Startup Scripts

## Quick Start

### Start Both Backend & Frontend
Double-click `start.bat` or run:
```bash
.\start.bat
```

This will:
1. Start Laravel backend at `http://localhost:8000`
2. Start Vite frontend at `http://localhost:5173`

Both servers will open in separate terminal windows.

### Stop All Services
Double-click `stop.bat` or run:
```bash
.\stop.bat
```

This will stop all PHP and Node.js processes.

## Manual Start

### Backend Only
```bash
cd backend
php artisan serve
```

### Frontend Only
```bash
cd staff
npm run dev
```

## Ports
- **Backend API:** http://localhost:8000
- **Frontend App:** http://localhost:5173
