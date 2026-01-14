#!/bin/sh
set -e

echo "Starting DepanceAPP Server..."

# Construct DATABASE_URL if not already set
if [ -z "$DATABASE_URL" ]; then
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-3306}
    DB_USER=${DB_USER:-root}
    DB_PASSWORD=${DB_PASSWORD:-root}
    DB_NAME=${DB_NAME:-depance_db}
    export DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    echo "Constructed DATABASE_URL from individual variables"
fi

# Run migrations for MySQL/MariaDB
if [ "$NODE_ENV" = "production" ]; then
    echo "Pushing database schema..."
    npx prisma db push
fi

# Start application
exec "$@"
