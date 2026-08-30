#!/usr/bin/env sh
# รัน Prisma migrate แยกจาก redeploy — ไม่รีสตาร์ท api / ไม่แตะ volume
# ใช้ image API ล่าสุด (มีโฟลเดอร์ prisma/migrations ใน image)
set -eu
cd "$(dirname "$0")"

docker compose pull api
docker compose run --rm --no-deps api npx prisma migrate deploy
