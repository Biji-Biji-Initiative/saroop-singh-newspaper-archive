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
- Only explicitly published comparison variations are public. Modern studies
  require approval; recovered historical variations retain an explicit
  unknown-provenance label. Unreviewed derivatives remain private and never
  stand in for a source image.

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
- `/family?access=…` — passwordless shared family workspace for making, comparing and organising private image versions
- `/studio` — owner-only preservation review and deliberate publication
- `/methodology` — evidence, provenance, originals and restoration policy

## Runtime and storage

The production archive runs as a standard Next.js service on Coolify at
`https://saroop.mereka.dev`. Metadata is stored in SQLite at
`$ARCHIVE_DATA_DIR/archive.sqlite`; private originals, memory recordings and
restoration derivatives are stored under `$ARCHIVE_DATA_DIR/objects`. Coolify
mounts `/data` as the durable volume. Database migrations run automatically and
idempotently when the application opens the database.

The private Studio uses a signed, HttpOnly, SameSite=Strict session. Browser
sign-in requires an allowlisted email and a long archive passphrase. A separate
bearer token supports trusted operator automation. No proxy-supplied identity
headers are trusted.

Important runtime values:

- `ARCHIVE_DATA_DIR` — durable metadata and media root; `/data` in production
- `ARCHIVE_PUBLIC_ORIGIN` / `NEXT_PUBLIC_SITE_ORIGIN` — canonical
  `https://saroop.mereka.dev` origin
- `ARCHIVE_ADMIN_EMAILS` — comma-separated owner allowlist; required
- `ARCHIVE_ADMIN_PASSWORD` — long private browser sign-in passphrase
- `ARCHIVE_SESSION_SECRET` — at least 32 random characters for signed sessions
- `ARCHIVE_SOURCE_HASH_SECRET` — separate pepper for daily abuse-limit hashes
- `ADMIN_API_TOKEN` — separate long bearer token for trusted automation
- `CONTRIBUTION_DAILY_GLOBAL_LIMIT` — durable daily photograph intake cap
- `CONTRIBUTIONS_ENABLED` — set `false`, `0`, or `off` to close public photo intake
- `MEMORY_DAILY_GLOBAL_LIMIT` — durable daily memory intake cap
- `FAMILY_WORKSPACE_INVITE_SECRET` — at least 32 random characters; the private shared family-link capability
- `FAMILY_WORKSPACE_ID` — separate stable 32+ character workspace identity; retain it when rotating the invite secret
- `FAMILY_GENERATION_DAILY_NETWORK_LIMIT` — per-network daily image-making limit (default 12, max 40)
- `FAMILY_GENERATION_DAILY_GLOBAL_LIMIT` — global daily family image-making limit (default 100, max 500)
- `OPENAI_API_KEY` — GPT Image restoration provider
- `GEMINI_API_KEY` — Gemini restoration and private face-observation provider
- `GEMINI_ANALYSIS_MODEL` — optional Gemini model override for face observations
- `ARCHIVE_REVALIDATE_SECRET` — optional private revalidation credential

Secrets are sourced from Infisical and injected into Coolify. They never belong
in tracked environment files.

Run from this package inside the monorepo:

```bash
npm ci --workspaces=false
npm run type-check
npm run lint
npm test
npm run db:generate   # only after editing db/schema.ts
```

`npm test` builds the production Next.js artifact, verifies source/media
integrity and restoration safety, then boots the real production server to
exercise public discovery, signed Studio login, private contribution storage,
media isolation, AI consent gates and receipt privacy.

## Restoration contract

The normal family flow is intentionally direct: open the shared private link
once, select a source, choose Clean & preserve, Repair damage, or Try colour,
and make a version. GPT Image 2 is the default; Nano Banana 2 and Nano Banana
Pro remain available under “Fine-tune this version.” Each finished thumbnail
opens its exact model, provider, versioned prompt, preset and output checksum.
The family can rate a version, put a preferred result first, or hide a weak
older result while retaining its record. Every new run is source-locked and
private to the shared family workspace; only a later explicit Studio decision
can publish it. Gemini calls use stateless storage settings. Outputs with
material aspect-ratio drift are rejected before storage.

The slider is a review instrument, not proof of geometric registration. Every
published comparison still requires human landmark and alignment inspection.

## Face observations and family identification

Face assistance is deliberately split into two stages. After a family
contribution is accepted into private review and affirmative AI consent is
recorded, the curator may ask Gemini to count visible faces and describe broad
image positions. The provider call is stateless, observations remain private,
and the model is forbidden from naming people or inferring age, gender,
ethnicity, health, emotion or relationships.

Actual identification belongs to the family. The Memory Room lets relatives
anchor a proposed name and certainty statement to a person in a photograph.
Those claims remain private until human review; AI observations never become
identity records automatically.

## Coolify deployment contract

The container uses Node 22, a standard Next.js standalone artifact and a
non-root runtime user. Startup initializes `/data`, applies SQLite migrations,
and then drops privileges. `/api/health` proves that both metadata and object
storage are writable while reporting only boolean auth/provider configuration.

Before every production promotion:

1. keep the existing `/data` persistent-volume mount;
2. inject the Infisical-managed auth, OpenAI, Gemini and family-workspace values;
3. keep `ARCHIVE_ADMIN_EMAILS` fail-closed and use separate session/password/API
   secrets;
4. set both public-origin variables to `https://saroop.mereka.dev`;
5. preserve proxy request-body and rate limits;
6. run the full test suite and container health check;
7. verify backup and restore for `archive.sqlite*` and the `objects/` tree;
8. exercise contribution, memory receipt, the passwordless family workspace,
   Studio publication and withdrawal on the deployed domain.

## Preservation exports

`/api/archive/manifest` is generated from published canonical image records and
their explicitly published comparison variations. The owner Studio metadata export includes image records,
restoration runs, audit events and private memory metadata. Media bytes still
require a separate versioned object-storage backup and tested restore process.
