# Authentication and session handling

## Canonical authority

Inspect the actual Nest controllers, DTOs, cookies and error contracts before implementing authentication UI. Reuse the backend's session and MFA protocol. Do not invent a second identity system, decode a cookie into trusted authority or assume an endpoint exists.

A pending password, enrollment, challenge or restricted recovery proof is not a full privileged session. Only a backend-confirmed session at the required assurance level may reach protected platform content. Email verification and invitation possession do not automatically satisfy MFA.

## Credentials and challenges

Never persist passwords, TOTP secrets, recovery codes, challenge tokens or session identifiers in localStorage, sessionStorage, URL parameters or analytics. Keep necessary transient secrets narrowly scoped and clear them on completion, cancellation or expiration. Do not echo secrets into errors.

All application use of localStorage and sessionStorage is prohibited, including for profiles, permissions, drafts, preferences and nonsecret state. ESLint rejects direct global access and named property access/destructuring. Do not evade this policy with aliases, computed property names or persistence plugins. Session credentials stay in backend-managed HttpOnly cookies; the approved readable CSRF cookie is used only for the existing double-submit contract.

Support password managers, autocomplete and paste. Use backend-defined expiration, purpose and attempt limits. A UI countdown or disabled button is not enforcement. Do not retry authentication or replay security mutations automatically.

## Session changes

On logout, account switch, expiration, revocation or security-sensitive changes, clear identity-derived client state and invalidate relevant navigation data. Never flash a previous user's private content. Confirm backend cookie clearing instead of displaying success after a failed logout.

Respect restricted recovery and step-up flows; do not grant dashboard access until the backend confirms completion. Handle expired challenges with a clear restart path. Protected server reads and mutations still require authorization even after a layout checked the session.
