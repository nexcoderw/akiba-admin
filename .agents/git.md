# Git and change preservation

## Inspection and ownership

Use read-only status, diff and log commands to establish the starting state. Preserve staged work, untracked files, deletions and edits belonging to the user. Do not restore, stash, reset, clean, rebase, commit, push or alter Git configuration without explicit authorization.

Review untracked files too: an ordinary git diff does not include their contents. Keep unrelated changes out of proposed commits. Never stage .env files, credentials, build output, dependency directories or private diagnostics. An example environment file requires deliberate secret review and an exact allowlisted path if ignored.

## Human commit handoff

Always provide copy/paste commands directly in the response. Do not generate .sh files. Use the actual repository directory, explicit quoted paths, one git add and one git commit per changed file, and a specific imperative message:

```sh
git add -- "src/app/example/page.tsx"
git commit -m "feat(admin): add example page"
```

Never recommend git add . or git add -A. Before recommending a commit, inspect staged changes; git commit includes everything already staged. If unrelated staged work exists, explain that the human must isolate it first without discarding it. For a file mixing unrelated edits, recommend interactive staging and describe the intended portion.

Account for each changed file. Do not claim a commit was created when only commands were supplied. Do not publish, deploy or trigger CI as a substitute for human verification.
