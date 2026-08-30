#!/usr/bin/env sh
# สร้าง super admin ครั้งแรก — รันหลัง migrate.sh
# เปลี่ยนรหัสผ่านทันทีหลัง login ครั้งแรก
set -eu
cd "$(dirname "$0")"

docker compose run --rm --no-deps api ./node_modules/.bin/prisma db seed
