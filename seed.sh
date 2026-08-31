#!/bin/bash

if [ "${1:-}" = "--container-if-empty" ]; then
    set -e
    cd /var/www/html

    echo "Checking whether the database needs initial seed data..."
    php artisan migrate --force

    USER_COUNT=$(php -r '
        $dsn = sprintf(
            "mysql:host=%s;port=%s;dbname=%s",
            getenv("DB_HOST") ?: "db",
            getenv("DB_PORT") ?: "3306",
            getenv("DB_DATABASE") ?: "alef_erp"
        );
        $pdo = new PDO($dsn, getenv("DB_USERNAME") ?: "root", getenv("DB_PASSWORD") ?: "root");
        echo (int) $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    ')

    if [ "$USER_COUNT" -gt 0 ]; then
        echo "Database already contains $USER_COUNT user(s); automatic seeding skipped."
        exit 0
    fi

    echo "The users table is empty; running DatabaseSeeder..."
    php artisan db:seed --force
    echo "Initial database seed completed successfully."
    exit 0
fi

echo "=========================================="
echo "  ALEF DELTA ERP - SEED DATABASE"
echo "=========================================="
echo ""
echo "This applies the production authorization baseline and owner account."
echo ""

cd "$(dirname "$0")"

echo "Checking if services are running..."
if ! docker compose ps | grep -q "Up"; then
    echo ""
    echo "ERROR: Docker services are not running!"
    echo "Please run docker-compose up -d first."
    exit 1
fi

echo "Waiting for backend to be ready (e.g. after fresh up)..."
for i in 1 2 3 4 5 6 7 8 9 10; do
    if docker compose exec -T backend php artisan --version >/dev/null 2>&1; then
        break
    fi
    sleep 2
done

echo ""
echo "[1/2] Running database migrations (if needed)..."
docker compose exec -T backend php artisan migrate --force

echo ""
echo "[2/2] Seeding database..."
docker compose exec -T backend php artisan db:seed --force

echo ""
echo "=========================================="
echo "  DATABASE SEEDED SUCCESSFULLY!"
echo "=========================================="
echo ""
echo "Production OWNER account and authorization metadata created."
echo ""
echo "No demo or operational business data was seeded."
echo ""
