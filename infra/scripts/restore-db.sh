#!/usr/bin/env sh
set -eu

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <backup.sql>" >&2
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "File not found: $BACKUP_FILE" >&2
  exit 1
fi

echo "Restoring into study_archive (container: study-archive-db). Press Ctrl+C within 5s to abort."
sleep 5

cat "$BACKUP_FILE" | docker exec -i study-archive-db psql -U study_user -d study_archive

echo "Done. Verify app health: curl -k https://localhost/api/health"
