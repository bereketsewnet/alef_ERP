#!/bin/bash
# Don't use set -e, we want to handle errors gracefully

# Fix storage permissions first (before any Laravel commands)
echo "Setting up storage permissions..."
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/storage/framework/cache
mkdir -p /var/www/html/storage/framework/sessions
mkdir -p /var/www/html/storage/framework/views
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache
# Ensure log file is writable
touch /var/www/html/storage/logs/laravel.log
chown www-data:www-data /var/www/html/storage/logs/laravel.log
chmod 664 /var/www/html/storage/logs/laravel.log

# Ensure .env file is writable
if [ -f /var/www/html/.env ]; then
    chown www-data:www-data /var/www/html/.env
    chmod 664 /var/www/html/.env
fi
echo "Storage permissions set"

# Wait for database to be ready
echo "Waiting for database connection..."
until php -r "try { \$pdo = new PDO('mysql:host=${DB_HOST:-db};port=${DB_PORT:-3306};dbname=${DB_DATABASE:-alef_erp}', '${DB_USERNAME:-root}', '${DB_PASSWORD:-root}'); \$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); \$pdo->query('SELECT 1'); exit(0); } catch (Exception \$e) { exit(1); }" 2>/dev/null; do
    echo "Database is unavailable - sleeping"
    sleep 2
done
echo "Database is ready!"

# Generate APP_KEY if not set, empty, or invalid
# Laravel requires APP_KEY to be in format: base64:44-character-base64-string
# Check if .env file exists, if not create it
if [ ! -f /var/www/html/.env ]; then
    echo "Creating .env file from .env.example if it exists..."
    if [ -f /var/www/html/.env.example ]; then
        cp /var/www/html/.env.example /var/www/html/.env
    else
        # Create minimal .env file
        echo "APP_NAME=Laravel" > /var/www/html/.env
        echo "APP_ENV=${APP_ENV:-local}" >> /var/www/html/.env
        echo "APP_DEBUG=${APP_DEBUG:-true}" >> /var/www/html/.env
    fi
fi

# Check if APP_KEY needs to be generated or is invalid
NEED_KEY_GEN=false
if [ -z "${APP_KEY:-}" ] || [ "${APP_KEY:-}" = "" ]; then
    echo "APP_KEY is not set, will generate..."
    NEED_KEY_GEN=true
elif [[ ! "${APP_KEY}" =~ ^base64:[A-Za-z0-9+/]{43}=$ ]]; then
    echo "APP_KEY format appears invalid (must be base64:...), will regenerate..."
    NEED_KEY_GEN=true
fi

if [ "$NEED_KEY_GEN" = true ]; then
    echo "Generating application key..."
    # Generate key directly using PHP (more reliable)
    KEY=$(php -r "echo 'base64:' . base64_encode(random_bytes(32));")
    # Ensure APP_KEY line exists in .env
    if grep -q "^APP_KEY=" /var/www/html/.env; then
        sed -i "s|^APP_KEY=.*|APP_KEY=$KEY|" /var/www/html/.env
    else
        echo "APP_KEY=$KEY" >> /var/www/html/.env
    fi
    export APP_KEY="$KEY"
    echo "APP_KEY generated and set: ${KEY:0:30}..."
    echo "Application key generated successfully"
else
    echo "APP_KEY is set from environment"
    # Ensure it's also in .env file
    if [ -f /var/www/html/.env ]; then
        if grep -q "^APP_KEY=" /var/www/html/.env; then
            sed -i "s|^APP_KEY=.*|APP_KEY=${APP_KEY}|" /var/www/html/.env
        else
            echo "APP_KEY=${APP_KEY}" >> /var/www/html/.env
        fi
    fi
fi

# Generate JWT_SECRET if not set (optional, but recommended)
if [ -z "${JWT_SECRET:-}" ]; then
    echo "JWT_SECRET is not set, generating secret..."
    # Generate a random 32-byte base64 string
    export JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
    echo "JWT_SECRET generated (set it in docker-compose.yml for persistence)"
fi

# Clear config cache (this is safe, doesn't require database)
echo "Clearing configuration cache..."
php artisan config:clear || echo "Warning: Failed to clear config cache"

# Clear file-based caches (safe, doesn't require database)
echo "Clearing file-based caches..."
php artisan view:clear || echo "Warning: Failed to clear view cache"
php artisan route:clear || echo "Warning: Failed to clear route cache"

# Try to clear database cache, but don't fail if tables don't exist yet
echo "Attempting to clear application cache..."
php artisan cache:clear 2>&1 || echo "Note: Cache clear failed (this is normal if migrations haven't run yet)"

# Run migrations automatically
echo "Running database migrations..."
php artisan migrate --force || echo "Warning: Migrations failed or already up to date"

# Now clear cache again after migrations (if it was database cache)
echo "Clearing cache after migrations..."
php artisan cache:clear 2>&1 || echo "Note: Cache clear skipped"

echo "Starting Apache server..."
# Start Apache (this should not exit)
exec apache2-foreground

