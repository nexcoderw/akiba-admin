# API contracts and transport

## Ownership and adapters

Inspect actual sibling API controllers, DTOs and errors before wiring a screen. Do not invent endpoints, permission names or successful responses. Frontend work must not duplicate Prisma access, migrations or backend business rules.

Where a BFF is approved, implement narrow fixed adapters. No generic URL/path proxy, wildcard credential forwarding or user-controlled upstream host. Server Components should call shared server adapters directly rather than making HTTP requests to their own application.

## Transport requirements

Use a server-only configured upstream origin. Validate input and response shapes, select minimal public DTO fields, bound request/response size and apply cancellation/timeouts. Reject upstream redirects unless a specific reviewed contract requires them. Allowlist cookies and headers in both directions; preserve reviewed cookie security attributes.

Authenticated requests and responses must not enter shared caches. Browser calls should follow the approved same-origin contract. Do not expose server secrets through NEXT_PUBLIC variables.

## Failure and retry behavior

Map verified problem responses to safe UI errors with request IDs. Do not return raw upstream bodies, SQL, stacks or internal hosts. Handle network failure separately from rejection.

Automatically retry only explicitly safe, bounded reads. For a timed-out mutation, outcome may be unknown: check status or use supported idempotency before resubmission. Never blindly retry invitations, approval, MFA changes or other privilege mutations. Preserve conflict responses and user drafts rather than overwriting newer server state.
