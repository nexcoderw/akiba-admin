# Dependencies

The stack declares Next.js, React, React DOM, TypeScript, ESLint, the React Compiler plugin and an exact Prettier development dependency. Authentication-policy tests use Node's built-in runner. No UI kit, query library, form library, third-party test runner or icon library is assumed.

## Adding a package

First check whether platform APIs, the existing stack or a small local implementation meet the need safely. Justify the capability, maintenance, security, license, bundle/runtime cost and compatibility with installed versions.

A dependency change must be explicit and reviewable. Humans run installs and lockfile generation unless specifically authorized otherwise. Do not hand-edit lockfile dependency graphs or silently run package managers.

## Compatibility

Read official/installed documentation for the exact integration. Verify Server Component, compiler, SSR and browser compatibility. Avoid packages that require broad use client boundaries or expose secrets through build-time configuration.

Prefer narrow imports and avoid duplicate libraries solving the same problem. Do not install a package solely because another repository uses it.

## Maintenance

Inspect vulnerability findings in context; do not apply breaking upgrades or npm audit fix automatically. Never claim an audit was run when only the manifest was read.

Preserve package-lock.json and the established package manager. Do not mix lockfiles. Explain human verification commands, migration risks and any unverified compatibility after changes.
