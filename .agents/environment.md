# Environment and configuration

## Secrets and origins

Inspect variable names and contracts without dumping actual .env values. Never copy credentials into examples, documentation, screenshots, command output or Git. Use placeholders in examples.

NEXT_PUBLIC variables are public and may be embedded at build time. They MUST NOT contain session secrets, private upstream credentials or internal-only configuration. Keep sensitive adapters and configuration validation on the server.

Configure explicit trusted frontend and API origins. Do not derive them from request Host, forwarded headers or arbitrary return URLs. Review ports against the actual development setup; the default Next port may conflict with the API. Do not silently change API ports or trusted-origin settings.

## Safe defaults

Public UI preferences may have harmless defaults. Missing security-sensitive settings must fail closed with a sanitized actionable configuration error. Never enable mock authentication, relaxed CSRF or bypass flags as a convenience default.

Development and production examples must express deliberate boolean defaults as true/false. Production must not inherit localhost origins, insecure cookies or development bypasses. Reconcile values with backend requirements; do not invent unused variables.

The current .gitignore ignores .env* files. Add an example only when needed, with explicit ignore exceptions and secret review. Do not change actual environment values merely because an example exists. No database credentials or direct database connections belong in this frontend.
