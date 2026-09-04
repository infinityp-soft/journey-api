# Deploy — Ubuntu + Docker (ยังไม่ใช้โดเมน)

Build บนเซิร์ฟเวอร์เอง ไม่ต้องใช้ container registry ไม่ต้องมี CI ค่าใช้จ่ายนอกจาก VPS คือ 0

```
Internet → web :8080  (ตั้งค่าที่ HTTP_PORT ใน .env, container :3002)
             ├── Next.js pages
             ├── /api  /media  (rewrite ใน next.config) → api :3000
             │
             api ── db     (volume pgdata)
             api ── rustfs (volume rustfs)
```

URL ที่ฝังลง frontend bundle เป็น **relative path** (`/api`, `/media`)
เปลี่ยน IP หรือพอร์ตได้โดยไม่ต้อง rebuild image

---

## โครงบนเซิร์ฟเวอร์

```
/opt/journey/
  journey-api/        ← ซอร์ส backend
  jourey-web-admin/   ← ซอร์ส frontend
  deploy/             ← docker-compose.yml + .env + สคริปต์
```

`docker compose` ต้องรันจาก `/opt/journey/deploy` เสมอ เพราะ build context ชี้ไปที่ `../journey-api`
และ `../jourey-web-admin`

### ไฟล์ในโฟลเดอร์นี้

| ไฟล์ | หน้าที่ |
|---|---|
| `docker-compose.yml` | นิยาม 4 service — api / web / db / rustfs |
| `.env.example` | เทมเพลตของ `.env` (`.env` ตัวจริงไม่อยู่ใน git) |
| `upload.ps1` | ส่งซอร์สจาก Windows ขึ้นเซิร์ฟเวอร์ (รันที่เครื่อง dev) |
| `deploy.sh` | build + สลับ container โดยไม่แตะฐานข้อมูล |
| `migrate.sh` | `prisma migrate deploy` |
| `seed.sh` | สร้าง super admin ครั้งแรก |
| `native/` | ทางเลือกติดตั้งแบบ systemd ไม่ใช้ Docker (ไม่ได้ใช้กับคู่มือนี้) |

---

## ครั้งแรก

### 1. ติดตั้ง Docker

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER && newgrp docker
docker --version
```

### 2. Swap (ข้ามได้ถ้า RAM ≥ 4GB)

`next build` กิน RAM หนัก ถ้าไม่มี swap จะโดน OOM kill กลางคัน

```bash
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

### 3. Firewall

รันทีละบรรทัด และต้องใช้ `--force` ที่บรรทัดสุดท้าย ไม่งั้น `ufw` จะถามยืนยันแล้วไปดูด
บรรทัดถัดไปมาเป็นคำตอบจน crash

```bash
sudo ufw allow 22
sudo ufw allow 8080          # ต้องตรงกับ HTTP_PORT ใน .env
sudo ufw --force enable
sudo ufw status verbose
```

อย่าเปิด 3000 / 5432 / 9000 — เปิดแค่ HTTP_PORT ของ web (ค่าเริ่มต้น 8080)

ถ้าเครื่องมีบริการอื่นถือพอร์ต 80 อยู่ (เช็คด้วย `sudo ss -lptn 'sport = :80'`)
ให้คง `HTTP_PORT=8080` ไว้ ถ้าเครื่องว่างจะตั้งเป็น `80` แล้ว `ufw allow 80` แทนก็ได้
เพราะ URL ทั้งหมดเป็น relative path การเปลี่ยนพอร์ตจึงไม่ต้อง rebuild

### 4. ตั้ง SSH key (แนะนำ แต่ข้ามได้)

`upload.ps1` เชื่อมต่อ 2 ครั้งต่อรอบ (scp + ssh) ถ้าไม่ตั้ง key จะต้องพิมพ์รหัสผ่านสองหน
รันที่ **เครื่อง Windows**

