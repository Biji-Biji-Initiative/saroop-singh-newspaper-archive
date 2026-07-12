# Saroop Singh Archive

[Visit the live archive](https://saroop.mereka.dev) · [Share a family memory](https://saroop.mereka.dev/contribute) · [Contribution guide](CONTRIBUTING.md)

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

The simplest path is the [family contribution page](https://saroop.mereka.dev/contribute):
preserve up to 12 photographs and their stories privately. Each successful batch
ends at an unguessable private receipt that shows safe review totals only; it is
not an account or an upload link. Every item waits for family review before
publication.

By default, contribution files remain inside the private archive and are not
sent to an AI provider. An optional, explicit private-study consent allows an
archive administrator to request a working-copy study after family review; the
source is never replaced and nothing is published automatically. Leaving it
unticked means no contribution copy is sent to an AI provider.

Conservative AI-assisted restoration studies are initiated by archive
administrators only after private intake and explicit consent. The public
contribution path always preserves the original without sending it to an AI
provider.

For article corrections, new clippings, or a local development workflow, start
with [CONTRIBUTING.md](CONTRIBUTING.md). It contains the actual content path,
frontmatter shape, review standards, and validation commands.

## Repository layout

```text
saroop-singh-archive/
├── saroop-singh-archive/
│   └── packages/web/                # Live Next.js archive and canonical article corpus
│       └── content/articles/published/
├── CONTRIBUTING.md                  # Family-friendly contribution workflow
└── .github/workflows/               # Content and production web checks
```

## Local development

```bash
cd saroop-singh-archive/packages/web
npm ci --workspaces=false
npm run validate:content
npm run dev
```

The live application runs from `main` and is independently health-checked at
`/api/health`. Pull requests must pass the published-content validator, lint,
type-check, production build, and production dependency audit before merge.
