# Contributing to the Saroop Singh Archive

Thank you for helping preserve family history. The archive favours careful,
well-sourced additions over speed: every contribution can be improved later,
but a clear story and original source make it useful for generations.

## The easiest way to share a family photo

1. Open [the family contribution page](https://saroop.mereka.dev/contribute).
2. Upload up to 12 JPG, PNG, or WEBP scans (up to 25 MB each). By default this
   preserves the original for private family review only.
3. Add only what your family knows: title, approximate date, people pictured,
   tags, and story. “Unknown” is always useful information.
4. Confirm that you have permission to share the material. Every photograph and
   your follow-up details remain private until an archive administrator reviews
   it.
5. Keep the private receipt link shown after a successful submission. It is not
   a login, shows only safe review totals, and cannot be used to add more files.

By default, this contribution path does not send material to an AI provider. If
someone explicitly ticks the optional private AI-study consent, an archive
administrator may later send a working copy and the submitted notes to the
selected provider for a private study after family review. The preserved source
is never replaced, and nothing is published automatically. Leaving the option
unticked means no contribution copy is sent to an AI provider.

Please do not submit material that contains private personal information,
copyrighted images you cannot share, or images of living people without their
permission.

## Add or correct a newspaper article

Published articles live in
`saroop-singh-archive/packages/web/content/articles/published/`. Add a Markdown file whose
name is a safe slug, for example:

```text
1954-11-07_straits-times_example-event.md
```

Use this small frontmatter shape. `title` and a site-relative `image` are
required; omit a date when it is unknown rather than inventing one.

```yaml
---
title: Example event
date: 1954-11-07 # optional; YYYY-MM-DD or "unknown"
date_text: 7 Nov 1954 # optional human-readable source date
source: The Straits Times, Page 19
location: Kuala Lumpur
people:
  - Saroop Singh
tags:
  - clipping
image: /images/example-event.jpg # required site-relative scan or explicit placeholder
---

Write the transcription, a correction, or the relevant historical context here.
```

Before opening a pull request, run the same checks used in continuous
integration:

```bash
cd saroop-singh-archive/packages/web
npm ci --workspaces=false
npm run validate:content
npm run lint
npm run type-check
npm run build
```

The content validator checks that this is the only published source tree,
frontmatter, dates, text fields, lists, scans, safe file names, empty
articles, and withdrawn-record links. It gives file-specific errors so an
accidental typo or an edit in the wrong directory cannot silently disappear
from the public archive.

## Review standards

- Preserve the original wording in a transcription; label corrections or
  interpretation clearly.
- Record the source whenever it is known, including publication and page.
- Prefer “unknown” or an omitted field to a guessed date, person, or location.
- Keep originals unchanged. AI restorations are aids for viewing, not evidence.
- Keep pull requests focused: one family story, source batch, or correction per
  change whenever possible.

## How publication works

Family contributions are stored privately and become public only after an
administrator approves them. Contributor contact details are visible only in
the private review queue and are never included in the public gallery. GitHub
contributions are reviewed through pull requests and must pass the archive
content and web checks before merging.
