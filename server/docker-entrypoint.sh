#!/bin/sh
set -e

echo "Starting DepanceAPP Server..."

# Construct DATABASE_URL if not already set. Encode credentials so reserved URL
# characters in usernames/passwords/database names cannot corrupt the DSN.
if [ -z "$DATABASE_URL" ]; then
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-3306}
    DB_USER=${DB_USER:-root}
    DB_PASSWORD=${DB_PASSWORD:-root}
    DB_NAME=${DB_NAME:-depance_db}

    DATABASE_URL=$(node -e '
const [user, password, host, port, database] = process.argv.slice(1);
const encodedUser = encodeURIComponent(user);
const encodedPassword = encodeURIComponent(password);
const encodedDatabase = encodeURIComponent(database);
process.stdout.write(`mysql://${encodedUser}:${encodedPassword}@${host}:${port}/${encodedDatabase}`);
' "$DB_USER" "$DB_PASSWORD" "$DB_HOST" "$DB_PORT" "$DB_NAME")
    export DATABASE_URL
    echo "Constructed DATABASE_URL from individual variables"
fi

if [ "$NODE_ENV" = "production" ]; then
    echo "Applying database migrations..."
    npx prisma migrate deploy
fi

exec "$@"
