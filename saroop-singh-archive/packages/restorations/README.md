# Restoration research and historical prototypes

The production restoration feature lives in the main Next.js application:

```text
packages/web /restore -> POST /api/restore -> Gemini -> durable /data storage
```

It is deployed with the repository-root Docker image on Coolify at the target
domain `https://saroop.mereka.dev`. See the root
[restoration guide](../../README-RESTORATION.md) and
[deployment guide](../../DEPLOYMENT-GUIDE.md).

## What remains here

- `python-restoration/` is an archived Python/Vercel prototype. It is not
  deployed, does not receive production credentials, and must not be used to
  configure Airtable webhooks. See its [archive notice](python-restoration/ARCHIVED.md).
- `adk_restoration/` is a separate research prototype. It is not on the public
  archive request path and needs a dedicated design and review before use.

Keeping these folders preserves useful experimentation and provenance without
creating a second, conflicting production restoration service.
