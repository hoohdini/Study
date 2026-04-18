#!/usr/bin/env sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-/var/backups/study-archive}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p "$BACKUP_DIR"

docker exec study-archive-db pg_dump -U study_user -d study_archive > "$BACKUP_DIR/db-$TIMESTAMP.sql"
find "$BACKUP_DIR" -type f -name "db-*.sql" -mtime +14 -delete
