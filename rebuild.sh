#!/bin/bash
# Rebuild containers without removing volumes
# Usage: ./rebuild.sh [service_name]
# Example: ./rebuild.sh staff (rebuilds only staff)
# Example: ./rebuild.sh (rebuilds all services)

echo "Rebuilding Docker containers without removing volumes..."

if [ -z "$1" ]; then
    # Rebuild all services
    echo "Rebuilding all services..."
    docker-compose build --no-cache
    docker-compose up -d
else
    # Rebuild specific service
    echo "Rebuilding service: $1"
    # Stop the specific service first
    docker-compose stop "$1"
    docker-compose build --no-cache "$1"
    docker-compose up -d "$1"
fi

echo "Done! Containers rebuilt without removing volumes."
echo "Database and storage data are preserved."

