# Security

## Trust boundaries

Treat browser inputs, URL parameters, request headers and upstream payloads as untrusted. Nest remains authoritative for identity and business policy. Never trust client user IDs, role names, permission arrays or tenant IDs as grants.

Future API adapters MUST use fixed configured upstream origins, allowlisted paths/methods, bounded bodies, timeouts and response validation. Reject unexpected redirects. Do not build an arbitrary proxy or accept a URL from the browser. Forward only contract-required headers and cookies; never copy all incoming credentials.

## Browser and mutation defenses

Validate the exact trusted Origin for browser mutations under the actual API contract. Apply required CSRF protection to session-authenticated writes, including logout and MFA changes. CORS, SameSite and same-origin routing alone are insufficient. Do not derive trusted origins from Host or untrusted forwarded headers.

Use production HTTPS and host-only HttpOnly session cookies with appropriate Secure and SameSite attributes. Do not widen cookie Domain to share platform and organization sessions. Review cookie path, expiration and clearing behavior.

Private responses must be no-store. Secrets must not enter URLs, browser storage, RSC props, analytics, logs, screenshots or fixtures. Escape untrusted text; avoid unsafe HTML, arbitrary script URLs and secret-bearing third-party integrations.

## Deployment protections

Review CSP, framing, referrer policy, MIME protection and HTTPS at the actual deployment boundary. A CSP must be compatible with the installed Next.js rendering model; do not weaken it with blanket unsafe allowances to silence errors.

Security reviews must cover denied requests, replay, stale sessions, cache isolation, response redaction and failure paths. Do not claim effective database RLS or production isolation from frontend checks.
