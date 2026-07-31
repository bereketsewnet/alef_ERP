# ALEF DELTA ERP - Docker Production Deployment

This stack runs the Laravel API, staff frontend, member portal, MySQL,
Adminer, and Caddy. Caddy obtains and renews HTTPS certificates
automatically.

On the current VPS, the existing shared Caddy service from
`/AFRICA LOGISTICS` handles the ERP domains and joins this stack's external
Docker network. The local `caddy` service is in the `standalone-proxy` profile
to prevent a port 80/443 conflict. Use that profile only on a server that does
not already have a reverse proxy:

```bash
docker compose --profile standalone-proxy up -d
```

## Production domains

- API: `https://erp-api.alefdelta.com`
- Staff portal: `https://erp-staff.alefdelta.com`
- Member portal: `https://erp-member.alefdelta.com`

All three DNS `A` records must point to `46.225.185.190`. Allow inbound TCP
ports 80 and 443 and UDP port 443 in the VPS firewall. Caddy needs port 80
for initial certificate validation and redirects.

## Production startup

1. Review `.env` and set strong, persistent values for `DB_PASSWORD`,
   `APP_KEY`, and `JWT_SECRET`. Set `APP_ENV=production`,
   `APP_DEBUG=false`, and optionally set `ACME_EMAIL`.
2. Make the seed script executable: `chmod +x seed.sh`.
3. Build and start everything:

```bash
docker compose up -d --build
```

4. Check startup and certificate logs:

```bash
docker compose ps
docker compose logs -f caddy backend seed
```

The one-shot `seed` service runs migrations and calls `seed.sh` during
startup. It seeds only when the `users` table contains zero rows. If migrated
data already exists, it exits without changing that data. To run the seed
script manually, use:

```bash
./seed.sh
```

Do not use `docker compose down -v` on a production system: `-v` deletes the
MySQL and Caddy volumes. Adminer and MySQL are bound to localhost only
(`127.0.0.1:8083` and `127.0.0.1:3309`) and are not publicly exposed.

## Local legacy startup

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
