# Agent workflow

## Before editing

MUST read the root instructions, rule index, this file, Git rules and relevant topics. Inspect read-only Git status, the current branch and affected source. Identify existing human changes and the smallest complete outcome. Check actual dependencies, installed Next.js guides and API contracts rather than assuming previous project patterns apply.

The frontend owns presentation, interaction and explicitly approved fixed API adapters. Nest owns authentication, effective authorization and business policy. The database repository owns Prisma schemas and migrations. Do not make sibling repository changes as an incidental frontend fix.

## Execution boundary

By default, humans run installs, scaffolding, formatters, lint, type checks, tests, builds, development servers, browser checks, Git writes and deployment. Provide exact commands instead. An explicit later user instruction may authorize a specific operation; tool availability alone does not.

Read-only file and Git inspection, source edits and static diff review are allowed. Never bypass this boundary through a wrapper, subprocess, IDE automation, CI trigger or another agent. Do not connect to a database, reset data or start background services.

## Delivery

Review the complete relevant diff, imports, failure paths, contracts, secret handling and unrelated changes. Explain what changed, what static review established, what was not executed and what remains unverified. Provide human commands that actually exist, with the correct directory and prerequisites.

Finish with per-file commit commands under [git.md](git.md). Do not create completion-report files, command scripts or speculative scaffolding merely to make a task look finished.