```powershell
ssh-keygen -t ed25519 -C journey-deploy
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh root@<IP> "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### 5. ส่งซอร์สขึ้นเซิร์ฟเวอร์

**ทางที่ 1 — `upload.ps1` จากเครื่อง Windows (ไม่ต้องมี git บนเซิร์ฟเวอร์)**

```powershell
cd D:\journey\journey-api\deploy
.\upload.ps1 -Server root@<IP>
```

สคริปต์จะบีบไฟล์โดยตัด `node_modules` / `.next` / `dist` / `.git` ออก (เหลือราว 1 MB)
แล้ว scp ขึ้น `/tmp` → แตกไฟล์ที่ `/opt/journey` → คัดลอกโฟลเดอร์ `deploy/` ไปวางให้อัตโนมัติ
ไฟล์ `.env` บนเซิร์ฟเวอร์ไม่ถูกทับ เพราะไม่ได้อยู่ในซอร์ส

**ทางที่ 2 — git clone บนเซิร์ฟเวอร์**

```bash
sudo mkdir -p /opt/journey && sudo chown $USER:$USER /opt/journey
cd /opt/journey
git clone <api-repo-url> journey-api
git clone <web-repo-url> jourey-web-admin
cp -r journey-api/deploy ./deploy
```

**ทางที่ 3 — WinSCP / FileZilla** ลากไฟล์เอง ขอแค่ได้ผลลัพธ์ตามผังในหัวข้อ
"โครงบนเซิร์ฟเวอร์" และอย่าลาก `node_modules` ขึ้นไปด้วย

ตรวจก่อนไปต่อ

```bash
ls -1 /opt/journey          # ต้องมี 3 โฟลเดอร์
ls -1 /opt/journey/deploy   # ต้องมี docker-compose.yml
```

### 6. ตั้งค่า + ขึ้นระบบ

```bash
cd /opt/journey/deploy
cp .env.example .env
nano .env
```

กรอกทุกช่องที่เขียนว่า `CHANGE_ME` สร้าง secret ด้วย `openssl rand -hex 32`

```bash
docker compose up -d --build --remove-orphans   # ครั้งแรก 5-15 นาที
sh migrate.sh                  # สร้าง schema — API ไม่ migrate ตอนสตาร์ท
sh seed.sh                     # สร้าง super admin
docker compose ps              # api / web ต้องขึ้น healthy
```

เปิด `http://<IP>:8080/th/login` → login ด้วยค่า `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
ที่ตั้งไว้ใน `.env`

Swagger อยู่ที่ `http://<IP>:8080/api/docs`

---

## อัปโค้ดครั้งต่อไป

### ที่เครื่อง dev (Windows)

```powershell
cd D:\journey\journey-api\deploy
.\upload.ps1 -Server root@<IP>              # ทั้งคู่ (ค่าเริ่มต้น)
.\upload.ps1 -Server root@<IP> -Target api  # เฉพาะ backend
.\upload.ps1 -Server root@<IP> -Target web  # เฉพาะ frontend
```

> `-Target web` อัปโหลดแค่โฟลเดอร์ `jourey-web-admin` ซึ่งแปลว่าไฟล์ใน `deploy/`
> (compose, สคริปต์) จะไม่ถูก sync เพราะมันอยู่ใน repo `journey-api`
> รอบไหนแก้ `docker-compose.yml` ให้ใช้ `-Target api` หรือไม่ใส่ `-Target` เลย

ข้ามขั้นนี้ได้ถ้าใช้ git บนเซิร์ฟเวอร์ — `deploy.sh` จะ `git pull` ให้เองถ้าโฟลเดอร์นั้นเป็น git repo
ถ้าไม่ใช่ก็ข้ามไป build เลย

### ที่เซิร์ฟเวอร์

