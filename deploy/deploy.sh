#!/usr/bin/env sh
# Build ใหม่แล้วสลับ container — ใช้: sh deploy.sh [api|web|web-admin|all]
# --no-deps ทำให้ db / rustfs และ volume ข้อมูลไม่ถูกแตะ
set -eu
cd "$(dirname "$0")"

# pull ให้เฉพาะกรณีที่ซอร์สเป็น git repo — ถ้าอัปโหลดไฟล์ขึ้นมาเองจะข้ามขั้นนี้
pull_if_git() {
  if [ -d "$1/.git" ]; then
    echo "==> git pull $1"
    git -C "$1" pull --ff-only
  else
    echo "==> $1 ไม่ใช่ git repo — ใช้ไฟล์ที่อัปโหลดมา"
  fi
}

TARGET="${1:-all}"

case "$TARGET" in
  api)
    pull_if_git ../journey-api
    SERVICES="api"
    ;;
  web)
    pull_if_git ../journey-web
    SERVICES="web"
    ;;
  web-admin)
    pull_if_git ../jourey-web-admin
    SERVICES="web-admin"
    ;;
  all)
    pull_if_git ../journey-api
    pull_if_git ../journey-web
    pull_if_git ../jourey-web-admin
    SERVICES="api web web-admin"
    ;;
  *)
    echo "usage: sh deploy.sh [api|web|web-admin|all]"
    exit 1
    ;;
esac

echo "==> building: $SERVICES"
docker compose build $SERVICES
rm -rf ./nginx
docker compose up -d --no-deps --remove-orphans $SERVICES

docker image prune -f
docker compose ps
