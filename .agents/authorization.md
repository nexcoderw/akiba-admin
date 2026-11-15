# Authorization and tenant boundaries

## Platform permissions

This is the platform administration app. Organization membership or an organization role called Owner, Admin or Superadmin MUST NOT grant platform privileges. Inspect the backend's actual effective permissions for each operation; do not introduce role-name shortcuts or frontend-only policy.

Use permission-aware UI to reduce confusion, while treating it as presentation. Nest must check every protected read and write. Never derive authority from hidden navigation, a route segment, a hostname, an email domain, client state or an editable header.

## Resource scope

Treat IDs as selectors, not authorization. Backend-verified context must determine accessible organizations and resources. Do not merge permissions across memberships or reuse cached records between identities. Keep platform and organization cookies, session types, routes and DTOs distinct.

Render only fields the current principal may see. Hiding a field with CSS does not remove it from HTML, RSC payloads or browser memory. Avoid unauthorized resource enumeration through error wording and lookup behavior.

## Live changes

Handle permission revocation and organization suspension on the next server operation. Stale browser claims must not authorize an action. On 401/403, follow the verified error contract and update UI safely; do not bypass checks or endlessly refresh.

Tests must include ordinary tenant users calling platform actions, forged organization IDs, cross-organization resources, stale grants and identity-switch cache leakage.

