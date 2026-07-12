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
- `MEMORY_DAILY_GLOBAL_LIMIT` — durable daily memory intake cap
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

The family chooses one of three optional intentions: Clean & preserve, Repair
damage, or Explore colour. The owner chooses the engine in the advanced panel.
Each run records the exact provider model, versioned prompt, preset and output
checksum. Gemini calls use stateless storage settings. Outputs with material
aspect-ratio drift are rejected before storage, and publication requires an
explicit human comparison checklist.

The slider is a review instrument, not proof of geometric registration. Legacy
pairs have different canvases and are disclosed as illustrative comparisons.
Fresh output still requires human landmark/alignment inspection.

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
2. inject the Infisical-managed auth, OpenAI and Gemini values;
3. keep `ARCHIVE_ADMIN_EMAILS` fail-closed and use separate session/password/API
   secrets;
4. set both public-origin variables to `https://saroop.mereka.dev`;
5. preserve proxy request-body and rate limits;
6. run the full test suite and container health check;
7. verify backup and restore for `archive.sqlite*` and the `objects/` tree;
8. exercise contribution, memory receipt, Studio login, restoration review,
   publication and withdrawal on the deployed domain.

## Preservation exports

`/api/archive/manifest` publishes checksums for recovered gallery sources,
legacy experiments and active article scans. The owner Studio metadata export
includes image records, restoration runs, audit events and private memory
metadata. Media bytes still require a separate versioned object-storage backup
and tested restore process.
