#!/bin/sh
set -e

echo "Starting DepanceAPP Server..."

# Run migrations for MySQL/MariaDB
if [ "$NODE_ENV" = "production" ]; then
    echo "Running database migrations..."
    npx prisma migrate deploy
fi

# Start application
exec "$@"
