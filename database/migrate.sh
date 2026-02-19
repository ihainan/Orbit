#!/bin/bash

# Database Migration Script for Orbitals
# Run migrations in order using Docker container

set -e

CONTAINER_NAME="${CONTAINER_NAME:-orbitals_postgres}"
DB_USER="${DB_USER:-orbitals}"
DB_NAME="${DB_NAME:-orbitals_db}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"

echo "Starting database migrations..."
echo "Container: $CONTAINER_NAME"
echo "Database: $DB_NAME"
echo ""

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Error: Container '$CONTAINER_NAME' is not running"
    echo "Please start the database with: docker-compose up -d"
    exit 1
fi

# Run each migration file in order
for migration in "$MIGRATIONS_DIR"/*.sql; do
    if [ -f "$migration" ]; then
        filename=$(basename "$migration")
        echo "Running migration: $filename"

        # Copy migration file to container and execute
        docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$migration"

        if [ $? -eq 0 ]; then
            echo "✓ $filename completed successfully"
        else
            echo "✗ $filename failed"
            exit 1
        fi
        echo ""
    fi
done

echo "All migrations completed successfully!"
