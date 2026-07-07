# Multi-stage: better-sqlite3 often has no prebuild for linux/arm64 + current Node; compile in builder.
FROM node:20-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY public ./public
COPY server ./server
COPY shared ./shared

RUN mkdir -p data/characters

EXPOSE 3000

CMD ["node", "server/index.js"]
