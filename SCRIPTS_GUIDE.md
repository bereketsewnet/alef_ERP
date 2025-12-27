# Docker Scripts Guide

## Available Scripts

### 🚀 Start Scripts

#### `start_app.bat` - First Time / Fresh Start
- Starts all services
- Builds containers if needed
- Runs migrations
- Seeds database with all data
- **Use this**: First time setup or when you want fresh data

#### `restart_app.bat` - Quick Restart (No Data Loss)
- Restarts all services
- **Preserves all data** (database, storage)
- **Use this**: When services are running but need restart

### 🔨 Rebuild Scripts

#### `rebuild_app.bat` - Rebuild Everything
- Rebuilds all services (backend, staff, member_portal)
- Applies code changes
- Runs migrations
- **Preserves data**
- **Use this**: After making code changes to any service

#### `rebuild_and_seed.bat` - Rebuild + Seed
- Rebuilds all services
- Runs migrations
- Seeds database with all data
- **Preserves existing data** (seeds add to existing)
- **Use this**: After code changes AND want to refresh seed data

#### `rebuild_backend.bat` - Backend Only
- Rebuilds only backend service
- Applies backend code changes
- **Use this**: After making backend/PHP changes only

#### `rebuild_frontend.bat` - Frontend Only
- Rebuilds only staff and member_portal
- Applies frontend code changes
- **Use this**: After making frontend changes only

### 🛑 Stop Scripts

#### `stop_app.bat` - Stop and Remove Everything
- Stops all services
- **Removes all volumes** (deletes database, storage)
- **Use this**: When you want to completely clean everything

### 🌱 Seed Scripts

#### `seed.bat` - Seed Database Only
- Applies seed data to existing database
- Does NOT reset database
- **Use this**: When you just want to add/refresh seed data

#### `reset_db.bat` - Reset Database Only
- Drops all tables and recreates
- Runs migrations fresh
- Seeds all data
- **Use this**: When you want fresh database but keep services running

## Quick Reference

| Task | Script | Data Loss? |
|------|--------|-----------|
| First time setup | `start_app.bat` | No (creates fresh) |
| Quick restart | `restart_app.bat` | No |
| Code changes (all) | `rebuild_app.bat` | No |
| Code changes + seed | `rebuild_and_seed.bat` | No |
| Backend changes only | `rebuild_backend.bat` | No |
| Frontend changes only | `rebuild_frontend.bat` | No |
| Add seed data | `seed.bat` | No |
| Reset database | `reset_db.bat` | Yes (database only) |
| Complete cleanup | `stop_app.bat` | Yes (everything) |

## Common Workflows

### Daily Development
```batch
# Make code changes, then:
rebuild_app.bat
```

### Frontend Development
```batch
# Make frontend changes, then:
rebuild_frontend.bat
```

### Backend Development
```batch
# Make backend changes, then:
rebuild_backend.bat
```

### After Pulling New Code
```batch
# Rebuild everything to apply changes:
rebuild_and_seed.bat
```

### Quick Restart (No Changes)
```batch
# Just restart services:
restart_app.bat
```

### Fresh Start (Clean Everything)
```batch
# Stop and remove everything:
stop_app.bat

# Then start fresh:
start_app.bat
```

## Service URLs

- **Backend API**: http://localhost:4001
- **Staff Portal**: http://localhost:5175
- **Member Portal**: http://localhost:7070
- **Adminer (DB)**: http://localhost:8082

## Notes

- All rebuild scripts preserve database and storage data
- Only `stop_app.bat` removes volumes (deletes data)
- Rebuild scripts use `--no-cache` to ensure fresh builds
- Services automatically wait for dependencies (database, backend)
- Migrations run automatically after rebuilds

