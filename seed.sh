#!/bin/bash

echo "=========================================="
echo "  ALEF DELTA ERP - SEED DATABASE"
echo "=========================================="
echo ""
echo "This will apply seed data (sample accounts, etc.)"
echo "to the existing database."
echo ""

cd "$(dirname "$0")"

echo "Checking if services are running..."
if ! docker-compose ps | grep -q "Up"; then
    echo ""
    echo "ERROR: Docker services are not running!"
    echo "Please run docker-compose up -d first."
    exit 1
fi

echo "Waiting for backend to be ready (e.g. after fresh up)..."
for i in 1 2 3 4 5 6 7 8 9 10; do
    if docker-compose exec -T backend php artisan --version >/dev/null 2>&1; then
        break
    fi
    sleep 2
done

echo ""
echo "[1/2] Running database migrations (if needed)..."
docker-compose exec -T backend php artisan migrate --force

echo ""
echo "[2/2] Seeding database..."
echo "Running seeders individually to ensure all data is created..."

# Run seeders in correct order
echo ""
echo "Running RolePermissionSeeder..."
docker-compose exec -T backend php artisan db:seed --class=RolePermissionSeeder --force
if [ $? -ne 0 ]; then
    echo "WARNING: RolePermissionSeeder failed, but continuing..."
fi

echo ""
echo "Running DepartmentSeeder..."
docker-compose exec -T backend php artisan db:seed --class=DepartmentSeeder --force
if [ $? -ne 0 ]; then
    echo "WARNING: DepartmentSeeder failed, but continuing..."
fi

echo ""
echo "Running AdminSeeder..."
docker-compose exec -T backend php artisan db:seed --class=AdminSeeder --force
if [ $? -ne 0 ]; then
    echo "WARNING: AdminSeeder failed, but continuing..."
fi

echo ""
echo "Running JobCategorySeeder..."
docker-compose exec -T backend php artisan db:seed --class=JobCategorySeeder --force
if [ $? -ne 0 ]; then
    echo "WARNING: JobCategorySeeder failed, but continuing..."
fi

echo ""
echo "Running JobSeeder..."
docker-compose exec -T backend php artisan db:seed --class=JobSeeder --force
if [ $? -ne 0 ]; then
    echo "WARNING: JobSeeder failed, but continuing..."
fi

echo ""
echo "Running ClientSeeder..."
docker-compose exec -T backend php artisan db:seed --class=ClientSeeder --force
if [ $? -ne 0 ]; then
    echo "WARNING: ClientSeeder failed, but continuing..."
fi

echo ""
echo "Running ClientSiteSeeder..."
docker-compose exec -T backend php artisan db:seed --class=ClientSiteSeeder --force
if [ $? -ne 0 ]; then
    echo "WARNING: ClientSiteSeeder failed, but continuing..."
fi

echo ""
echo "Running SampleDataSeeder..."
docker-compose exec -T backend php artisan db:seed --class=SampleDataSeeder --force
if [ $? -ne 0 ]; then
    echo "WARNING: SampleDataSeeder failed, but continuing..."
fi

echo ""
echo "Running ShiftScheduleSeeder..."
docker-compose exec -T backend php artisan db:seed --class=ShiftScheduleSeeder --force
if [ $? -ne 0 ]; then
    echo "WARNING: ShiftScheduleSeeder failed, but continuing..."
fi

echo ""
echo "Running AttendanceSeeder..."
docker-compose exec -T backend php artisan db:seed --class=AttendanceSeeder --force
if [ $? -ne 0 ]; then
    echo "WARNING: AttendanceSeeder failed, but continuing..."
fi

echo ""
echo "Running SyncUserPhones..."
docker-compose exec -T backend php artisan db:seed --class=SyncUserPhones --force
if [ $? -ne 0 ]; then
    echo "WARNING: SyncUserPhones failed, but continuing..."
fi

# Check if assets table exists before seeding
ASSETS_TABLE_EXISTS=$(docker-compose exec -T db mysql -uroot -proot -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'alef_erp' AND table_name = 'assets';" alef_erp 2>/dev/null | grep -c "1" || echo "0")
if [ "$ASSETS_TABLE_EXISTS" = "1" ]; then
    echo ""
    echo "Running AssetSeeder..."
    docker-compose exec -T backend php artisan db:seed --class=AssetSeeder --force
    if [ $? -ne 0 ]; then
        echo "WARNING: AssetSeeder failed, but continuing..."
    fi
else
    echo ""
    echo "INFO: Assets table does not exist, skipping AssetSeeder..."
fi

echo ""
echo "=========================================="
echo "  DATABASE SEEDED SUCCESSFULLY!"
echo "=========================================="
echo ""
echo "Sample users (admin panel):"
echo "  - Owner:       owner@alefdelta.com / owner123"
echo "  - GM:          gm@alefdelta.com / gm123"
echo "  - HR:          hr@alefdelta.com / hr123"
echo "  - Finance:     finance@alefdelta.com / finance123"
echo "  - Operations:  operations@alefdelta.com / operations123"
echo "  - Marketing:   marketing@alefdelta.com / marketing123"
echo "  - Procurement: procurement@alefdelta.com / procurement123"
echo ""
echo "Sample users (field staff / member portal):"
echo "  - johndoe / john.doe@alefdelta.com / password123 (Phone: +251911234567)"
echo "  - janesmith / jane.smith@alefdelta.com / password123"
echo "  (+ additional sample employees from SampleDataSeeder)"
echo ""
echo "Seeded Data:"
echo "  - Roles and Permissions"
echo "  - Departments"
echo "  - Admin & sample users"
echo "  - Job Categories and Jobs"
echo "  - Clients and Client Sites"
echo "  - Employees and Users"
echo "  - Shift Schedules"
echo "  - Attendance Logs"
echo "  - Assets (if table exists)"
echo "  - Phone numbers synced"
echo ""
echo "Tip: After 'docker-compose down -v' and 'docker-compose up -d',"
echo "     run ./seed.sh again to migrate and seed all sample users."
echo ""

