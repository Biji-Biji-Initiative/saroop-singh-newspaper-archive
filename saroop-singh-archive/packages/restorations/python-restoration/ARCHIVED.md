# Archived Python restoration prototype

This directory is retained as historical research and migration reference. It
is **not part of the production application**, is not deployed, and must not
be used to provision credentials, configure Airtable automations, or run a
public API.

The previous implementation depended on Vercel serverless functions, a
separate Next.js prototype, Redis, Airtable, and cloud storage. Its server
entrypoint and its client contract no longer matched the archive website, so
the Vercel configuration, CLI manifest, and deployment scripts were removed
as part of the Coolify cutover.

## Supported production path

The archive now has one restoration surface:

```text
browser upload -> packages/web POST /api/restore -> Gemini -> durable /data storage
```

The repository-root Docker image is deployed by Coolify at the target domain
`https://saroop.mereka.dev`. Runtime secrets are managed in Infisical and
injected into Coolify; no `.env` file in this directory is part of that path.
See [the production restoration guide](../../../README-RESTORATION.md) and
[the deployment guide](../../../DEPLOYMENT-GUIDE.md).

## Reusing historical work

The Python scripts, handler examples, prompts, test material, and Airtable
notes remain only as source material for a future, separately designed batch
workflow. Before reusing anything here, define an authenticated API contract,
durable storage lifecycle, rate limits, and a non-Vercel deployment plan.

Do not reactivate the old Airtable scripts or URLs: they target retired
endpoints and are incompatible with the current multipart `/api/restore`
route.
