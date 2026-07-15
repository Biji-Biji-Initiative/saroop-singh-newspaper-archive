# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS dependencies

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

COPY saroop-singh-archive/packages/web/package.json saroop-singh-archive/packages/web/package-lock.json ./
RUN npm ci

FROM dependencies AS builder

ARG NEXT_PUBLIC_SITE_ORIGIN=https://saroop.mereka.dev
ENV NEXT_PUBLIC_SITE_ORIGIN=${NEXT_PUBLIC_SITE_ORIGIN} \
    ARCHIVE_DATA_DIR=/tmp/saroop-archive-build

COPY saroop-singh-archive/packages/web ./
RUN npm run build

FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    ARCHIVE_DATA_DIR=/data \
    NEXT_PUBLIC_SITE_ORIGIN=https://saroop.mereka.dev \
    ARCHIVE_PUBLIC_ORIGIN=https://saroop.mereka.dev

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl gosu \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs --home-dir /app nextjs

WORKDIR /app

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/content ./content
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN mkdir -p /data \
  && chown nextjs:nodejs /data \
  && chmod 755 /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