| ทำอะไร | คำสั่ง | แตะ DB ไหม |
|---|---|---|
| อัปทั้งคู่ | `sh deploy.sh` | ไม่ |
| อัปเฉพาะ backend | `sh deploy.sh api` | ไม่ |
| อัปเฉพาะ frontend | `sh deploy.sh web` | ไม่ |
| รัน migration | `sh migrate.sh` | ใช่ (schema เท่านั้น ไม่ลบข้อมูล) |

`deploy.sh` ใช้ `up -d --no-deps` ซึ่งเป็นตัวการันตีว่า container `db` และ `rustfs`
ไม่ถูก recreate ข้อมูลในฐานและไฟล์อัปโหลดจึงอยู่ครบทุกรอบ

มี migration ใหม่ให้รัน `sh migrate.sh` **ก่อน** `sh deploy.sh api` เสมอ

อย่าใช้ `prisma migrate reset` บนโปรดักชัน — มันดรอปทั้งฐาน

---

## คำสั่งที่ใช้บ่อย

รันจาก `/opt/journey/deploy` ทั้งหมด

```bash
docker compose ps                    # สถานะ + health
docker compose logs -f api           # log สด (web / db ก็ได้)
docker compose logs --tail 200 web
docker compose restart api           # รีสตาร์ทเฉย ๆ ไม่ build ใหม่
docker stats --no-stream             # ดู RAM/CPU ที่ใช้จริง
docker compose exec db psql -U journey -d journey   # เข้า psql
```

### สำรอง / กู้คืนฐานข้อมูล

```bash
# backup
docker compose exec -T db pg_dump -U journey journey | gzip > ~/journey-$(date +%F).sql.gz

# restore
gunzip -c ~/journey-2026-08-30.sql.gz | docker compose exec -T db psql -U journey -d journey
```

ไฟล์รูปอยู่ใน Docker volume `journey_rustfs` สำรองด้วย

```bash
docker run --rm -v journey_rustfs:/data -v ~:/backup alpine tar -czf /backup/rustfs-$(date +%F).tar.gz -C /data .
```

---

## ทางเลือก: build ที่เครื่อง dev แล้วส่ง image ขึ้นไป

ใช้เมื่อเซิร์ฟเวอร์ RAM น้อยจน `next build` ไม่ผ่านแม้เพิ่ม swap แล้ว

```powershell
# ที่เครื่อง dev (ต้องมี Docker Desktop)
cd D:\journey
docker build -t journey-api:latest ./journey-api
docker build -t journey-web:latest ./jourey-web-admin
docker save journey-api:latest journey-web:latest -o journey-images.tar
scp journey-images.tar root@<IP>:/tmp/
```

```bash
# ที่เซิร์ฟเวอร์
docker load -i /tmp/journey-images.tar && rm /tmp/journey-images.tar
```

แล้วแก้ `docker-compose.yml` เปลี่ยน `build:` เป็น `image: journey-api:latest` และ
`image: journey-web:latest` จากนั้น `docker compose up -d` โดยไม่ต้องมีซอร์สบนเซิร์ฟเวอร์เลย

ไฟล์จะใหญ่ราว 1-2 GB ต่อรอบ และถ้าเซิร์ฟเวอร์เป็น ARM64 แต่เครื่อง dev เป็น x86
ต้อง build ด้วย `docker build --platform linux/arm64 ...` ไม่งั้น image รันไม่ได้

---

## ถ้าเซิร์ฟเวอร์เป็น ARM64

เช็คด้วย `uname -m` — ถ้าได้ `aarch64` แล้ว `docker compose up` ฟ้อง
`no matching manifest for linux/arm64` แปลว่า image ของ `rustfs` ไม่มี build สำหรับ ARM
ให้สลับ API ไปเก็บไฟล์ลงดิสก์แทน โดยใน service `api` ของ `docker-compose.yml`

```yaml
      MEDIA_DRIVER: local
      UPLOAD_DIR: /data/uploads
    volumes:
      - uploads:/data/uploads
```

