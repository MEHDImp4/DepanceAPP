#!/usr/bin/env bash
# DepanceAPP - MariaDB/MySQL encrypted backup
# Usage: ./backup.sh [--encrypt] [--s3] [--retention DAYS]

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_NAME="depance_backup_${TIMESTAMP}"

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-depance_db}"
DB_USER="${DB_USER:-depance}"
DB_PASSWORD="${DB_PASSWORD:-}"

ENCRYPT=false
UPLOAD_S3=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --encrypt)
            ENCRYPT=true
            shift
            ;;
        --s3)
            UPLOAD_S3=true
            shift
            ;;
        --retention)
            [[ $# -ge 2 ]] || { echo "--retention requires a number of days" >&2; exit 1; }
            RETENTION_DAYS="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1" >&2
            exit 1
            ;;
    esac
done

if ! [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
    echo "RETENTION_DAYS must be a non-negative integer" >&2
    exit 1
fi

if command -v mariadb-dump >/dev/null 2>&1; then
    DUMP_BIN="mariadb-dump"
elif command -v mysqldump >/dev/null 2>&1; then
    DUMP_BIN="mysqldump"
else
    echo "mariadb-dump or mysqldump is required" >&2
    exit 1
fi

mkdir -p "$BACKUP_DIR"
RAW_FILE="${BACKUP_DIR}/${BACKUP_NAME}.sql"

cleanup_failed_dump() {
    if [[ ${1:-0} -ne 0 ]]; then
        rm -f "$RAW_FILE"
    fi
}
trap 'cleanup_failed_dump $?' EXIT

echo "Creating MariaDB/MySQL backup for database '$DB_NAME'..."
MYSQL_PWD="$DB_PASSWORD" "$DUMP_BIN" \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --single-transaction \
    --quick \
    --routines \
    --triggers \
    --events \
    --add-drop-table \
    --default-character-set=utf8mb4 \
    "$DB_NAME" > "$RAW_FILE"

BACKUP_FILE="$RAW_FILE"

if [[ "$ENCRYPT" == true ]]; then
    if [[ -z "${BACKUP_ENCRYPTION_KEY:-}" ]]; then
        echo "BACKUP_ENCRYPTION_KEY is required with --encrypt" >&2
        exit 1
    fi

    ENCRYPTED_FILE="${RAW_FILE}.enc"
    openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 \
        -in "$RAW_FILE" \
        -out "$ENCRYPTED_FILE" \
        -pass env:BACKUP_ENCRYPTION_KEY
    rm -f "$RAW_FILE"
    BACKUP_FILE="$ENCRYPTED_FILE"
fi

sha256sum "$BACKUP_FILE" > "${BACKUP_FILE}.sha256"

if [[ "$UPLOAD_S3" == true ]]; then
    : "${AWS_S3_BUCKET:?AWS_S3_BUCKET is required with --s3}"
    command -v aws >/dev/null 2>&1 || { echo "aws CLI is required with --s3" >&2; exit 1; }
    aws s3 cp "$BACKUP_FILE" "s3://${AWS_S3_BUCKET}/backups/$(basename "$BACKUP_FILE")"
    aws s3 cp "${BACKUP_FILE}.sha256" "s3://${AWS_S3_BUCKET}/backups/$(basename "${BACKUP_FILE}.sha256")"
fi

find "$BACKUP_DIR" -type f \( -name 'depance_backup_*.sql' -o -name 'depance_backup_*.sql.enc' -o -name 'depance_backup_*.sha256' \) \
    -mtime "+${RETENTION_DAYS}" -delete 2>/dev/null || true

trap - EXIT

echo "Backup completed: $BACKUP_FILE"
echo "Checksum: ${BACKUP_FILE}.sha256"
