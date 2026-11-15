# Akiba Admin repository instructions

This repository owns the Akiba platform administration frontend. Before every task, read [.agents/README.md](.agents/README.md), [.agents/agent-workflow.md](.agents/agent-workflow.md), [.agents/git.md](.agents/git.md) and all relevant topic rules.

## Non-negotiable priorities

- Protect identities, effective permissions, tenant boundaries and private data.
- Keep rendering, navigation, input and network work fast through measured, bounded implementations.
- Every styled component file owns a same-name CSS Module; components must not share module imports. See [.agents/styling.md](.agents/styling.md).
- Make every workflow clear, accessible, responsive and recoverable.
- The API owns authentication, authorization and business policy; the database repository owns Prisma and migrations. Frontend visibility is not enforcement.
- Preserve user changes. Do not automatically commit, push, publish or deploy.
- Humans run installs, formatters, lint, type checks, tests, builds, servers and browser checks unless the user explicitly authorizes execution. Provide commands instead; never bypass this through another tool.
- Always supply per-file copy/paste commit commands in the response. Do not create shell scripts for them.
- Read the actual manifest and installed framework documentation. Do not assume reference-project dependencies, endpoints, scripts or security features exist here.

The detailed rules distinguish current implementation from requirements for future work. Read them before proposing architecture or changing code.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
