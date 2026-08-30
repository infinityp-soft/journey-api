# Deploy: Docker + Nginx (ไม่ต้องวางซอร์สบน Ubuntu)

บนเซิร์ฟเวอร์มีแค่โฟลเดอร์ `deploy/` คือ:

```
/opt/journey/
  docker-compose.yml
  .env
  nginx/
  redeploy.sh
  migrate.sh
```

ไม่มี `src/` — โค้ดอยู่ใน image ที่ pull มา

```
Internet → Nginx :80/:443
              ├── /api  /media  → api :3000
              └── /             → api (ชั่วคราว) หรือ web :80 เมื่อมี FE
                    api ── db (volume pgdata)
                    api ── rustfs (volume rustfs)
```

---

## คำสั่งที่ใช้บ่อย

| ทำอะไร | คำสั่ง | แตะ DB ไหม |
|---|---|---|
| อัป backend ล่าสุด | `sh redeploy.sh` | ไม่ |
| อัป frontend | `sh redeploy.sh web` | ไม่ |
| รัน migration | `sh migrate.sh` | ใช่ (schema อย่างเดียว ไม่ลบข้อมูล) |

`redeploy.sh` ใช้ `--no-deps` — ไม่ recreate `db` / `rustfs` / volume

---

## ครั้งแรก: build image (เครื่อง dev / CI)

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USER --password-stdin
docker build -t ghcr.io/YOUR_GITHUB_USER/journey-api:latest .
docker push ghcr.io/YOUR_GITHUB_USER/journey-api:latest
```

---

## ครั้งแรก: บน Ubuntu

ติด Docker อย่างเดียว แล้วคัดลอกโฟลเดอร์ `deploy/` ไป `/opt/journey`

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER
```

```bash
cd /opt/journey
cp .env.example .env
nano .env          # API_IMAGE, DOMAIN, PUBLIC_ORIGIN, secrets
docker compose pull
docker compose up -d
sh migrate.sh      # ครั้งแรกต้องรัน — API ไม่ migrate ตอนสตาร์ท
docker compose exec api npx prisma db seed
```

เปิด `http://IP/api/docs` (พอร์ต 80)  
UFW เปิด **22, 80, 443** — อย่าเปิด 3000 / 5432 / 9000

---

## อัปโค้ด backend (ไม่แตะ database)

ที่เครื่อง:

```bash
docker build -t ghcr.io/YOUR_GITHUB_USER/journey-api:latest .
docker push ghcr.io/YOUR_GITHUB_USER/journey-api:latest
```

ที่ Ubuntu:

```bash
cd /opt/journey
sh redeploy.sh
```

เท่ากับ `docker compose pull api && docker compose up -d --no-deps api`  
container `db` / `rustfs` และ volume ข้อมูลไม่ถูกแตะ

---

## Database migrate (แยก)

รันเมื่อมีไฟล์ migration ใหม่ใน image เท่านั้น

```bash
cd /opt/journey
sh migrate.sh
```

ลำดับที่ปลอดภัยถ้า schema เปลี่ยน:

1. `sh migrate.sh` — ใส่คอลัมน์/ตารางใหม่ (ข้อมูลเดิมอยู่)
2. `sh redeploy.sh` — สลับ API ไป image ใหม่

อย่าใช้ `prisma migrate reset` บนโปรดักชัน — มันดรอปทั้งฐาน

---

## เมื่อมี Frontend

1. Build/push image FE ที่ฟังพอร์ต **80** ใน container
2. ใน `.env` ตั้ง `WEB_IMAGE=ghcr.io/YOU/journey-web:latest`
3. สลับ Nginx ให้ `/` ไปที่ `web`:

```bash
cd /opt/journey
cp nginx/conf.d/frontend.conf.example nginx/conf.d/default.conf
docker compose --profile frontend pull web
docker compose --profile frontend up -d
docker compose exec nginx nginx -s reload
```

จากนั้น:

- อัป FE: `sh redeploy.sh web`
- อัป API: `sh redeploy.sh` (ยังไม่แตะ DB)

`/api` กับ `/media` ยังไป backend เหมือนเดิม

---

## HTTPS (Let's Encrypt)

ชี้ DNS `A` ของ `DOMAIN` มาที่เซิร์ฟเวอร์ก่อน

```bash
cd /opt/journey
docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  -d api.example.com \
  --email you@example.com \
  --agree-tos --no-eff-email

cp nginx/conf.d/ssl.conf.example nginx/conf.d/ssl.conf
nano nginx/conf.d/ssl.conf

rm nginx/conf.d/default.conf
docker compose exec nginx nginx -s reload
```

ใน `.env` ตั้ง `PUBLIC_ORIGIN=https://api.example.com` แล้ว `docker compose up -d --no-deps api`  
มี FE แล้วใน `ssl.conf` เปลี่ยน `location /` เป็น `proxy_pass http://journey_web_ssl;`

container `certbot` ต่ออายุใบรับรองให้เอง

---

## อยู่บนเซิร์ฟเวอร์ vs ไม่ต้องอยู่

| อยู่ | ไม่ต้องอยู่ |
|---|---|
| `docker-compose.yml` `.env` `nginx/` | `src/` ทั้งโปรเจกต์ |
| Docker volumes | `npm install` |
