# Code quality

Implement the smallest complete solution that satisfies the real task. Read existing patterns first. Keep functions cohesive, names descriptive and dependencies flowing in one direction.

## Correctness

Handle loading, empty, invalid, unauthorized, expired, unavailable and conflicting states deliberately. Do not swallow exceptions, fabricate successful data or use TODO comments to disguise an incomplete critical path.

Keep authorization, transport and presentation responsibilities clear. Share verified helpers where behavior is truly common; avoid copy-pasted security checks that drift across routes.

Bound queries, loops, retries and payloads. Avoid blocking browser work and synchronous heavy processing in request paths. Never optimize by removing validation, privacy or access checks.

## Review

Inspect imports, server/client boundaries, response shapes, cache scope, cleanup and error behavior. Remove dead code introduced by the change. Preserve unrelated work and avoid broad rewrites.

Do not add speculative abstractions, fallback identities, compatibility aliases or unused configuration. A migration to a new library or architectural pattern requires a concrete benefit and agreed scope.

Follow the actual lint configuration. Do not disable rules globally to make an isolated problem disappear. Explain deliberate exceptions locally with a reason and verification plan.

Human-run checks and source review provide different evidence; report each honestly.

