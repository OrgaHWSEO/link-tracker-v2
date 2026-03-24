# ─── Stage 1 : Build ────────────────────────────────────────────────────────
FROM node:20-slim AS builder

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# 1024 MB : playwright modules sont volumineux, 512 MB causait des OOM
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN npm run build


# ─── Stage 2 : Runtime ──────────────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Dossier fixe pour les binaires Playwright (lisible par l'utilisateur nextjs)
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Dépendances système pour Chromium headless
RUN apt-get update -y && apt-get install -y \
    openssl \
    ca-certificates \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libglib2.0-0 \
    libxcb1 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Copie node_modules depuis le builder (contient playwright-extra)
COPY --from=builder /app/node_modules ./node_modules

# Installe le binaire Chromium dans /ms-playwright (en root, avant useradd)
RUN node_modules/.bin/playwright install chromium && \
    chmod -R 755 /ms-playwright

# Utilisateur non-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/docker-entrypoint.js ./docker-entrypoint.js

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "docker-entrypoint.js"]
