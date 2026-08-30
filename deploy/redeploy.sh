#!/usr/bin/env sh
# อัป backend (หรือ FE) อย่างเดียว — ไม่ recreate db / rustfs ไม่รัน migrate
set -eu
cd "$(dirname "$0")"

target="${1:-api}"

case "$target" in
  api)
    docker compose pull api
    docker compose up -d --no-deps api
    ;;
  web)
    docker compose --profile frontend pull web
    docker compose --profile frontend up -d --no-deps web
    ;;
  *)
    echo "usage: $0 [api|web]" >&2
    echo "  api  (default)  pull + restart API only" >&2
    echo "  web             pull + restart frontend only" >&2
    echo "migrate: sh migrate.sh" >&2
    exit 1
    ;;
esac

docker compose ps
