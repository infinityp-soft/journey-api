#!/usr/bin/env sh
# ส่งซอร์สจากเครื่อง dev (macOS / Linux) ขึ้นเซิร์ฟเวอร์โดยไม่ต้องใช้ git — คู่กับ upload.ps1
#
#   sh upload.sh root@203.0.113.10
#   sh upload.sh root@203.0.113.10 api
#   sh upload.sh root@203.0.113.10 web
#   sh upload.sh root@203.0.113.10 web-admin
#
# แล้วที่เซิร์ฟเวอร์:  cd /opt/journey/deploy ; sh deploy.sh
#
# .env บนเซิร์ฟเวอร์ไม่ถูกทับ เพราะไม่ได้อยู่ในซอร์ส
# เปลี่ยนปลายทางด้วย REMOTE_PATH (ค่าเริ่มต้น /opt/journey)
set -eu

SERVER="${1:-}"
TARGET="${2:-all}"
REMOTE_PATH="${REMOTE_PATH:-/opt/journey}"

if [ -z "$SERVER" ]; then
  echo "usage: sh upload.sh user@host [api|web|web-admin|all]"
  exit 1
fi

case "$TARGET" in
  api|web|web-admin|all) ;;
  *)
    echo "usage: sh upload.sh user@host [api|web|web-admin|all]"
    exit 1
    ;;
esac

# deploy/ อยู่ใน journey-api — ขึ้นไปสองชั้นจะเจอทั้งสาม repo
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
API_DIR="journey-api"
SITE_DIR="journey-web"
ADMIN_DIR="jourey-web-admin"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# COPYFILE_DISABLE / --no-xattrs / --no-mac-metadata ตัดไฟล์ ._* และ xattr ของ macOS
# ไม่งั้น GNU tar บน Ubuntu จะเตือน unknown extended header เต็มจอ
pack() {
  dir="$1"
  shift
  echo "==> packing $dir"
  COPYFILE_DISABLE=1 tar --no-xattrs --no-mac-metadata -czf "$TMP/$dir.tar.gz" \
    --exclude "$dir/node_modules" --exclude "$dir/.git" "$@" \
    -C "$ROOT" "$dir"
}

cd "$ROOT"

if [ "$TARGET" = "api" ] || [ "$TARGET" = "all" ]; then
  pack "$API_DIR" --exclude "$API_DIR/dist" --exclude "$API_DIR/storage" --exclude "$API_DIR/.env"
fi
if [ "$TARGET" = "web" ] || [ "$TARGET" = "all" ]; then
  pack "$SITE_DIR" --exclude "$SITE_DIR/.next" --exclude "$SITE_DIR/.env*"
fi
if [ "$TARGET" = "web-admin" ] || [ "$TARGET" = "all" ]; then
  pack "$ADMIN_DIR" --exclude "$ADMIN_DIR/.next" --exclude "$ADMIN_DIR/.env*" \
    --exclude "$ADMIN_DIR/storybook-static" --exclude "$ADMIN_DIR/test-results"
fi

echo "==> uploading to $SERVER"
scp "$TMP"/*.tar.gz "$SERVER:/tmp/"

# แทนที่ซอร์สเก่า แล้วอัปเดต deploy/ (compose, สคริปต์) — cp ไม่ลบ deploy/.env
echo "==> extracting on server"
ssh "$SERVER" "set -eu
mkdir -p '$REMOTE_PATH'
cd '$REMOTE_PATH'
for d in '$API_DIR' '$SITE_DIR' '$ADMIN_DIR'; do
  if [ -f \"/tmp/\$d.tar.gz\" ]; then
    rm -rf \"\$d\"
    tar --no-same-owner -xzf \"/tmp/\$d.tar.gz\"
    rm -f \"/tmp/\$d.tar.gz\"
  fi
done
if [ -d '$API_DIR/deploy' ]; then mkdir -p deploy; cp -r '$API_DIR/deploy/.' deploy/; fi
echo extracted:
ls -1"

echo ""
echo "Done. Next, on the server:"
echo "  ssh $SERVER"
echo "  cd $REMOTE_PATH/deploy ; sh deploy.sh $TARGET"
