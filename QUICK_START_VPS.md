# Quick Start - VPS Deployment

## 🚀 Start Services

Simply run:
```bash
docker-compose up --build -d
```

Or use the provided script:
```bash
./start_vps.sh
```

## 📍 Service URLs

All services are accessible via public IP: **102.211.186.118**

- **Backend API**: http://102.211.186.118:4002
- **Staff Portal**: http://102.211.186.118:5176
- **Member Portal**: http://102.211.186.118:7071
- **Adminer (DB)**: http://102.211.186.118:8083

**Telegram Bot** (no port): runs in the background; configure `telegram-bot-starter/.env` with bot token and Mini App URL. See `telegram-bot-starter/README.md`.

## 🔧 Port Changes (No Conflicts)

| Service | Old Port | New Port |
|---------|----------|----------|
| Backend API | 4001 | **4002** |
| Staff Portal | 5175 | **5176** |
| Member Portal | 7070 | **7071** |
| MySQL | 3308 | **3309** |
| Adminer | 8082 | **8083** |

## ✅ What Was Changed

1. ✅ All ports changed to avoid conflicts with existing service
2. ✅ Public IP (102.211.186.118) configured in all services
3. ✅ Network name changed to `alef-erp-network`
4. ✅ Container names prefixed with `alef_erp_`
5. ✅ CORS updated to allow VPS URLs
6. ✅ Frontend build args updated with public IP

## 📝 Next Steps After Starting

1. **Wait for services** (15-30 seconds)
2. **Run migrations**:
   ```bash
   docker-compose exec backend php artisan migrate --force
   ```
3. **Seed database** (optional):
   ```bash
   docker-compose exec backend php artisan db:seed --force
   ```

## 🔍 Verify Services

```bash
# Check running containers
docker-compose ps

# View logs
docker-compose logs -f

# Check specific service
docker-compose logs backend
```

## 🛑 Stop Services

```bash
docker-compose down
```

## 📚 More Information

See `VPS_SETUP.md` for detailed configuration and troubleshooting.

cd /var/www/Alef_ERP
docker-compose build backend staff
docker-compose up -d backend staff

