# Saroop Singh Archive — photo restoration

The production restoration workflow is part of the archive’s Next.js
application. It runs as one service on Coolify; there is no second Python API,
Vercel project, public upload bucket, or client-side API key.

## Supported workflow

1. A visitor selects a JPG, PNG, or WEBP image (up to 10 MB) on `/restore`.
2. The browser sends a same-origin multipart request to `POST /api/restore`
   with the file in the `image` field.
3. The server sends the image and a conservative preservation prompt to Gemini.
4. The original, generated restoration, and session manifest are written to
   the durable archive data directory.
5. The visitor compares the result with the original, downloads it, or submits
   it for archive review. Gallery submissions are pending by default and are
   never made public by a browser request.

Private session images use a per-session capability link. When an administrator
approves a contribution, the service copies only the selected output to a
separate public-gallery path; publishing never exposes the contributor's
original image.

The application intentionally produces one archival restoration, rather than
multiple speculative variants. AI-generated output must be reviewed against
the source image before it is published or described as historical evidence.

## Production configuration

Secrets are stored in Infisical and injected as Coolify **runtime** variables.
Do not create production `.env` files or expose any key with a `NEXT_PUBLIC_`
prefix.

| Variable                         | Required                     | Purpose                                                               |
| -------------------------------- | ---------------------------- | --------------------------------------------------------------------- |
| `GEMINI_API_KEY`                 | Yes                          | Server-only key used by `/api/restore`.                               |
| `GEMINI_MODEL`                   | No                           | Image-capable Gemini model; the route has a safe default.             |
| `ARCHIVE_DATA_DIR`               | Yes in production            | Persistent writable path, normally `/data`.                           |
| `ADMIN_API_TOKEN`                | Yes for moderation           | Server-side bearer token for protected gallery administration.        |
| `REVALIDATE_SECRET`              | Yes for content revalidation | Secret for `POST /api/revalidate`.                                    |
| `RESTORATION_PER_IP_LIMIT`       | No                           | Reserved for a future proxy that provides a server-sanitized client IP; Coolify currently enforces global caps only. |
| `RESTORATION_GLOBAL_LIMIT`       | No                           | Persistent service-wide hourly cap; defaults to `20`.                 |
| `RESTORATION_DAILY_GLOBAL_LIMIT` | No                           | Persistent service-wide daily cost circuit breaker; defaults to `12`. |
| `RESTORATION_RETENTION_HOURS`    | No                           | Private session retention; defaults to `168` hours (7 days).          |
| `CONTRIBUTIONS_ENABLED`          | No                           | Set to `false` to halt public restores and gallery submissions.       |

OpenAI is not on the active restoration request path. Do not add an OpenAI key
until there is a reviewed server-side feature that needs it.

## Local development

```bash
cd packages/web
npm ci
npm run dev
```

For local-only testing, the application uses a local `archive-data` directory
unless `ARCHIVE_DATA_DIR` is set. Use a development Gemini key only; production
credentials belong in Infisical.

## Operations

- Persist `/data` through Coolify. It contains restoration sessions and
  gallery submissions, so deleting or replacing that volume loses review data.
- Treat a failed Gemini request as a user-visible failure; do not silently
  replace it with a fabricated local "restoration".
- Keep the admin token only in Coolify/Infisical and use HTTPS for every admin
  request.
- Review pending contributions at `/archive-review` with `ADMIN_API_TOKEN`.
  The page keeps the token in memory only and never exposes pending records to
  the public gallery. The authenticated moderation endpoint remains available
  for scripted operations.
- The hourly and daily restoration caps are deliberate launch safeguards. Raise
  them only after reviewing Gemini spend and abuse signals.
- Private originals and outputs expire after the configured retention period.
  Approved gallery derivatives remain because they are copied to a separate
  public asset path.
- Before a storage migration, create and test a backup of the Coolify `/data`
  volume using the recovery procedure in `DEPLOYMENT-GUIDE.md`.
- Verify a deployment with an actual small image upload after checking the
  public archive and gallery endpoints.

The retired Python/Vercel prototype is preserved solely for historical source
reference in [packages/restorations/python-restoration](packages/restorations/python-restoration/ARCHIVED.md).
