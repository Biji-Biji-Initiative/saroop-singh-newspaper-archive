# Published article corpus decision

The only authoritative published-article source is
`saroop-singh-archive/packages/web/content/articles/published/`.

This is the directory the Next.js loader reads, the preservation manifest
hashes, the Docker image copies, and Coolify serves. Family article pull
requests must change this directory and must pass `npm run validate:content`
from `saroop-singh-archive/packages/web`.

## Why the duplicate was removed

On 2026-07-13, the repository contained a second corpus at
`saroop-singh-archive/content/articles/published/`. It had the same 38 records
but 19 different Markdown files. It was not included in the application image
or continuous-integration build, so changes there could be reviewed yet never
reach the public archive.

The runtime corpus is deliberately newer. It withdraws the unsupported 1957
half-mile record and redirects readers to its 1937 canonical source; it also
contains later scan and provenance corrections. The retired tree was therefore
removed rather than copied over the runtime corpus. Git history retains the
original material.

## Evidence snapshot

- Runtime corpus introduced in `2d96a81342e3e9649781825a762bafa424f546fa`
  and further corrected in `5fc4b70f830cd66a74b78a2f063bbf0a54206fa3`.
- Before removal, the retired corpus aggregate SHA-256 was
  `f00e45e18d2ed7f3e05816d6aa94a25abe25146e7562844f250f2126143ca01e`.
- Before removal, the canonical runtime corpus aggregate SHA-256 was
  `d5d9a45e1756aac8e4e54d39fb11c786b4a0e4152f0a07ed2d27da9013fb118d`.

`validate-content.mjs` rejects a second source tree, validates article
frontmatter and scans, and checks withdrawn records point only to active
canonical records. The generated preservation manifest records a stable hash
for every article Markdown file.
