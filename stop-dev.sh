#!/bin/bash
# Stop development mode and switch back to production
# Usage: ./stop-dev.sh

echo "Stopping development containers..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

echo "Starting production containers..."
docker-compose up -d

echo "Done! Switched back to production mode."

