# Saroop Singh Archive

A family-led digital archive of Saroop Singh, a Sikh middle-distance runner
documented in athletics in pre-war Malaya. The project combines a reviewed
newspaper catalogue, best-available photographic sources, private family
contributions, and a source-first restoration review studio.

## Archive principles

- Source files remain independently downloadable and never get overwritten by
  an AI derivative.
- Catalogue errors are withdrawn or redirected, not quietly rewritten.
- Family memories are private claims until a human review decision.
- Public contributions require no account and never publish automatically.
- AI processing is optional, default-off, recorded separately from preservation
  consent, and blocked server-side when permission is absent.
- Recovered legacy AI outputs are speculative experiments with unknown prompts
  and unreliable likeness—not conservation restorations.

The recovered image set contains JPG/PNG source files only. Some are scans,
some are newspaper crops or screenshots, and one is a known crop of another
group portrait. No physical-print register, reverse scans, TIFF/DNG/RAW masters,
or complete digitisation histories were recovered.

## Main surfaces

- `/story` — guided family exhibition
- `/articles` — reviewed catalogue entries and source scans
- `/timeline` and `/people` — evidence-led discovery
- `/gallery` — source-first photographic records and optional comparisons
- `/remember` — private names, stories, corrections, voice, fronts and backs
- `/contribute` — multi-photo family intake with per-photo metadata
- `/studio` — owner-only preservation, restoration review and publication
- `/methodology` — evidence, provenance, originals and restoration policy

## Runtime and storage

The current ChatGPT Sites deployment uses vinext on Cloudflare Workers, D1 for
metadata and R2 for private source files and derivatives. Bindings are declared
in `.openai/hosting.json`; schema migrations live in `drizzle/`.

Important runtime values:

- `ARCHIVE_ADMIN_EMAILS` — comma-separated owner allowlist
- `OPENAI_API_KEY` — optional GPT Image restoration provider
- `GEMINI_API_KEY` — optional Gemini image provider
- `NEXT_PUBLIC_SITE_ORIGIN` — canonical public origin for metadata, sitemap,
  sharing and QR codes
- `ARCHIVE_REVALIDATE_SECRET` — optional private revalidation credential

Run:

```bash
npm ci
npm run lint
npm test
npm run db:generate   # only after editing db/schema.ts
```

`npm test` builds the production Worker, validates the Sites artifact, verifies
source/media integrity, and runs the regression suite.

## Restoration contract

The family chooses one of three optional intentions: Clean & preserve, Repair
damage, or Explore colour. The owner chooses the engine in the advanced panel.
Each run records the exact provider model, versioned prompt, preset and output
checksum. Gemini calls use stateless storage settings. Outputs with material
aspect-ratio drift are rejected before storage, and publication requires an
explicit human comparison checklist.

The slider is a review instrument, not proof of geometric registration. Legacy
pairs have different canvases and are disclosed as illustrative comparisons.
Fresh output still requires human landmark/alignment inspection.

## Deployment warning

ChatGPT Sites strips spoofed `oai-authenticated-*` identity headers before the
application sees them. A generic Coolify/Vercel proxy does not automatically
provide that trust boundary. Do not expose the current owner routes on another
host by merely forwarding those headers.

Before a non-Sites deployment:

1. add a real signed OIDC/session adapter;
2. strip all inbound `oai-authenticated-*` headers at the public proxy;
3. inject identity only from a trusted internal hop;
4. require `ARCHIVE_ADMIN_EMAILS` and fail closed;
5. provision persistent SQL/object storage and run every migration;
6. set `NEXT_PUBLIC_SITE_ORIGIN` to the final domain;
7. configure request-body, rate, concurrency and storage quotas;
8. verify backup, restore and withdrawal procedures.

## Preservation exports

`/api/archive/manifest` publishes checksums for recovered gallery sources,
legacy experiments and active article scans. The owner Studio metadata export
includes image records, restoration runs, audit events and private memory
metadata. Media bytes still require a separate versioned object-storage backup
and tested restore process.
