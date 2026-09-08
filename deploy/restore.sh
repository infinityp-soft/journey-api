#!/usr/bin/env sh
# กู้คืนจากโฟลเดอร์ที่ backup.sh สร้าง — ทับของบนเครื่อง
# ใช้: CONFIRM=YES sh restore.sh /opt/journey/backups/2026-09-08_020000 [all|db|media]
set -eu
cd "$(dirname "$0")"

SRC="${1:-}"
TARGET="${2:-all}"

if [ -z "$SRC" ] || [ ! -d "$SRC" ]; then
  echo "usage: CONFIRM=YES sh restore.sh <backup-dir> [all|db|media]"
  exit 1
fi

case "$TARGET" in
  all|db|media) ;;
  *)
    echo "usage: CONFIRM=YES sh restore.sh <backup-dir> [all|db|media]"
    exit 1
    ;;
esac

if [ "${CONFIRM:-}" != "YES" ]; then
  echo "refusing to overwrite live data. re-run with CONFIRM=YES"
  exit 1
fi

restore_db() {
  dump="$SRC/postgres.sql.gz"
  if [ ! -f "$dump" ]; then
    echo "missing $dump"
    exit 1
  fi
  echo "==> restore postgres from $dump"
  gunzip -c "$dump" | docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1'
}

restore_media() {
  archive="$SRC/rustfs.tar.gz"
  if [ ! -f "$archive" ]; then
    echo "missing $archive"
    exit 1
  fi
  rustfs_id="$(docker compose ps -q rustfs)"
  if [ -z "$rustfs_id" ]; then
    echo "rustfs container is not running"
    exit 1
  fi
  vol="$(docker inspect -f '{{ range .Mounts }}{{ if eq .Destination "/data" }}{{ .Name }}{{ end }}{{ end }}' "$rustfs_id")"
  if [ -z "$vol" ]; then
    echo "could not find rustfs volume"
    exit 1
  fi
  echo "==> restore rustfs into $vol"
  docker compose stop api rustfs
  docker run --rm \
    -v "$vol:/data" \
    -v "$SRC:/backup:ro" \
    alpine sh -c 'find /data -mindepth 1 -maxdepth 1 -exec rm -rf {} + ; tar -xzf /backup/rustfs.tar.gz -C /data'
  docker compose start rustfs api
}

case "$TARGET" in
  all)
    restore_db
    restore_media
    ;;
  db) restore_db ;;
  media) restore_media ;;
esac

echo "==> done"
