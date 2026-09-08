#!/usr/bin/env sh
# สำรอง Postgres + ไฟล์ใน rustfs — ไม่แตะ volume ต้นทาง
# ใช้: sh backup.sh [all|db|media]
#
# cron ทุกวัน 02:00:
#   0 2 * * * cd /opt/journey/deploy && sh backup.sh
#
# เก็บไว้ที่ BACKUP_DIR (ค่าเริ่มต้น /opt/journey/backups)
# ลบของเก่าเกิน KEEP วันโฟลเดอร์ (ค่าเริ่มต้น 14, ตั้ง 0 คือไม่ลบ)
set -eu
cd "$(dirname "$0")"

TARGET="${1:-all}"
case "$TARGET" in
  all|db|media) ;;
  *)
    echo "usage: sh backup.sh [all|db|media]"
    exit 1
    ;;
esac

ROOT="${BACKUP_DIR:-/opt/journey/backups}"
STAMP="$(date +%Y-%m-%d_%H%M%S)"
DEST="$ROOT/$STAMP"
KEEP="${KEEP:-14}"

mkdir -p "$DEST"

dump_db() {
  echo "==> postgres -> $DEST/postgres.sql.gz"
  docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" --no-owner --no-acl --clean --if-exists "$POSTGRES_DB"' \
    | gzip > "$DEST/postgres.sql.gz"
}

dump_media() {
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
  echo "==> rustfs ($vol) -> $DEST/rustfs.tar.gz"
  docker run --rm \
    -v "$vol:/data:ro" \
    -v "$DEST:/backup" \
    alpine tar -czf /backup/rustfs.tar.gz -C /data .
}

case "$TARGET" in
  all)
    dump_db
    dump_media
    ;;
  db) dump_db ;;
  media) dump_media ;;
esac

{
  echo "stamp=$STAMP"
  echo "target=$TARGET"
  echo "host=$(hostname)"
} > "$DEST/manifest.txt"

echo "==> done"
ls -lh "$DEST"

if [ "$KEEP" -gt 0 ]; then
  n=0
  for dir in $(ls -1d "$ROOT"/20* 2>/dev/null | sort -r); do
    [ -d "$dir" ] || continue
    n=$((n + 1))
    if [ "$n" -gt "$KEEP" ]; then
      echo "==> prune $dir"
      rm -rf "$dir"
    fi
  done
fi
