# Formatting and editor conventions

Prettier is the required formatter. Its exact version is declared in devDependencies, with configuration in .prettierrc.json and exclusions in .prettierignore. Humans install it and update package-lock.json before running formatting commands.

## Existing style

Use two-space indentation, double quotes, semicolons, trailing commas and LF line endings under the committed configuration. Let Prettier format syntax; ESLint checks correctness and framework rules. Do not add stylistic lint rules that conflict with Prettier.

Do not mass-reformat unrelated files. Keep whitespace changes scoped to the implementation. Preserve generated framework instruction blocks and machine-managed files.

## Tooling changes

Humans run npm run format to apply formatting, followed by npm run format:check, npm run lint, npm test and npm run build. Include format:check whenever providing the full verification command sequence. Do not claim any of these passed without executing them under explicit authorization.

For routine edits, format only the intended files when appropriate (./node_modules/.bin/prettier --write path/to/file.ts). The format script includes the whole repository, so appending a filename to that script does not restrict its scope. The first adoption pass may format the existing repository; review its diff before committing. Keep the exact dependency version and lockfile aligned through human-run npm commands, never hand-edit a lockfile dependency graph.

Exclude dependencies, generated output, lockfiles, environment files, private key material and framework-managed AGENTS.md. Preserve the generated Next.js instruction block byte-for-byte. Editor integrations must use this repository's local Prettier and committed configuration; do not require a specific editor extension.

## Review

Check indentation, import consistency, trailing whitespace and final newlines through source/diff inspection. Static review is not a formatter result.

Use real newlines in documentation and commit text. Avoid command scripts for commit plans; provide commands directly in the response under [git.md](git.md).
