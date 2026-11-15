# Errors and recovery

## Safe contract

Respect Akiba's verified application/problem+json contract, stable codes and request IDs. Parse responses defensively. Show approved messages or safe mapped copy; do not blindly render upstream detail or stringify exceptions.

Never expose stacks, SQL, Prisma errors, internal paths, credentials, permission internals or another tenant's existence. Do not log complete request/response bodies. Diagnostics should contain safe operation names, status and correlation IDs.

## Useful states

Distinguish initial loading, empty results, unavailable data, validation rejection, access denial, expiration and unknown mutation outcomes. A failed request is not a zero count or empty list. Keep valid user input on recoverable failures without retaining sensitive material.

Use concise actionable language: what happened and what the user can do. Place field errors next to inputs and associate them accessibly. Use a summary when multiple errors need navigation. Avoid repeated toast storms and silent failures.

## Recovery paths

Provide retry for safe reads, restart for expired proofs, and reauthentication for confirmed session expiration. Do not turn every 403 into a login loop. Rate limits must respect backend retry guidance. Mutation timeout copy must not claim failure or success before the outcome is known.

Error boundaries need useful fallbacks and recovery without private diagnostics. Review loading/error/not-found files against the actual Next.js APIs. Keep normal navigation available when a local region fails.
