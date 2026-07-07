# bookworm-slim (glibc): better-sqlite3 ships prebuilds for linux/arm64; Alpine (musl) cannot use them.
FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY public ./public
COPY server ./server
COPY shared ./shared

RUN mkdir -p data/characters

EXPOSE 3000

CMD ["node", "server/index.js"]
