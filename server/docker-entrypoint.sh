#!/bin/sh
set -e

echo "Starting DepanceAPP Server..."

# Support standard PaaS variables (Coolify / Railway / MariaDB)
DATABASE_URL="${DATABASE_URL:-${MYSQL_URL:-$MYSQL_PRIVATE_URL}}"

# Construct DATABASE_URL if not already set. Encode credentials so reserved URL
# characters in usernames/passwords/database names cannot corrupt the DSN.
if [ -z "$DATABASE_URL" ]; then
    DB_HOST=${DB_HOST:-${MYSQLHOST:-localhost}}
    DB_PORT=${DB_PORT:-${MYSQLPORT:-3306}}
    DB_USER=${DB_USER:-${MYSQLUSER:-root}}
    DB_PASSWORD=${DB_PASSWORD:-${MYSQLPASSWORD:-root}}
    DB_NAME=${DB_NAME:-${MYSQLDATABASE:-depance_db}}

    DATABASE_URL=$(node -e '
const [user, password, host, port, database] = process.argv.slice(1);
const encodedUser = encodeURIComponent(user);
const encodedPassword = encodeURIComponent(password);
const encodedDatabase = encodeURIComponent(database);
process.stdout.write(`mysql://${encodedUser}:${encodedPassword}@${host}:${port}/${encodedDatabase}`);
' "$DB_USER" "$DB_PASSWORD" "$DB_HOST" "$DB_PORT" "$DB_NAME")
    export DATABASE_URL
    echo "Constructed DATABASE_URL from individual variables"
else
    export DATABASE_URL
fi

# Auto-generate JWT secrets if missing to prevent boot crash on initial deployment
if [ -z "$JWT_ACCESS_SECRET" ]; then
    JWT_ACCESS_SECRET=$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')
    export JWT_ACCESS_SECRET
    echo "[WARN] Generated temporary JWT_ACCESS_SECRET. Set JWT_ACCESS_SECRET explicitly for session persistence across container restarts."
fi

if [ -z "$JWT_REFRESH_SECRET" ]; then
    JWT_REFRESH_SECRET=$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')
    export JWT_REFRESH_SECRET
    echo "[WARN] Generated temporary JWT_REFRESH_SECRET. Set JWT_REFRESH_SECRET explicitly for session persistence across container restarts."
fi

if [ "$NODE_ENV" = "production" ]; then
    echo "Waiting for database to be ready..."
    MAX_RETRIES=30
    RETRY_COUNT=0
    until node -e '
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
prisma.$queryRaw`SELECT 1`
  .then(() => { prisma.$disconnect(); process.exit(0); })
  .catch(() => { prisma.$disconnect(); process.exit(1); });
' >/dev/null 2>&1; do
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
            echo "Database connection check timed out after $MAX_RETRIES attempts, continuing..."
            break
        fi
        echo "Waiting for database connection ($RETRY_COUNT/$MAX_RETRIES)..."
        sleep 2
    done

    echo "Applying database migrations..."
    npx prisma migrate deploy
fi

exec "$@"
