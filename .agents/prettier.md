# Formatting and editor conventions

This filename matches the reference rule structure; it does not mean Prettier is installed. The current repository has no formatter dependency or format script.

## Existing style

Follow neighboring source: two-space indentation, double quotes and semicolons in TypeScript/TSX. Use readable Markdown and conventional JSON. Follow the actual ESLint configuration rather than copying a different project's tabs, plugins or formatting rules.

Do not mass-reformat unrelated files. Keep whitespace changes scoped to the implementation. Preserve generated framework instruction blocks and machine-managed files.

## Tooling changes

Do not recommend npm run format or format:check unless the script actually exists. Do not install Prettier, create an editor policy or change lint architecture without a concrete authorized need.

If a formatter is approved later, define one consistent configuration, compatible scripts and ignored generated outputs, then update this rule. Humans run formatting commands unless explicitly authorized otherwise.

## Review

Check indentation, import consistency, trailing whitespace and final newlines through source/diff inspection. Static review is not a formatter result.

Use real newlines in documentation and commit text. Avoid command scripts for commit plans; provide commands directly in the response under [git.md](git.md).

