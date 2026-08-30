# Deploy บน Ubuntu โดยไม่ใช้ Docker Compose

มี 3 ทาง เลือก **ทางที่ 1** ถ้าไม่อยากใช้ Docker เลย

| ทาง | วิธี | เหมาะเมื่อ |
|---|---|---|
| **1. Native + systemd** (แนะนำ) | Postgres จาก `apt`, Node + systemd, RustFS binary + systemd, Nginx | VPS เครื่องเดียว ไม่ใช้ Docker |
| 2. Docker แต่ไม่ใช้ Compose | `docker run` ทีละ container | ยังอยากได้ container แต่ไม่ใช้ไฟล์ compose |
| 3. PM2 แทน systemd สำหรับ API | เหมือนทาง 1 แต่รัน Node ด้วย PM2 | คุ้น PM2 อยู่แล้ว |

ด้านล่างคือทางที่ 1 ครบชุด ไฟล์อยู่ในโฟลเดอร์นี้

```
Internet → Nginx :80/:443 → node dist/main.js :3000
                              ├── PostgreSQL 127.0.0.1:5432
                              └── RustFS     127.0.0.1:9000
```

Postgres กับ RustFS ฟังแค่ localhost ไม่เปิดออกเน็ต

---

## 1. แพ็กเกจพื้นฐาน

Ubuntu 22.04 / 24.04

```bash
sudo apt-get update
sudo apt-get install -y curl git build-essential nginx certbot python3-certbot-nginx \
  postgresql postgresql-contrib
```

