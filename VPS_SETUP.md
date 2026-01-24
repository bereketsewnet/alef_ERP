# VPS Setup Guide - Port Configuration

## Overview

This ERP system has been configured to run on a VPS alongside another Docker service. All ports have been changed to avoid conflicts.

## Port Mapping

### Old Ports (Localhost - CONFLICTED)
- Backend API: `4001` ❌
- Staff Portal: `5175` ❌
- Member Portal: `7070` ❌
- MySQL: `3308` ❌
- Adminer: `8082` ❌

### New Ports (VPS - NO CONFLICTS)
- **Backend API**: `4002` ✅
- **Staff Portal**: `5176` ✅
- **Member Portal**: `7071` ✅
- **MySQL**: `3309` ✅
- **Adminer**: `8083` ✅

## Public IP Configuration

All services are configured to use the public IP: **102.211.186.118**

## Service URLs

- **Backend API**: http://102.211.186.118:4002
- **Staff Portal**: http://102.211.186.118:5176
- **Member Portal**: http://102.211.186.118:7071
- **Adminer (DB)**: http://102.211.186.118:8083

## Quick Start

### On Linux VPS:
```bash
cd /var/www/Alef_ERP
./start_vps.sh
```

### Or use docker-compose directly:
```bash
cd /var/www/Alef_ERP
docker-compose up --build -d
```

### On Windows (if using WSL or remote):
```batch
start_vps.bat
```

## Network Configuration

- **Network Name**: `alef-erp-network` (changed from `alef-network` to avoid conflicts)
- **Subnet**: `172.21.0.0/16` (changed from `172.20.0.0/16`)

## Container Names

All container names have been prefixed with `alef_erp_` to avoid conflicts:
- `alef_erp_backend`
- `alef_erp_staff`
- `alef_erp_member_portal`
- `alef_erp_db`
- `alef_erp_adminer`

## Environment Variables

The following environment variables are configured with the public IP:

- `APP_URL`: `http://102.211.186.118:4002`
- `FRONTEND_URL`: `http://102.211.186.118:5176`
- `VITE_API_URL`: `http://102.211.186.118:4002/api` (for frontend builds)

## Database Configuration

- **Database Name**: `alef_erp` (default)
- **Root Password**: `root` (default, change in production!)
- **Port**: `3309` (external), `3306` (internal)

## Common Commands

### Start services:
```bash
docker-compose up --build -d
```

### Stop services:
```bash
docker-compose down
```

### View logs:
```bash
docker-compose logs -f
```

### Run migrations:
```bash
docker-compose exec backend php artisan migrate --force
```

### Seed database:
```bash
docker-compose exec backend php artisan db:seed --force
```

### Access database:
```bash
docker-compose exec db mysql -uroot -proot alef_erp
```

## Firewall Configuration

Make sure these ports are open in your firewall:

```bash
# Ubuntu/Debian
sudo ufw allow 4002/tcp
sudo ufw allow 5176/tcp
sudo ufw allow 7071/tcp
sudo ufw allow 8083/tcp
sudo ufw allow 3309/tcp  # Only if you need external DB access
```

## Troubleshooting

### Port already in use:
```bash
# Check what's using the port
sudo netstat -tulpn | grep :4002
# or
sudo lsof -i :4002
```

### Container conflicts:
```bash
# Remove old containers
docker-compose down
docker rm -f alef_backend alef_staff alef_member_portal alef_db alef_adminer
```

### Network conflicts:
```bash
# Remove old network
docker network rm alef-network
```

### Rebuild everything:
```bash
docker-compose down -v
docker-compose up --build -d
```

## Security Notes

⚠️ **IMPORTANT FOR PRODUCTION:**

1. Change default database password
2. Use environment variables for sensitive data
3. Configure proper firewall rules
4. Use HTTPS (configure reverse proxy with SSL)
5. Update CORS settings if needed
6. Review and restrict database port access

## Next Steps

1. Start the services: `docker-compose up --build -d`
2. Wait for services to be ready (15-30 seconds)
3. Run migrations: `docker-compose exec backend php artisan migrate --force`
4. Seed database: `docker-compose exec backend php artisan db:seed --force`
5. Access the services via the URLs above

## Support

If you encounter issues:
- Check logs: `docker-compose logs -f`
- Verify containers are running: `docker-compose ps`
- Check network: `docker network ls`
- Verify ports: `docker-compose port backend 80`

