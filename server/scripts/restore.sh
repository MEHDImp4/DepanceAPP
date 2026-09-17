#!/usr/bin/env bash
# DepanceAPP - MariaDB/MySQL backup restore
# Usage: ./restore.sh <backup_file> [--yes] [--skip-checksum]

set -euo pipefail

if [[ $# -lt 1 ]]; then
    echo "Usage: ./restore.sh <backup_file> [--yes] [--skip-checksum]" >&2
    exit 1
fi

BACKUP_FILE="$1"
shift
AUTO_CONFIRM=false
SKIP_CHECKSUM=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --yes)
            AUTO_CONFIRM=true
            ;;
        --skip-checksum)
            SKIP_CHECKSUM=true
            ;;
        *)
            echo "Unknown option: $1" >&2
            exit 1
            ;;
    esac
    shift
done

if [[ ! -f "$BACKUP_FILE" ]]; then
    echo "Backup file not found: $BACKUP_FILE" >&2
    exit 1
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-depance_db}"
DB_USER="${DB_USER:-depance}"
DB_PASSWORD="${DB_PASSWORD:-}"

if command -v mariadb >/dev/null 2>&1; then
    CLIENT_BIN="mariadb"
elif command -v mysql >/dev/null 2>&1; then
    CLIENT_BIN="mysql"
else
    echo "mariadb or mysql client is required" >&2
    exit 1
fi

TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT

CHECKSUM_FILE="${BACKUP_FILE}.sha256"
if [[ "$SKIP_CHECKSUM" == true ]]; then
    echo "WARNING: checksum verification explicitly skipped." >&2
elif [[ -f "$CHECKSUM_FILE" ]]; then
    echo "Verifying checksum..."
    (cd "$(dirname "$BACKUP_FILE")" && sha256sum -c "$(basename "$CHECKSUM_FILE")")
else
    echo "Checksum file is required: $CHECKSUM_FILE" >&2
    echo "Use --skip-checksum only for a deliberately trusted legacy backup." >&2
    exit 1
fi

RESTORE_FILE="$BACKUP_FILE"
if [[ "$BACKUP_FILE" == *.enc ]]; then
    if [[ -z "${BACKUP_ENCRYPTION_KEY:-}" ]]; then
        echo "BACKUP_ENCRYPTION_KEY is required to decrypt this backup" >&2
        exit 1
    fi

    RESTORE_FILE="${TEMP_DIR}/backup.sql"
    openssl enc -aes-256-cbc -d -pbkdf2 -iter 100000 \
        -in "$BACKUP_FILE" \
        -out "$RESTORE_FILE" \
        -pass env:BACKUP_ENCRYPTION_KEY
fi

if [[ "$AUTO_CONFIRM" != true ]]; then
    echo "WARNING: restoring will replace tables contained in the backup in database '$DB_NAME'."
    read -r -p "Type 'yes' to continue: " confirm
    if [[ "$confirm" != "yes" ]]; then
        echo "Restore cancelled."
        exit 0
    fi
fi

echo "Restoring database '$DB_NAME'..."
MYSQL_PWD="$DB_PASSWORD" "$CLIENT_BIN" \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --default-character-set=utf8mb4 \
    "$DB_NAME" < "$RESTORE_FILE"

echo "Restore completed successfully."
