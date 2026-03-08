# LinkedIn Draft / Publish Workflow

A lightweight content operations workflow for writing, validating, previewing, and publishing LinkedIn posts from structured markdown drafts.

## What it does

- Stores LinkedIn post drafts as markdown with required metadata
- Validates draft completeness and catches missing proof points
- Renders a preview before publishing
- Supports text-only, JSON, and posting flows
- Includes a helper for LinkedIn OAuth setup for the local MCP path

## What I personally built

- A draft schema built around reusable metadata fields
- Validation and preview logic for post quality control
- A CLI wrapper around the posting flow
- A token helper for LinkedIn OAuth setup
- A repeatable writing workflow backed by examples and templates

## Repo structure

```text
.
├── examples/
├── scripts/
├── LINKEDIN-MCP-SETUP.md
└── package.json
```

## Requirements

- Node.js 18+
- Optional: global `linkedin` CLI for live posting
- Optional: LinkedIn Developer App for OAuth / MCP setup

## Install

```bash
npm install
```

## Usage

### Review a draft

```bash
node scripts/linkedin-review-draft.js examples/2026-03-09-amazon-q-from-zero-to-one.md
```

### Print text only

```bash
node scripts/linkedin-review-draft.js examples/2026-03-09-amazon-q-from-zero-to-one.md --text-only
```

### Dry-run a post

```bash
node scripts/linkedin-post-cli.js examples/2026-03-09-amazon-q-from-zero-to-one.md --dry-run
```

### Post for real

```bash
node scripts/linkedin-post-cli.js examples/2026-03-09-amazon-q-from-zero-to-one.md --yes
```

### Get an OAuth token for MCP setup

```bash
export LINKEDIN_CLIENT_ID=your_client_id
export LINKEDIN_CLIENT_SECRET=your_client_secret
node scripts/linkedin-get-token.js
```

## Examples

The `examples/` folder includes:

- `TEMPLATE.md`
- `2026-03-09-amazon-q-from-zero-to-one.md`
- `2026-03-16-agent-design-three-questions.md`

## Notes

- The live posting path depends on the external `linkedin` CLI
- The OAuth helper is cross-platform and opens the browser on macOS, Linux, and Windows
- See `LINKEDIN-MCP-SETUP.md` for full setup details