Node 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # v20.x
```

Firewall — เปิดแค่ SSH / HTTP / HTTPS:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

อย่าเปิดพอร์ต 3000, 5432, 9000

---

## 2. PostgreSQL

```bash
sudo -u postgres psql <<'SQL'
CREATE USER journey WITH PASSWORD 'CHANGE_ME_DB_PASSWORD';
CREATE DATABASE journey OWNER journey;
GRANT ALL PRIVILEGES ON DATABASE journey TO journey;
SQL
```

ให้ Postgres ฟังแค่เครื่องตัวเอง (`/etc/postgresql/*/main/postgresql.conf`):

```
listen_addresses = 'localhost'
```

แล้ว `sudo systemctl restart postgresql`

ทดสอบ:

```bash
psql "postgresql://journey:CHANGE_ME_DB_PASSWORD@127.0.0.1:5432/journey" -c 'select 1'
```

---

## 3. RustFS (binary + systemd)

สร้าง user และโฟลเดอร์ข้อมูล:

```bash
sudo useradd --system --home /var/lib/rustfs --shell /usr/sbin/nologin rustfs
sudo mkdir -p /data/rustfs0 /var/log/rustfs
```

ดาวน์โหลด binary (เลือก amd64 หรือ arm64 ตามเครื่อง):

```bash
# ดูรีลีสล่าสุด: https://github.com/rustfs/rustfs/releases
ARCH=x86_64   # หรือ aarch64
curl -fsSL -o /tmp/rustfs "https://dl.rustfs.com/artifacts/rustfs/release/rustfs-linux-${ARCH}-musl-latest"
sudo install -m 0755 /tmp/rustfs /usr/local/bin/rustfs
```

ถ้า URL รีลีสเปลี่ยน ให้โหลดจาก [GitHub Releases](https://github.com/rustfs/rustfs/releases) แล้ว `sudo install` เหมือนกัน

คัดลอก env + unit:

```bash
sudo cp deploy/native/rustfs.env /etc/default/rustfs
sudo nano /etc/default/rustfs          # ใส่ RUSTFS_SECRET_KEY จริง
sudo cp deploy/native/systemd/rustfs.service /etc/systemd/system/rustfs.service
sudo chown -R rustfs:rustfs /data/rustfs0 /var/log/rustfs
sudo chmod 750 /data/rustfs0 /var/log/rustfs
sudo systemctl daemon-reload
sudo systemctl enable --now rustfs
sudo systemctl status rustfs
```

RustFS ฟังที่ `127.0.0.1:9000` เท่านั้น (ดู `RUSTFS_ADDRESS` ใน `rustfs.env`)

---

## 4. Nest API

```bash
sudo useradd --system --home /opt/journey --shell /usr/sbin/nologin journey
sudo mkdir -p /opt/journey /etc/journey
sudo chown journey:journey /opt/journey

# clone หรือ rsync โค้ด
sudo git clone <your-repo> /opt/journey
# หรือจากเครื่อง dev: rsync -av --exclude node_modules --exclude .git ./ journey@server:/opt/journey/

cd /opt/journey
sudo -u journey npm ci
sudo -u journey npx prisma generate
sudo -u journey npm run build

sudo cp deploy/native/journey-api.env /etc/journey/api.env
sudo nano /etc/journey/api.env
# ตั้ง DATABASE_URL, JWT_*, RUSTFS_SECRET_KEY, PUBLIC_MEDIA_URL ให้ตรงโดเมน
sudo chmod 640 /etc/journey/api.env
sudo chown root:journey /etc/journey/api.env

sudo -u journey --preserve-env=DATABASE_URL \
  env $(grep -v '^#' /etc/journey/api.env | xargs) npx prisma migrate deploy
sudo -u journey --preserve-env=DATABASE_URL \
  env $(grep -v '^#' /etc/journey/api.env | xargs) npx prisma db seed

sudo cp deploy/native/systemd/journey-api.service /etc/systemd/system/journey-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now journey-api
sudo systemctl status journey-api
```

API ฟังที่ `127.0.0.1:3000` (หรือทุก interface ก็ได้ เพราะ Nginx บังหน้า — ถ้าจะล็อกให้แก้ `PORT` + bind ใน Nest ถ้าจำเป็น)

อัปเดตรอบถัดไป:

```bash
cd /opt/journey
sudo -u journey git pull
sudo -u journey npm ci
sudo -u journey npm run build
sudo systemctl restart journey-api
```

---

## 5. Nginx + HTTPS

```bash
sudo cp deploy/native/nginx/journey-api.conf /etc/nginx/sites-available/journey-api
sudo nano /etc/nginx/sites-available/journey-api   # เปลี่ยน server_name
sudo ln -sf /etc/nginx/sites-available/journey-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# DNS A ของ api.example.com ชี้มาที่เครื่องนี้แล้ว
sudo certbot --nginx -d api.example.com
```

ตั้ง `PUBLIC_MEDIA_URL=https://api.example.com/media` ใน `/etc/journey/api.env` แล้ว

```bash
sudo systemctl restart journey-api
```

Swagger: `https://api.example.com/api/docs`

---

## 6. คำสั่งดูแล

```bash
sudo systemctl status postgresql rustfs journey-api nginx
sudo journalctl -u journey-api -f
sudo journalctl -u rustfs -f

# สำรอง
sudo -u postgres pg_dump journey > journey-$(date +%F).sql
sudo tar -C /data -czf rustfs-$(date +%F).tgz rustfs0
```

สำรอง **ทั้ง DB และ `/data/rustfs0`** คู่กัน

---

## ทางเลือกอื่นสั้นๆ

### Docker โดยไม่ใช้ Compose

รันทีละตัว (`docker network create journey` แล้ว `docker run` postgres / rustfs / api / nginx) งานซ้ำกับ Compose แต่ยาวกว่า ไม่แนะนำยกเว้นมีข้อจำกัดเรื่อง Compose

### PM2 แทน systemd สำหรับ API

```bash
sudo npm i -g pm2
cd /opt/journey
sudo -u journey pm2 start dist/main.js --name journey-api
sudo pm2 startup systemd
sudo pm2 save
```

Postgres / RustFS / Nginx ยังใช้ systemd เหมือนเดิม
