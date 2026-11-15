# Akiba Admin engineering rules

These rules govern this repository: the Akiba platform administration frontend. They do not grant permission to change the API, database, deployment or organization-facing application.

## Required reading and precedence

Read the root [AGENTS.md](../AGENTS.md), this index, [agent-workflow.md](agent-workflow.md) and [git.md](git.md) for every task. Then read every relevant topic below; read [prettier.md](prettier.md) before code or configuration edits.

Follow explicit user instructions within platform constraints, then applicable repository instructions. More specific rules supplement general rules; do not interpret a performance exception as permission to weaken security. If requirements cannot be reconciled, explain the concrete conflict before dependent work. MUST denotes a requirement; MUST NOT denotes a prohibition. Examples illustrate patterns and do not authorize tooling, dependencies or scope changes.

## Priorities

1. Protect identities, privileges, tenant boundaries and private data.
2. Keep navigation, rendering, input and data operations fast.
3. Make each task understandable, accessible and easy to recover from.
4. Prefer maintainable, measured solutions that satisfy all three.

A fast page that leaks data is unacceptable. Security controls must have understandable feedback rather than silent failures.

## Verified starting point

At rule creation, the manifest declares Next.js 16.4.6, React/React DOM 19.3.0 and TypeScript ^5. The app uses App Router under src/app, strict TypeScript, CSS Modules, global CSS and next/font. Cache Components, partial prefetching and React Compiler are enabled. Recheck the actual manifest, lockfile, configuration and installed documentation before changes.

Only dev, build, start and lint scripts currently exist. There is no configured test runner, formatter, UI kit, query library or authentication adapter. These rules describe requirements for future implementation; they do not claim those features already exist.

## Rule map

| File | Responsibility |
| --- | --- |
| [agent-workflow.md](agent-workflow.md) | Inspection, ownership, execution boundaries and handoff |
| [git.md](git.md) | Preserve changes and provide per-file commit commands |
| [nextjs.md](nextjs.md) | Installed framework documentation, rendering and caching |
| [performance.md](performance.md) | Client work, fetching, payloads and measurement |
| [security.md](security.md) | Trust boundaries, CSRF, secrets and browser protections |
| [authentication.md](authentication.md) | Sessions, MFA, recovery and logout |
| [authorization.md](authorization.md) | Platform permissions and tenant separation |
| [endpoints.md](endpoints.md) | Fixed API adapters and safe transport |
| [environment.md](environment.md) | Configuration, origins and public variables |
| [error-handling.md](error-handling.md) | Safe API errors and recoverable UI |
| [design.md](design.md) | Product hierarchy, clarity and user feedback |
| [accessibility.md](accessibility.md) | Keyboard, semantics, focus and assistive technology |
| [responsive.md](responsive.md) | Small screens, zoom and input modes |
| [navigation.md](navigation.md) | Routes, redirects, permissions and prefetching |
| [forms.md](forms.md) | Validation, submission and sensitive inputs |
| [components.md](components.md) | Server/client boundaries and reusable primitives |
| [state-management.md](state-management.md) | Server authority, URL state and isolation |
| [hooks.md](hooks.md) | Effects, lifecycle and asynchronous races |
| [styling.md](styling.md) | CSS Modules, tokens and visual states |
| [icons.md](icons.md) | Accessible, consistent and lightweight icons |
| [typescript.md](typescript.md) | Strict types, runtime validation and DTOs |
| [code-quality.md](code-quality.md) | Maintainable implementation and review |
| [folder-structure.md](folder-structure.md) | Feature boundaries and module placement |
| [file-naming.md](file-naming.md) | Predictable routes, modules and exports |
| [dependencies.md](dependencies.md) | Dependency justification and compatibility |
| [prettier.md](prettier.md) | Actual formatting conventions; no assumed tooling |
| [testing.md](testing.md) | Meaningful verification and honest evidence |
| [comments.md](comments.md) | Explain security intent and unusual constraints |
| [documentation.md](documentation.md) | Accurate, concise and nonredundant documentation |

## Task routing

- Authentication or API changes: security, authentication, authorization, endpoints, environment, error handling, Next.js and testing.
- Screens or forms: design, accessibility, responsive, components, forms, styling, navigation and testing.
- Data or performance changes: performance, Next.js, state management, hooks, authorization and endpoints.
- Dependencies or configuration: dependencies, environment, security and formatting.

Read additional topics whenever the implementation touches them. A checklist or source review is not proof of runtime correctness, database isolation, performance or production readiness.

