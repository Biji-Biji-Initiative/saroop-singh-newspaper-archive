# Saroop Singh Archive — Coolify deployment guide

## Production target

The archive is deployed as a single Dockerized Next.js service on Coolify.
Its intended public domain is `https://saroop.mereka.dev`.

Vercel is not part of the supported deployment path. The repository-root
`Dockerfile` builds the active `packages/web` application together with the
published archive content; Coolify should use that Dockerfile with port `3000`.

## Before the first deploy

1. Run the web build from the checked-out commit:

   ```bash
   cd packages/web
   npm ci
   npm run build
   ```

2. Create a Coolify application from the public Git repository. Use the
   repository root as build context and `Dockerfile` as the build pack input.
3. Set the internal port to `3000`. Do not add a second proxy, custom Nginx
   configuration, or a separate restoration service.
4. Attach one persistent volume at `/data`. This volume owns restoration
   sessions and gallery submissions; it must survive redeploys and rollbacks.
5. Add `saroop.mereka.dev` in Coolify, then create a DNS-only `A` record for
   that hostname pointing at the active Coolify ingress. Wait for Coolify’s
   TLS certificate to become active before treating the domain as live.

## Runtime variables

Set these values through Infisical and Coolify’s runtime-environment UI. Never
commit them to the repository or configure them as build-time variables.

| Variable                         | Setting                                                  |
| -------------------------------- | -------------------------------------------------------- |
| `NODE_ENV`                       | `production`                                             |
| `ARCHIVE_DATA_DIR`               | `/data`                                                  |
| `ARCHIVE_PUBLIC_ORIGIN`          | `https://saroop.mereka.dev`; used for browser origin checks behind the TLS proxy |
| `GEMINI_API_KEY`                 | Dedicated server-side Gemini credential                  |
| `GEMINI_MODEL`                   | Optional image-capable model override                    |
| `ADMIN_API_TOKEN`                | High-entropy server-side moderation token                |
| `REVALIDATE_SECRET`              | High-entropy server-side revalidation secret             |
| `RESTORATION_PER_IP_LIMIT`       | Reserved until the proxy supplies a server-sanitized client IP; Coolify currently enforces global caps only |
| `RESTORATION_GLOBAL_LIMIT`       | Optional; defaults to `20` per hour                      |
| `RESTORATION_DAILY_GLOBAL_LIMIT` | Optional; defaults to `12` per day                       |
| `RESTORATION_RETENTION_HOURS`    | Optional; defaults to `168` (7 days)                     |
| `CONTRIBUTIONS_ENABLED`          | Set to `false` for an immediate public-write kill switch |

`ARCHIVE_CONTENT_DIR` normally does not need an override: the Docker image
ships the source-controlled article directory. If it is set explicitly, it
must point to the copied published-content directory inside the container.

## Deployment verification

After Coolify reports a successful rollout:

1. Open `https://saroop.mereka.dev` and confirm that the archive shell loads.
2. Request `GET /api/articles` and confirm that it returns real articles, not
   an empty array.
3. Request `GET /api/gallery` and confirm it exposes only published entries.
4. Upload one small, non-sensitive test image through `/restore`. Confirm a
   Gemini result is returned and that the original plus output remain available
   after a container restart.
5. Confirm a gallery submission stays pending until explicit archive review.
6. Check the Coolify deployment logs for startup, storage-permission, and
   Gemini errors before directing traffic to the new domain.

## Moderating a contribution

Contributions are private pending records. An administrator can approve or
reject one with the runtime-only `ADMIN_API_TOKEN`; publishing copies only the
selected restoration into a separate public-gallery location and does not
expose the original upload or its private session URL.

```bash
curl 'https://saroop.mereka.dev/api/gallery/moderation?status=pending' \
  -H "Authorization: Bearer $ADMIN_API_TOKEN"

curl -X PATCH 'https://saroop.mereka.dev/api/gallery?id=GALLERY_ID' \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"status":"published"}'
```

Use `{"status":"rejected"}` to keep the record private. Delete a record with
the same bearer token and `DELETE /api/gallery?id=GALLERY_ID`.

## Content updates

Article Markdown and source scans are source-controlled. A normal content
change is deployed with its Git commit. If immediate cache refresh is required,
use the protected endpoint:

```text
POST /api/revalidate
Authorization: Bearer $REVALIDATE_SECRET
```

Only `path=/`, `path=/articles`, and `tag=articles` are accepted; the default
refreshes archive article routes. Do not put revalidation secrets in a URL,
shell history, or proxy log.

## Rollback and recovery

To roll back application code, redeploy a previously verified Git commit from
Coolify. Do not delete, recreate, or mount over `/data` during that rollback.
Back up the persistent volume before any storage migration and prove a restore
with a test session after recovery.

For a Docker-managed Coolify volume, run the backup from the Coolify worker
after substituting the actual volume name shown by `docker volume ls`:

```bash
docker run --rm -v VOLUME_NAME:/data:ro -v /var/backups/saroop:/backup \
  alpine tar -C /data -czf /backup/saroop-data-YYYYMMDD.tgz .
sha256sum /var/backups/saroop/saroop-data-YYYYMMDD.tgz
```

Prove recovery into a disposable volume before relying on a backup:

```bash
docker volume create saroop-restore-proof
docker run --rm -v saroop-restore-proof:/data -v /var/backups/saroop:/backup:ro \
  alpine sh -c 'tar -C /data -xzf /backup/saroop-data-YYYYMMDD.tgz && find /data -type f | sort'
docker volume rm saroop-restore-proof
```

The retired Vercel/Python prototype is documented in
[packages/restorations/python-restoration/ARCHIVED.md](packages/restorations/python-restoration/ARCHIVED.md)
for historical reference only.
