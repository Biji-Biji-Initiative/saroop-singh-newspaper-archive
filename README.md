# Saroop Singh Archive

[Visit the live archive](https://saroop.mereka.dev) · [Contribute a memory](https://saroop.mereka.dev/restore) · [Contribution guide](CONTRIBUTING.md)

This is a living family archive for Saroop Singh, a pioneering Sikh athlete in
Malayan and Malaysian sports. It brings together carefully transcribed
newspaper clippings, family photographs, contextual stories, and conservative
AI-assisted restorations.

## What makes this archive trustworthy

- Original clippings and family materials remain the evidence; restorations are
  clearly review aids, never replacements for the source.
- Photo contributions remain private until an archive administrator approves
  them.
- Family context—title, date when known, people, and story—is collected with
  each submission.
- Published Markdown is validated in every pull request, so malformed content
  cannot silently drop out of the archive.

## For family contributors

The simplest path is the [photo contribution page](https://saroop.mereka.dev/restore):
upload a photo, review a conservative restoration, add its story, and submit it
for private archive review.

For article corrections, new clippings, or a local development workflow, start
with [CONTRIBUTING.md](CONTRIBUTING.md). It contains the actual content path,
frontmatter shape, review standards, and validation commands.

## Repository layout

```text
saroop-singh-archive/
├── saroop-singh-archive/
│   ├── content/articles/published/  # Source-controlled published clippings
│   └── packages/web/                # Live Next.js archive
├── CONTRIBUTING.md                  # Family-friendly contribution workflow
└── .github/workflows/               # Content and production web checks
```

## Local development

```bash
cd saroop-singh-archive/packages/web
npm ci --ignore-scripts --workspaces=false
npm run validate:content
npm run dev
```

The live application runs from `main` and is independently health-checked at
`/api/health`. Pull requests must pass the published-content validator, lint,
type-check, production build, and production dependency audit before merge.
