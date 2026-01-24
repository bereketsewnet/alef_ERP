#!/bin/bash

echo "=========================================="
echo "  ALEF DELTA ERP - VPS START SCRIPT"
echo "=========================================="
echo ""
echo "This will build and start all services"
echo "using: docker-compose up --build -d"
echo ""

cd "$(dirname "$0")"

echo "[1/3] Building and starting all services..."
docker-compose up --build -d

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Failed to start Docker services!"
    exit 1
fi

echo ""
echo "[2/3] Waiting for services to be ready..."
sleep 15

# Wait for database
echo "Waiting for database..."
until docker-compose exec -T db mysqladmin ping -h localhost --silent 2>/dev/null; do
    echo "Waiting for database..."
    sleep 3
done

# Wait for backend
echo "Waiting for backend..."
until docker-compose exec -T backend php --version > /dev/null 2>&1; do
    echo "Waiting for backend..."
    sleep 3
done

echo "Services are ready!"
echo ""

echo "[3/3] Running database migrations..."
docker-compose exec -T backend php artisan migrate --force

if [ $? -ne 0 ]; then
    echo "WARNING: Migrations may have failed. Check logs with: docker-compose logs backend"
fi

echo ""
echo "=========================================="
echo "  SERVICES STARTED SUCCESSFULLY!"
echo "=========================================="
echo ""
echo "Services are running:"
echo "  - Backend API:    http://102.211.186.118:4002"
echo "  - Staff Portal:   http://102.211.186.118:5176"
echo "  - Member Portal:  http://102.211.186.118:7071"
echo "  - Adminer (DB):   http://102.211.186.118:8083"
echo ""
echo "To seed database:   docker-compose exec backend php artisan db:seed --force"
echo "To view logs:       docker-compose logs -f"
echo "To stop:            docker-compose down"
echo ""

