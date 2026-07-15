# Saroop Singh Archive

The Saroop Singh Archive is one production Next.js application: a reviewed
newspaper catalogue, a private family contribution workflow, and an owner-only
preservation Studio.

## Supported architecture

- `packages/web` is the only deployable application.
- Published articles and their public scans are source-controlled in
  `packages/web/content/articles/published` and `packages/web/public/images`.
- Family submissions, photograph records, restoration studies, public identity
  tags, and audit events are canonical SQLite records on the `/data` volume.
- Originals and derivatives are content-addressed objects below
  `$ARCHIVE_DATA_DIR/objects`; public media is served through the authenticated
  application route, never a packaged gallery directory.
- Coolify deploys the repository-root Docker image after verified `main` CI.

The tracked `content/` directory retains raw source evidence that has not been
published. It is not a runtime content source and cannot appear publicly until
it is deliberately ingested and reviewed in Studio.

## Development

```bash
npm --prefix packages/web ci
npm --prefix packages/web run type-check
npm --prefix packages/web run lint
npm --prefix packages/web test
```

For the runtime model, security boundaries, data lifecycle, and deployment
requirements, read [the web package guide](packages/web/README.md) and
[the deployment guide](DEPLOYMENT-GUIDE.md).
