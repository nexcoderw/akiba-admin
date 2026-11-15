# Next.js and rendering boundaries

## Version-aware implementation

MUST read the relevant installed guides under node_modules/next/dist/docs before writing framework code. Preserve the generated Next.js instruction block in root AGENTS.md. Inspect the current configuration: Cache Components, partial prefetching and React Compiler affect behavior. Do not copy older cache, middleware, request API or prefetch assumptions.

Prefer Server Components. Add use client only at the smallest boundary requiring browser interaction. Client Components can also render on the server; the directive is neither a secret boundary nor proof that browser APIs are available during rendering. Use server-only modules for secret-bearing adapters.

## Authentication and caching

Read authentication-with-cache-components.md and the directive guides before changing authenticated rendering. Verify private content at request time and use appropriate Suspense boundaries. A public shell or neutral skeleton may stream; privileged data and authenticated-looking state must await verification.

MUST NOT put sessions, credentials, effective permissions or authenticated responses in shared use cache/remote caches. Do not pass session tokens as cache keys. Request-scoped deduplication is distinct from persistent caching. Private/browser caching still needs explicit review of identity changes, revocation, retention and stale permission handling.

Layouts, proxy logic and hidden links are not sufficient authorization. Every protected backend operation must enforce its own access checks.

## Navigation and compiler

Consult adopting-partial-prefetching.md before changing Link prefetch behavior. Enabled partial prefetching changes what true/auto fetch; do not assume a complete dynamic page is prefetched. Bound speculative requests on large navigation lists. React Compiler is enabled: add manual memoization only for a demonstrated need.
