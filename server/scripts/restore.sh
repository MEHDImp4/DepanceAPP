#!/bin/bash
# ============================================================
# DepanceAPP - Encrypted Backup Restore Script
# ============================================================
# Usage: ./restore.sh <backup_file>
# ============================================================

set -e

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup_file>"
    echo "Example: ./restore.sh backups/depance_backup_20260110_120000.dump.enc"
    exit 1
fi

BACKUP_FILE="$1"
TEMP_DIR=$(mktemp -d)

# Database connection
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-depance_db}"
DB_USER="${POSTGRES_USER:-postgres}"

echo "=================================================="
echo "DepanceAPP Database Restore"
echo "=================================================="
echo "Backup file: $BACKUP_FILE"
echo "Target database: $DB_NAME"
echo "=================================================="

# Check if file is encrypted
if [[ "$BACKUP_FILE" == *.enc ]]; then
    echo "[1/3] Decrypting backup..."
    
    if [ -z "$BACKUP_ENCRYPTION_KEY" ]; then
        echo "    ✗ Error: BACKUP_ENCRYPTION_KEY environment variable is required for decryption"
        exit 1
    fi
    
    DECRYPTED_FILE="${TEMP_DIR}/backup.dump"
    
    openssl enc -aes-256-cbc -d -pbkdf2 -iter 100000 \
        -in "$BACKUP_FILE" \
        -out "$DECRYPTED_FILE" \
        -pass env:BACKUP_ENCRYPTION_KEY
    
    echo "    ✓ Decrypted successfully"
    RESTORE_FILE="$DECRYPTED_FILE"
else
    RESTORE_FILE="$BACKUP_FILE"
    echo "[1/3] Skipping decryption (file is not encrypted)"
fi

# Verify checksum if available
CHECKSUM_FILE="${BACKUP_FILE}.sha256"
if [ -f "$CHECKSUM_FILE" ]; then
    echo "[2/3] Verifying checksum..."
    if sha256sum -c "$CHECKSUM_FILE" --quiet 2>/dev/null; then
        echo "    ✓ Checksum verified"
    else
        echo "    ⚠ Warning: Checksum verification failed or not applicable for decrypted file"
    fi
else
    echo "[2/3] No checksum file found, skipping verification"
fi

# Confirm before restore
echo ""
echo "⚠️  WARNING: This will REPLACE all data in the '$DB_NAME' database!"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    rm -rf "$TEMP_DIR"
    exit 0
fi

# Restore the backup
echo "[3/3] Restoring database..."
PGPASSWORD="${POSTGRES_PASSWORD}" pg_restore \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -c \
    --if-exists \
    "$RESTORE_FILE"

echo "    ✓ Database restored successfully"

# Cleanup
rm -rf "$TEMP_DIR"

echo "=================================================="
echo "Restore completed successfully!"
echo "=================================================="
