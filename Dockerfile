# syntax=docker/dockerfile:1

FROM node:20.19.5-alpine AS dependencies

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app/saroop-singh-archive/packages/web

COPY saroop-singh-archive/packages/web/package.json saroop-singh-archive/packages/web/package-lock.json ./
RUN npm ci

FROM dependencies AS builder

WORKDIR /app/saroop-singh-archive

COPY saroop-singh-archive/packages/web ./packages/web
COPY saroop-singh-archive/content ./content

WORKDIR /app/saroop-singh-archive/packages/web
RUN npm run build
RUN npm prune --omit=dev

FROM node:20.19.5-alpine AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    ARCHIVE_DATA_DIR=/data \
    ARCHIVE_CONTENT_DIR=/app/saroop-singh-archive/content/articles/published

RUN apk add --no-cache curl su-exec \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs

WORKDIR /app/saroop-singh-archive/packages/web

COPY --from=builder --chown=nextjs:nodejs /app/saroop-singh-archive/packages/web/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/saroop-singh-archive/packages/web/package-lock.json ./package-lock.json
COPY --from=builder --chown=nextjs:nodejs /app/saroop-singh-archive/packages/web/next.config.js ./next.config.js
COPY --from=builder --chown=nextjs:nodejs /app/saroop-singh-archive/packages/web/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/saroop-singh-archive/packages/web/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/saroop-singh-archive/packages/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/saroop-singh-archive/content /app/saroop-singh-archive/content

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN mkdir -p /data \
  && chown nextjs:nodejs /data \
  && chmod 755 /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q -T 4 -O /dev/null http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start", "--", "-H", "0.0.0.0", "-p", "3000"]
