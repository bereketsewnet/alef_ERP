#!/bin/bash
# Fix stuck Docker port allocations
# This script helps resolve "port is already allocated" errors

echo "Fixing Docker port allocation issues..."
echo ""

# Remove all frontend containers
echo "1. Removing frontend containers..."
docker rm -f alef_erp_staff alef_erp_member_portal 2>/dev/null || true
docker ps -aq --filter "name=staff" --filter "name=member_portal" | xargs -r docker rm -f 2>/dev/null || true

# Clean up networks
echo "2. Cleaning up networks..."
docker network prune -f

# Check if Docker daemon restart is needed
echo ""
echo "3. Checking port status..."
if netstat -tuln 2>/dev/null | grep -qE ":5176|:7071" || ss -tuln 2>/dev/null | grep -qE ":5176|:7071"; then
    echo "   WARNING: Ports 5176 or 7071 are still in use!"
    echo "   You may need to restart Docker daemon:"
    echo "   sudo systemctl restart docker"
    echo ""
    echo "   Or try: sudo service docker restart"
else
    echo "   Ports appear to be free."
fi

echo ""
echo "4. Attempting to start containers..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --no-deps staff member_portal

echo ""
echo "If ports are still stuck, restart Docker:"
echo "  sudo systemctl restart docker"
echo "Then run: ./dev.sh"

