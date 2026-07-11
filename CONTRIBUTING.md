# Contributing to the Saroop Singh Archive

Thank you for helping preserve family history. The archive favours careful,
well-sourced additions over speed: every contribution can be improved later,
but a clear story and original source make it useful for generations.

## The easiest way to share a family photo

1. Open [the contribution page](https://saroop.mereka.dev/restore).
2. Upload a JPG, PNG, or WEBP scan (up to 10 MB) and create a conservative
   restoration.
3. Select the version you want reviewed, then add its title, any known date,
   the person or contributor, and the story behind it.
4. Confirm that you have permission to share it. The submission remains private
   until an archive administrator reviews it.

Please do not submit material that contains private personal information,
copyrighted images you cannot share, or images of living people without their
permission.

## Add or correct a newspaper article

Published articles live in
`saroop-singh-archive/content/articles/published/`. Add a Markdown file whose
name is a safe slug, for example:

```text
1954-11-07_straits-times_example-event.md
```

Use this small frontmatter shape. Only `title` is mandatory; omit a date when
it is unknown rather than inventing one.

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
image: /images/example-event.jpg # optional site-relative path
---

Write the transcription, a correction, or the relevant historical context here.
```

Before opening a pull request, run the same checks used in continuous
integration:

```bash
cd saroop-singh-archive/packages/web
npm ci --ignore-scripts --workspaces=false
npm run validate:content
npm run lint
npm run type-check
npm run build
```

The content validator checks frontmatter, dates, text fields, lists, safe file
names, and empty articles. It gives file-specific errors so an accidental typo
does not silently remove an article from the public archive.

## Review standards

- Preserve the original wording in a transcription; label corrections or
  interpretation clearly.
- Record the source whenever it is known, including publication and page.
- Prefer “unknown” or an omitted field to a guessed date, person, or location.
- Keep originals unchanged. AI restorations are aids for viewing, not evidence.
- Keep pull requests focused: one family story, source batch, or correction per
  change whenever possible.

## How publication works

Photo contributions are stored privately and become public only after an
administrator approves them. GitHub contributions are reviewed through pull
requests and must pass the archive content and web checks before merging.
