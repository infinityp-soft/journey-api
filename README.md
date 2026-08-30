# Journey Education Admin CMS — API

NestJS + **Prisma** + PostgreSQL backend for the Journey Education Admin CMS.
Bilingual (EN/TH) content, image storage on RustFS or a mounted volume, JWT auth
(access + refresh), CASL roles (Admin / Editor / Viewer), and **Swagger** docs.

## Stack

- **NestJS 10** · **Prisma 5** · **PostgreSQL 15+**
- **@nestjs/swagger** — OpenAPI UI at `/api/docs`
- **@casl/ability** — role permissions (see `src/auth/casl`)
- **@nestjs/jwt** + **passport-jwt** — access + rotating refresh tokens
- **Multer + sharp** — uploads → WebP; metadata in `media_assets`
- **@aws-sdk/client-s3** — RustFS (S3-compatible) object storage
- **@nestjs/schedule** — nightly GC of unreferenced media

## Getting started

```bash
cp .env.example .env          # set DATABASE_URL + JWT secrets
npm install                   # also runs prisma generate (postinstall)

npm run migrate:up            # apply all pending UP migrations
npm run seed                  # bootstrap admin + singleton rows
npm run start:dev
```

Swagger UI: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

Or with Docker (migrate is **not** on boot — run it yourself):

```bash
docker compose up --build
docker compose run --rm --no-deps api npx prisma migrate deploy
```

**Ubuntu production** (API + PostgreSQL + RustFS behind Nginx):
- Docker Compose: [`deploy/README.md`](./deploy/README.md)
- ไม่ใช้ Docker: [`deploy/native/README.md`](./deploy/native/README.md)

## Migrations (up / down)

Prisma Migrate is forward-only. Each migration folder has an explicit pair:

```
prisma/migrations/<timestamp>_<name>/
  migration.sql   ← UP
  down.sql        ← DOWN
```

| Command | Step |
|---|---|
| `npm run migrate:up` | Apply pending `migration.sql` files |
| `npm run migrate:down` | Run latest `down.sql`, remove `_prisma_migrations` row |
| `npm run migrate:down -- --steps=2` | Roll back last N migrations |
| `npm run migrate:new -- --name foo` | Scaffold a new migration (edit SQL, then add `down.sql`) |
| `npm run migrate:dev` | Create + apply in development |
| `npm run migrate:reset` | Drop DB, re-apply all ups, seed (dev only) |

Details: `prisma/migrations/README.md`.

## Authentication

- `POST /api/auth/login` → `{ accessToken, refreshToken, user }`
- `POST /api/auth/refresh` → rotates tokens
- `POST /api/auth/logout` → revokes refresh token
- `GET  /api/auth/me` → current profile

Send `Authorization: Bearer <accessToken>`. Global `JwtAuthGuard`; public routes use `@Public()`.

## Authorization (CASL)

- **admin** — `manage all`
- **editor** — full content CRUD + publish; cannot manage users / site settings
- **viewer** — read-only + update own account

## Media

`POST /api/media-assets` (multipart field `file`) → sharp WebP →
`yyyy/mm/dd/{uuid}.webp` → `media_assets` row. Business DTOs take `*Id` FKs.
Every image is served at `PUBLIC_MEDIA_URL` (`/media/{storageKey}`) regardless of
where the bytes live, so switching drivers never changes a stored URL.

`MEDIA_DRIVER` picks the backing store:

| Driver | Where bytes go | Needs |
|---|---|---|
| `local` (default) | `$UPLOAD_DIR/yyyy/mm/dd/{uuid}.webp` | a mounted volume |
| `rustfs` | `RUSTFS_BUCKET` on an S3-compatible RustFS server | `RUSTFS_*` vars |

RustFS speaks S3, so the driver is the plain AWS SDK pointed at
`RUSTFS_ENDPOINT` with path-style addressing. The bucket is created on the first
upload — the API boots fine while RustFS is still starting. `docker compose up`
runs RustFS alongside the API (S3 API on `:9000`, console on `:9001`).

## Modules → routes

| Module | Base route |
|---|---|
| Auth | `/api/auth` |
| Users | `/api/users` |
| Media | `/api/media-assets`, files at `/media` |
| Dashboard | `/api/dashboard/summary` |
| Activity logs | `/api/activity-logs` |
| Banners | `/api/banners` |
| About Us | `/api/about-us` (+ `/highlights`) |
| Staff | `/api/staff` |
| Destinations | `/api/destinations` |
| Articles | `/api/articles`, `/api/article-categories` |
| Visa | `/api/visa-services` |
| Testimonials | `/api/testimonials` |
| Videos | `/api/videos` (+ `/page-settings`) |
| Events | `/api/events` (+ `/:id/registrations`) |
| Leads | `/api/leads` (+ public `/submit`) |
| Settings | `/api/settings` (+ `/social-links`, `/pre-footer-highlights`) |

### List query parameters

Every list endpoint accepts `page`, `limit`, `sort`, `order`, `search`, plus
`dateFrom` / `dateTo` (a bare `YYYY-MM-DD` upper bound covers the whole day).
Modules add their own equality filters on top:

| Endpoint | Extra filters |
|---|---|
| `/api/users` | `role`, `isActive` |
| `/api/banners` | `isActive` |
| `/api/staff` | `status`, `isVisible` |
| `/api/destinations` | `status` |
| `/api/articles` | `status`, `categoryId`, `isVisible` |
| `/api/visa-services` | `status`, `country` |
| `/api/testimonials` | `status`, `isFeatured`, `counselorId` |
| `/api/videos` | `status` |
| `/api/events` | `status`, `format` (dates apply to `eventStartAt`) |
| `/api/leads` | `status`, `topic` (dates apply to `submittedAt`) |

Schema source of truth: `prisma/schema.prisma`.  
ER diagram: [`prisma/ERD.md`](./prisma/ERD.md).