เพิ่ม `uploads:` ใน `volumes:` ท้ายไฟล์ แล้วลบ service `rustfs` กับ `depends_on` ที่ชี้ไปหามัน
โค้ด API รองรับ driver นี้อยู่แล้วไม่ต้องแก้อะไร ส่วน Node images มี arm64 ครบทุกตัว

---

## ความปลอดภัยระหว่างยังเป็น HTTP

รหัสผ่านและ JWT วิ่งเป็น cleartext เลือกทำอย่างใดอย่างหนึ่ง

- จำกัด IP: `sudo ufw allow from <IP ออฟฟิศ> to any port 8080` แล้วลบ rule เปิด 8080 ทั่วไปทิ้ง
- หรือไม่เปิดพอร์ตออกเน็ตเลย แล้วเข้าผ่าน SSH tunnel
  `ssh -L 8080:localhost:8080 root@<IP>` → เปิด `http://localhost:8080`

---

## เพิ่มโดเมน + HTTPS ภายหลัง

ตอนนี้ stack ไม่มี reverse proxy — web ฟัง HTTP ที่ `HTTP_PORT` โดยตรง
ถ้าจะใส่โดเมน/TLS ภายหลัง ให้วาง Caddy หรือ Cloudflare Tunnel หน้า web
แล้วส่ง `X-Forwarded-Proto: https` มาด้วย `secure` cookie จะเปิดเอง

ยังไม่อยากจดโดเมนแต่อยากได้ HTTPS มี DuckDNS หรือ Tailscale Funnel
(ได้ hostname `*.ts.net` พร้อม cert แท้ ไม่ต้องเปิดพอร์ตออกเน็ต)

---

## Troubleshooting

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| `ufw enable` แล้ว python traceback | มันถามยืนยันแล้วดูดบรรทัดถัดไปมาตอบ — ใช้ `sudo ufw --force enable` และรันทีละบรรทัด |
| build web โดน `Killed` | RAM ไม่พอ — เพิ่ม swap (ข้อ 2) หรือใช้ท่าส่ง image tar |
| login แล้วเด้งกลับหน้า login | cookie `secure` เปิดบน HTTP — ต้องไม่มี proxy ส่ง `X-Forwarded-Proto: https` มา |
| รูปไม่ขึ้น | `PUBLIC_MEDIA_URL` ต้องเป็น `/media` และ `INTERNAL_API_URL` ต้องถูกใส่ตอน `next build` เพื่อให้ rewrite `/media` ไป api |
| `Invalid Server Actions request` / host ไม่ตรง origin | เข้าผ่านพอร์ตที่ browser ใส่ใน Origin — อย่ามี proxy ตัดพอร์ตออกจาก Host |
| `pnpm install --frozen-lockfile` fail | `pnpm-lock.yaml` ไม่ตรงกับ `package.json` — รัน `pnpm install` ที่เครื่อง dev แล้ว commit ก่อน |
| web crash-loop `Cannot find module @swc/helpers` | standalone tracing ตาม symlink ของ pnpm ไม่เจอ — Dockerfile ตั้ง `node-linker=hoisted` แก้ไว้แล้ว ถ้ายังเจอให้ build ด้วย `--no-cache` |
| `prisma migrate deploy` หา binary ไม่เจอ | image เก่า — `docker compose build api` ใหม่ (Dockerfile pin prisma CLI ไว้แล้ว) |
| อัปโหลดไฟล์ใหญ่แล้ว 413 | `MAX_UPLOAD_MB` ฝั่ง API และ `proxyClientMaxBodySize` ใน `next.config.mjs` |
| สคริปต์ `.sh` ฟ้อง `\r` | ไฟล์โดนแปลงเป็น CRLF — มี `.gitattributes` บังคับ `eol=lf` ไว้แล้ว ถ้ายังเจอให้รัน `sed -i 's/\r$//' *.sh` |
