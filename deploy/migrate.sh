#!/usr/bin/env sh
# รัน Prisma migrate แยกจาก deploy — ไม่รีสตาร์ท api / ไม่แตะ volume
# ใช้ prisma ที่ติดตั้งไว้ใน image เพื่อให้เวอร์ชันตรงกับ @prisma/client
set -eu
cd "$(dirname "$0")"

docker compose build api
docker compose run --rm --no-deps api ./node_modules/.bin/prisma migrate deploy
