#!/bin/bash
# ============================================================
# DepanceAPP - Encrypted PostgreSQL Backup Script
# ============================================================
# Usage: ./backup.sh [OPTIONS]
# Options:
#   --encrypt         Encrypt backup with GPG (requires BACKUP_ENCRYPTION_KEY)
#   --s3              Upload to S3 (requires AWS_* env vars)
#   --retention DAYS  Number of days to keep local backups (default: 7)
# ============================================================

set -e

# Configuration (read from environment or use defaults)
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="depance_backup_${TIMESTAMP}"

# Database connection (from environment)
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-depance_db}"
DB_USER="${POSTGRES_USER:-postgres}"

# Parse arguments
ENCRYPT=false
UPLOAD_S3=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --encrypt)
            ENCRYPT=true
            shift
            ;;
        --s3)
            UPLOAD_S3=true
            shift
            ;;
        --retention)
            RETENTION_DAYS="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "=================================================="
echo "DepanceAPP Database Backup"
echo "=================================================="
echo "Timestamp: $TIMESTAMP"
echo "Database: $DB_NAME"
echo "Encryption: $ENCRYPT"
echo "=================================================="

# Create the backup
echo "[1/4] Creating PostgreSQL dump..."
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -F c \
    -f "${BACKUP_DIR}/${BACKUP_NAME}.dump"

echo "    ✓ Backup created: ${BACKUP_NAME}.dump"

# Encrypt if requested
if [ "$ENCRYPT" = true ]; then
    echo "[2/4] Encrypting backup..."
    
    if [ -z "$BACKUP_ENCRYPTION_KEY" ]; then
        echo "    ✗ Error: BACKUP_ENCRYPTION_KEY environment variable is required for encryption"
        exit 1
    fi
    
    # Use OpenSSL for symmetric encryption (AES-256)
    openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 \
        -in "${BACKUP_DIR}/${BACKUP_NAME}.dump" \
        -out "${BACKUP_DIR}/${BACKUP_NAME}.dump.enc" \
        -pass env:BACKUP_ENCRYPTION_KEY
    
    # Remove unencrypted backup
    rm "${BACKUP_DIR}/${BACKUP_NAME}.dump"
    
    BACKUP_FILE="${BACKUP_NAME}.dump.enc"
    echo "    ✓ Encrypted backup: ${BACKUP_FILE}"
else
    BACKUP_FILE="${BACKUP_NAME}.dump"
    echo "[2/4] Skipping encryption (use --encrypt to enable)"
fi

# Upload to S3 if requested
if [ "$UPLOAD_S3" = true ]; then
    echo "[3/4] Uploading to S3..."
    
    if [ -z "$AWS_S3_BUCKET" ]; then
        echo "    ✗ Error: AWS_S3_BUCKET environment variable is required for S3 upload"
        exit 1
    fi
    
    aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" "s3://${AWS_S3_BUCKET}/backups/${BACKUP_FILE}"
    echo "    ✓ Uploaded to s3://${AWS_S3_BUCKET}/backups/${BACKUP_FILE}"
else
    echo "[3/4] Skipping S3 upload (use --s3 to enable)"
fi

# Clean up old backups
echo "[4/4] Cleaning up old backups (older than ${RETENTION_DAYS} days)..."
find "$BACKUP_DIR" -name "depance_backup_*.dump*" -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true
echo "    ✓ Cleanup complete"

echo "=================================================="
echo "Backup completed successfully!"
echo "File: ${BACKUP_DIR}/${BACKUP_FILE}"
echo "Size: $(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)"
echo "=================================================="

# Create a checksum for verification
sha256sum "${BACKUP_DIR}/${BACKUP_FILE}" > "${BACKUP_DIR}/${BACKUP_FILE}.sha256"
echo "Checksum saved: ${BACKUP_FILE}.sha256"
