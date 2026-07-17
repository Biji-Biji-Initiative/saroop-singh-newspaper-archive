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
| `ARCHIVE_PUBLIC_ORIGIN`          | `https://saroop.mereka.dev`; used for trusted browser-origin checks behind TLS |
| `NEXT_PUBLIC_SITE_ORIGIN`        | `https://saroop.mereka.dev`; canonical public URL        |
| `ARCHIVE_ADMIN_EMAILS`           | Required comma-separated Studio owner allowlist          |
| `ARCHIVE_ADMIN_PASSWORD`         | Required long Studio sign-in passphrase                  |
| `ARCHIVE_SESSION_SECRET`         | Required 32+ character session-signing secret            |
| `ARCHIVE_SOURCE_HASH_SECRET`     | Separate pepper for daily abuse-limit hashes             |
| `ADMIN_API_TOKEN`                | Required high-entropy Studio automation token            |
| `ARCHIVE_REVALIDATE_SECRET`      | Optional bearer credential for `/api/revalidate`         |
| `FAMILY_WORKSPACE_INVITE_SECRET` | 32+ character private family-link capability; rotate this to revoke old links |
| `FAMILY_WORKSPACE_ID`            | Separate stable 32+ character workspace identity; do not rotate with the invite |
| `FAMILY_GENERATION_DAILY_NETWORK_LIMIT` | Optional per-network family image-making cap; defaults to `12`/day, max `40` |
| `FAMILY_GENERATION_DAILY_GLOBAL_LIMIT` | Optional global family image-making cap; defaults to `100`/day, max `500` |
| `OPENAI_API_KEY`                 | Dedicated server-side GPT Image credential               |
| `GEMINI_API_KEY`                 | Dedicated server-side Gemini credential                  |
| `GEMINI_ANALYSIS_MODEL`          | Optional private face-observation model override         |
| `CONTRIBUTION_DAILY_GLOBAL_LIMIT`| Optional global private-photo cap; defaults to `500`/day |
| `MEMORY_DAILY_GLOBAL_LIMIT`      | Optional global private-memory cap; defaults to `1000`/day |
| `CONTRIBUTIONS_ENABLED`          | Set `false`, `0`, or `off` to close public photo intake immediately |

There is no automatic retention timer or off-host backup in the application.
Treat private-upload retention and backup destinations as an explicit archive
policy, then prove recovery before relying on either. The contribution switch
closes photo intake only; Memory Room submissions remain separately available.

The Docker image ships the validated source-controlled articles from
`packages/web/content/articles/published/`. There is no runtime content-path
override: changes to published articles are reviewed and deployed through Git.

## Continuous delivery

`Deploy production` runs after a successful `Web CI` push to `main`. It checks
that the proven SHA is still the current `main`, triggers Coolify through its
scoped API, polls the deployment, and requires Coolify to report that exact
commit before it succeeds. The repository Action secrets `COOLIFY_API_URL` and
`COOLIFY_API_TOKEN` are copied from the Infisical `/platform/coolify` scope;
they are never committed. A manual workflow dispatch is available for a
controlled replay, but normal deployments should flow through verified `main`.

## Deployment verification

After Coolify reports a successful rollout:

1. Open `https://saroop.mereka.dev` and confirm that the archive shell loads.
2. Request `GET /api/articles` and confirm that it returns real articles, not
   an empty array.
3. Request `GET /api/gallery` and confirm it exposes only published entries.
4. Upload one small, non-sensitive test image through `/restore`. Confirm a
   Gemini result is returned and that the original plus output remain available
   after a container restart.
5. Submit one small, non-sensitive image through `/contribute`. Confirm the
   original remains private, the contributor details appear only in the private
   review queue, and no AI provider was used.
6. Confirm both contribution types stay pending until explicit archive review.
7. Check the Coolify deployment logs for startup, storage-permission, and
   Gemini errors before directing traffic to the new domain.
8. Open the private family link once in a clean browser, make one non-sensitive
   test study, verify its split comparison, model and exact prompt, then remove
   that test study from the family image rail if it is not wanted.

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
