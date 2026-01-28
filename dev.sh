#!/bin/bash
# Start development mode with hot-reloading
# Usage: ./dev.sh

echo "Starting development mode with hot-reloading..."
echo "This will mount source code as volumes for live updates"
echo ""

# Stop and remove existing frontend containers to free up ports
echo "Cleaning up existing frontend containers..."

# First, try to stop and remove using docker-compose
docker-compose stop staff member_portal 2>/dev/null || true
docker-compose rm -f staff member_portal 2>/dev/null || true

# Also try with dev compose
docker-compose -f docker-compose.yml -f docker-compose.dev.yml stop staff member_portal 2>/dev/null || true
docker-compose -f docker-compose.yml -f docker-compose.dev.yml rm -f staff member_portal 2>/dev/null || true

# Force remove containers by name
docker rm -f alef_erp_staff alef_erp_member_portal 2>/dev/null || true

# Wait a moment for ports to be released
sleep 2

echo "Starting development containers..."

# Ensure base services are running first
echo "Ensuring base services are running..."
docker-compose up -d db adminer

# Fix backend if it has issues (remove and recreate)
if docker ps -a --format "{{.Names}}" | grep -q "alef_erp_backend"; then
    BACKEND_STATUS=$(docker inspect --format='{{.State.Status}}' alef_erp_backend 2>/dev/null || echo "notfound")
    if [ "$BACKEND_STATUS" != "running" ]; then
        echo "Fixing backend container..."
        docker rm -f alef_erp_backend 2>/dev/null || true
        docker-compose up -d backend
    fi
else
    docker-compose up -d backend
fi

# Remove any existing frontend containers completely
echo "Removing existing frontend containers..."
# Remove by name
docker rm -f alef_erp_staff alef_erp_member_portal 2>/dev/null || true
# Remove by filter (catch all variations)
docker ps -aq --filter "name=alef_erp_staff" --filter "name=alef_erp_member_portal" | xargs -r docker rm -f 2>/dev/null || true
# Also try docker-compose remove
docker-compose rm -f staff member_portal 2>/dev/null || true
docker-compose -f docker-compose.yml -f docker-compose.dev.yml rm -f staff member_portal 2>/dev/null || true

# Clean up Docker networking (helps with stuck port allocations)
echo "Cleaning up Docker networking..."
docker network prune -f 2>/dev/null || true

# Wait a moment for ports to be released
echo "Waiting for ports to be released..."
sleep 5

# Build and start dev containers (only frontend services)
echo "Building development frontend containers..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml build staff member_portal

echo "Starting development frontend containers..."
# Start only frontend services using --no-deps to avoid backend recreation
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --no-deps staff member_portal

echo ""
echo "Development mode started!"
echo "Staff portal: http://localhost:5176"
echo "Member portal: http://localhost:7071"
echo ""
echo "To view logs: docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f staff member_portal"

