#!/usr/bin/env sh
set -eu

BACKUP_INTERVAL_SECONDS="${BACKUP_INTERVAL_SECONDS:-86400}"
BACKUP_S3="${BACKUP_S3:-false}"
BACKUP_ALLOW_UNENCRYPTED="${BACKUP_ALLOW_UNENCRYPTED:-false}"

case "$BACKUP_INTERVAL_SECONDS" in
    ''|*[!0-9]*)
        echo "BACKUP_INTERVAL_SECONDS must be an integer" >&2
        exit 1
        ;;
esac

if [ "$BACKUP_INTERVAL_SECONDS" -lt 3600 ]; then
    echo "BACKUP_INTERVAL_SECONDS must be at least 3600 seconds" >&2
    exit 1
fi

if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ] && [ "$BACKUP_ALLOW_UNENCRYPTED" != "true" ]; then
    echo "BACKUP_ENCRYPTION_KEY is required for scheduled backups unless BACKUP_ALLOW_UNENCRYPTED=true" >&2
    exit 1
fi

run_backup() {
    set --
    if [ -n "${BACKUP_ENCRYPTION_KEY:-}" ]; then
        set -- "$@" --encrypt
    fi
    if [ "$BACKUP_S3" = "true" ]; then
        set -- "$@" --s3
    fi

    echo "Running scheduled DepanceAPP backup..."
    /app/scripts/backup.sh "$@"
}

# Create one backup immediately when the backup service starts, then continue on
# the configured interval so a fresh deployment is protected from the beginning.
while true; do
    if ! run_backup; then
        echo "Scheduled backup failed; retrying on the next interval" >&2
    fi
    sleep "$BACKUP_INTERVAL_SECONDS"
done
