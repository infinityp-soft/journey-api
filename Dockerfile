# ---- build ----
FROM node:20-bookworm-slim AS build
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

# ---- runtime ----
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY prisma ./prisma
# prisma / ts-node are devDependencies, but `migrate deploy` and `db seed` need
# them at runtime — pin them here so npx cannot pull a mismatched version.
RUN npm ci --omit=dev \
 && npm install --no-save prisma@^5.20.0 ts-node@^10.9.2 typescript@^5.5.4 \
 && npx prisma generate
COPY --from=build /app/dist ./dist
COPY scripts ./scripts
RUN mkdir -p /data/uploads
ENV UPLOAD_DIR=/data/uploads
EXPOSE 3000
# Migrate is not on boot — run `deploy/migrate.sh` on the server when you want it
CMD ["node", "dist/main.js"]
