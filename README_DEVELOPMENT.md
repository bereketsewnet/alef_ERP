# Development Guide - See Changes Without Removing Volumes

## Quick Commands

### Option 1: Rebuild Specific Service (Recommended)
```bash
# Rebuild only the service you changed (keeps database intact)
./rebuild.sh staff          # Rebuild staff frontend
./rebuild.sh member_portal  # Rebuild member portal
./rebuild.sh backend        # Rebuild backend
```

### Option 2: Rebuild All Services
```bash
# Rebuild all services without removing volumes
./rebuild.sh
```

### Option 3: Development Mode with Hot Reloading
```bash
# Start in development mode (source code mounted as volumes)
./dev.sh
```

This will:
- Stop existing frontend containers to free up ports
- Mount source code as volumes (changes reflect immediately)
- Run Vite dev server for frontends (hot reloading)
- Keep database and storage volumes intact
- Start services in detached mode (background)

**Note:** If you get port conflicts, the script will automatically stop existing containers first.

**To stop dev mode and return to production:**
```bash
./stop-dev.sh
```

### Option 4: Manual Docker Commands

**Rebuild without removing volumes:**
```bash
# Rebuild specific service
docker-compose build --no-cache staff
docker-compose up -d staff

# Rebuild all services
docker-compose build --no-cache
docker-compose up -d
```

**Restart services (no rebuild needed if code is mounted):**
```bash
# Restart specific service
docker-compose restart staff

# Restart all services
docker-compose restart
```

## Development Mode Details

When using `./dev.sh`:
- **Backend**: Code is mounted, changes reflect after restart or auto-reload
- **Staff Frontend**: Vite dev server runs on port 5176 with hot reloading
- **Member Portal**: Vite dev server runs on port 7071 with hot reloading
- **Database**: All data preserved in volumes

## Production Mode

For production, use the regular docker-compose.yml:
```bash
docker-compose up -d --build
```

## Important Notes

1. **Volumes are preserved**: Database data and storage files are never removed
2. **Hot reloading**: In dev mode, frontend changes appear immediately
3. **Backend changes**: May require container restart: `docker-compose restart backend`
4. **Database migrations**: Run with: `docker-compose exec backend php artisan migrate`

## Troubleshooting

### Port Already in Use

If you see errors about ports being already allocated (e.g., "Bind for 0.0.0.0:5176 failed: port is already allocated"):

1. **First, try the fix script:**
   ```bash
   ./fix-ports.sh
   ```

2. **If that doesn't work, restart Docker daemon:**
   ```bash
   sudo systemctl restart docker
   # or
   sudo service docker restart
   ```
   
   Then run `./dev.sh` again.

3. **Manual cleanup (if needed):**
   ```bash
   # Remove containers
   docker rm -f alef_erp_staff alef_erp_member_portal
   
   # Clean networks
   docker network prune -f
   
   # Wait a moment
   sleep 5
   
   # Try starting again
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --no-deps staff member_portal
   ```

### Changes Don't Appear

**If changes don't appear:**
1. Check if volumes are mounted: `docker-compose exec staff ls -la /app`
2. Restart the service: `docker-compose restart staff`
3. Rebuild if needed: `./rebuild.sh staff`

**Clear cache (without removing volumes):**
```bash
docker-compose exec backend php artisan cache:clear
docker-compose exec backend php artisan config:clear
docker-compose exec backend php artisan view:clear
```

