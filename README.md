# Akiba Admin

Platform administration frontend using Next.js App Router, React, strict TypeScript and CSS Modules. Read [AGENTS.md](AGENTS.md) and the [.agents rules](.agents/README.md) before contributing.

## Human-run commands

Run commands from app/admin. Install dependencies with npm ci when needed; do not mix package managers.

For the initial Prettier setup, run the following yourself to install the pinned formatter and update package-lock.json. The agent has not run an install or changed the lockfile dependency graph:

```sh
npm install --save-dev --save-exact prettier@3.10.1
npm run format
```

Then use the full verification sequence below. Review the formatting diff before committing; the first pass may normalize existing files.

```sh
npm run format:check
npm run lint
npm test
npm run build
```

Only start the development server when requested; dev is separate from verification. Check the frontend/API port and trusted-origin configuration before integration. The authentication unit suite uses Node's built-in test runner and TypeScript stripping (Node 22.18+). Prettier uses .prettierrc.json and .prettierignore. No third-party test runner or typecheck script is configured.

Start the frontend separately when needed:

```sh
npm run dev
```

## Organization directory

`/organizations` lists real platform-managed organizations; `/organizations/[id]`
shows their details. Both use the existing platform session and require
`platform.organizations.read`. The server adapter reuses the authenticated transport,
configured API origin, platform-only cookie allowlist, response limits, timeouts,
and no-store reads. Backend authorization remains mandatory on every request.

Verified backend contracts:

- `GET /api/v1/platform/organizations`: `limit` (default 20, maximum 50), optional
  `status` and UUID `cursor`; returns `{ items, nextCursor }`.
- `GET /api/v1/platform/organizations/:id`: returns `id`, `name`, `slug`, `status`,
  `createdAt`, `updatedAt`, `activatedAt`, `suspendedAt`, and `archivedAt`.
- Statuses: `PENDING`, `ACTIVE`, `SUSPENDED`, `ARCHIVED`. The default list excludes
  archived records. Select Archived explicitly to inspect them.

The directory follows the gym-admin reference's `OrganizationList`, `OrganizationCard`,
`OrganizationSearch`, `OrganizationStatusFilter`, `OrganizationStatusBadge`,
`OrganizationDetails`, `OrganizationProblem`, `PageHeader` and `Pagination` component
structure. Responsive cards, a compact expanding search, a status popover and numbered
pagination replace the table. Each styled component owns its matching CSS Module.

Status changes reset pagination. The URL retains status, page size, current cursor
and up to 20 prior cursor breadcrumbs. Numbered pages refer only to visited pages
and the server-confirmed next page; no total is invented. Forward navigation stops
at the breadcrumb limit, as in the reference. Changing status or returning to page 1
restarts the history. An unavailable cursor requires a restart from page 1.
Cards open read-only `OrganizationDetails` dialogs using the authenticated registry
snapshot. The existing `/organizations/[id]` route still reads the detail endpoint.
Dialog dates and card dates use Kigali time (UTC+2); the direct detail route labels UTC.

Organization data is server-rendered behind the protected layout and is not stored
in shared caches or browser storage. The router owns navigation responses, so no
client request effects can overwrite newer navigation. A confirmed 401 redirects
to sign-in; 403 displays access denied; 404 displays unavailable information;
network and service failures display a retryable local error. No mutations or
additional CSRF protocol are introduced by these GET reads.

**Global search is blocked by the current API:** it accepts no search parameter and
returns no total count. Matching the reference, `OrganizationSearch` filters only
records already loaded on the current page. Its accessible label and result summary
explicitly identify that scope. This does not implement a server-wide search.
Contact details, approval actors, owner enrollment and public hostname readiness
are not returned by this API and are not fabricated. Registration and lifecycle
actions remain out of scope.

`test/organizations.test.mjs` covers DTO validation, safe errors, cursor navigation,
return-link restrictions and permission-aware read behavior with isolated synthetic
fixtures. These tests do not establish live API authorization or browser behavior.
Run the verification sequence above, then check live listing/detail navigation,
filter reset, browser back/forward, session expiration, 403 handling, keyboard use,
slow loading and narrow/zoomed layouts. Browser/component tests and live backend
integration have not been executed by the agent.

## Platform authentication

### UI icons

All application UI glyphs use Hugeicons Stroke Rounded through the shared `Icon` component in
`src/components/shared/icon.tsx`. It maps existing semantic names to static named imports from
`@hugeicons/core-free-icons` and renders them with `@hugeicons/react`. Add new mappings there rather
than introducing another icon library, custom SVG paths or remote icon requests. Decorative icons
are hidden from assistive technology; icon-only controls keep their own accessible names. The
primitive owns `icon.module.css` and uses currentColor for the existing light theme.
Next's import optimization is configured for the free icon pack to limit barrel-import processing.

The manifest pins the renderer and free icon pack. Run `npm install` to update the lockfile before
verification or using `npm ci`. Installation, build and browser verification have not been run by
the agent. Follow `.agents/icons.md` for future icon changes.

### Route groups and application theme

Authentication UI pages and their shared route layout live under src/app/(auth). The login file is src/app/(auth)/login/page.tsx; its URL remains /login. The group layout renders the reusable AuthScreen presentation once, including while the page checks the session.

Authorized platform pages live under src/app/(platform), whose layout requires a verified full platform session. API handlers remain in src/app/api/auth. Route groups organize pages without changing URLs, and never replace backend permission checks.

Akiba uses a light-only theme with primary color #3E0F8D and the Outfit variable font, optimized through next/font. The root loads one Latin font family with swap behavior; browsers receive self-hosted font assets rather than a Google stylesheet. Build-time font retrieval still requires an available font download/cache.

globals.css centralizes the purple palette, semantic status colors, h1–h6 scale, spacing, font weights, radii, shadows, stacking layers, focus treatment and common element/accessibility defaults. Component-specific styles stay in each component's matching CSS Module. No operating-system dark-mode override or theme persistence is used. Forced-colors and reduced-motion accessibility remain supported.

localStorage and sessionStorage are prohibited for all application data, including tokens, profiles, permissions, drafts and preferences. No current application code uses either API. ESLint rejects direct globals and named property access/destructuring; do not bypass the policy with dynamic aliases or persistence libraries. Transient UI state stays in memory, session credentials stay in backend-managed HttpOnly cookies, and only the existing double-submit CSRF cookie is intentionally readable.

### Configuration and prerequisites

Copy .env.local.example to an untracked .env.local if it does not already exist. The example matches the API examples: Next runs at http://localhost:4000 and Nest at http://localhost:3000. Both services must be started by the human. No frontend database connection or authentication secret is needed.

Both npm run dev and npm run start select port 4000 by default. The API's configured default is port 3000, so the two services do not compete for the same listener.

- AKIBA_ADMIN_ORIGIN must exactly match the API's PLATFORM_ADMIN_ORIGIN, including scheme and port, and the origin opened in the browser.
- AKIBA_API_ORIGIN is the server-only upstream origin and must match the API's accepted API_PUBLIC_ORIGIN authority. It must resolve to the API, not back to Next. Do not configure an arbitrary internal authority that the API rejects.
- In local HTTP development the API must use PLATFORM_AUTH_COOKIE_SECURE=false. HTTPS frontend origins require the API's secure cookie configuration. Production requires HTTPS for both origins and PLATFORM_AUTH_COOKIE_SECURE=true.
- .env.production.example contains deployment placeholders, not deployed hostnames. Provide verified values through the deployment environment.
- Existing staff use normal sign-in. The first pending Platform Owner can complete the operator-authorized `/enroll/platform-owner` flow after the matching API and canonical database migration are deployed and verified. No browser action can reserve another owner or bypass authentication.

### First platform owner setup

The API operator first reserves the sole pending owner and explicitly sends an enrollment email
through the configured Resend adapter. The fixed auth-group route `/enroll/platform-owner` uses the
same light Outfit/primary-purple layout and shared controls as sign-in. The email includes a fixed
setup-page link and a separate single-use setup code to paste into the form. The proof never enters
a URL, browser history, server props or browser storage. Do not attach
analytics, session replay, third-party QR services or link tracking to enrollment messages/pages.

The user explicitly continues, creates and confirms a 8-character-minimum password, manually enters
the setup key into a time-based authenticator, then verifies a six-digit code. Activation displays ten
recovery codes once, requires a local saved-codes acknowledgment and returns to `/login` for normal
authentication with a fresh code. The acknowledgment is UI guidance, never identity proof. No admin
session is issued during setup. Secrets remain only in short-lived UI memory and approved HttpOnly
cookies; there is no localStorage or sessionStorage persistence.

Six fixed `/api/auth/enrollment/{exchange,status,password,setup,complete,cancel}` adapters enforce the
exact browser Origin, bounded DTOs, approved cookies, no-store responses and matching CSRF for every
operation after mailbox exchange. Upstream bodies are validated and reduced before reaching the
browser; there is no generic proxy or caller-selected recipient/user/role. The API remains authoritative
for pending-state eligibility, role binding, expiration, attempts and transactional activation.

After a timeout, check setup status before resubmitting. Refresh can resume password/MFA progress;
explicit key regeneration invalidates the previous unverified key and is limited by the API. An
uncertain final activation goes to normal sign-in instead of replaying completion. If final recovery
disclosure was lost, codes cannot be redisplayed; use approved authenticated MFA management to replace
them. Expired or cancelled setup requires a fresh operator email. Never manually activate identities.

Backend prerequisites: reviewed/applied `20261115120000_platform_owner_enrollment`, regenerated/built
`@nexcoderw/akiba-db`, matching API, independent authentication/TOTP keys, verified Resend sender and
`PLATFORM_OWNER_BOOTSTRAP_ENABLED=true` during enrollment only. Origins must match exactly. No new
frontend secret or public feature flag is required. This flow still needs human formatting, checks,
browser/keyboard/narrow-screen testing and a real development email round trip; no production readiness
is claimed. Existing managed-owner/RLS and deployment release blockers remain.

Browser authentication traffic uses fixed same-origin Next adapters that contact the canonical API.

| Browser route       | Method | Canonical API route              | Contract                                                                             |
| ------------------- | ------ | -------------------------------- | ------------------------------------------------------------------------------------ |
| /api/auth/login     | POST   | /api/v1/platform/auth/login      | Email/password; MFA_REQUIRED, expiry and available methods                           |
| /api/auth/mfa/email | POST   | /api/v1/platform/auth/mfa/email  | Empty request with pending challenge and CSRF proof; code expiry and resend guidance |
| /api/auth/verify    | POST   | /api/v1/platform/auth/mfa/verify | Exactly one authenticator, recovery or email proof; method-specific result           |
| /api/auth/session   | GET    | /api/v1/platform/auth/me         | Full verified platform session; narrow safe profile returned                         |
| /api/auth/logout    | POST   | /api/v1/platform/auth/logout     | Server revocation and cookie clearing; 204 only on confirmation                      |

The API sets origin-bound HttpOnly challenge/session cookies and a readable double-submit CSRF cookie. The adapters validate exact browser Origin for mutations, compare CSRF cookie/header proofs for email delivery, verification and logout, and send the configured Origin upstream. Session GET requires a valid Origin or same-origin Fetch Metadata. No incoming Host, forwarded host, user IDs or permission headers establish authority. Cookie attributes and response shapes are checked before forwarding. Terminal MFA cookie clearing reaches the browser. Secrets and upstream CSRF response fields are not copied into browser JSON; only the CSRF cookie is intentionally JavaScript-readable.

Requests and upstream responses have bounded bodies and timeouts; redirects are rejected. API problems are mapped to safe authored messages and correlation IDs. No raw exception/detail field is displayed. Authentication content is no-store and framing/referrer protections are configured. There is no shared session cache: React.cache deduplicates only one server render.

### Login, MFA and protected pages

/login checks the existing server session behind Suspense. A valid full session redirects to /. A confirmed missing/expired session shows the password form. A 403 shows access unavailable; temporary service failures show a retryable state. No private content streams before verification.

The login form reuses shared Input, Form, Button and Icon, including a backward-compatible trailing password-visibility action. Validation follows login limits rather than imposing a new password-creation policy. Passwords remain in native form fields only, are never trimmed or stored in React/browser persistence, and are cleared when advancing to MFA. Submission gates block repeated clicks and Enter.

Password success leads to verification. TOTP uses the real MFA endpoint, then `/me` must confirm a full session before a hard navigation clears the login navigation cache. The backend verifies each code and enforces challenge expiry and consumption. After refresh, a pending HttpOnly cookie can surface the authenticator form. Back to sign in clears local fields and state. A subsequent password login supersedes the previous challenge.

The authenticator is the default whenever available. When the API offers email verification, the admin can request a code, enter or paste it, and resend after the API cooldown. An `email_verified` result confirms mailbox access and offers a server-confirmed return to sign-in. Workspace access still requires the authenticator. Recovery-code verification returns `mfa_recovery_required` and also keeps the workspace closed. After refreshing a pending challenge, restart password sign-in to see the available email and recovery options. Email delivery uses the API's existing Resend settings and requires no admin environment variable.

The (platform) route group renders a shared responsive navbar and sidebar after server-side session verification. The navbar displays the verified account name and email and uses the confirmed server logout flow. Sidebar destinations are centralized in `src/constant/navigation-links.ts`; Dashboard is the verified account landing page, while Organizations and Users currently show explicit unavailable-yet pages without implying those management features exist. The group layout centralizes session protection, and protected pages must still verify access near their data reads/actions; a layout alone is insufficient.

Only the existing / landing route is an approved post-login destination. External, encoded, protocol-relative, login-loop and unimplemented destinations fall back to /. Add future routes only with verified permission requirements.

The client session provider blocks content during checks, discards obsolete results and revalidates on navigation, focus, page restoration, visibility return and meaningful user input (at most once per minute for activity checks). It deliberately does not poll an idle tab: the backend's /me refreshes idle expiry. Absolute expiration has a local timer; idle expiry/revocation is confirmed at the next real check/protected request. The API does not expose idleExpiresAt, so this UI does not manufacture an idle deadline or claim instantaneous server-revocation notification.

Confirmed 401 responses invalidate the protected view; 403 and network/server errors remain distinct blocked states with retry. Logout confirms backend revocation before clearing the frontend view and hard-navigating to login. A sign-out BroadcastChannel notifies other open tabs without transmitting secrets. Deployment must configure trusted proxy/client-IP handling and edge rate limiting: these adapters do not forward untrusted client IP headers, so the backend may observe a shared frontend egress address.

### Authentication verification

The native unit suite in test/auth.test.mjs covers input contracts, full-session assurance, restricted recovery, safe errors, approved redirects, CSRF comparison, trusted origins and cookie isolation/attributes. It does not establish browser rendering, interaction accessibility or live backend guarantees. No checks have been executed by the agent.

test/storage-policy.test.mjs exercises the configured ESLint restrictions against direct, qualified, bracket and destructured browser-storage access, while allowing transient in-memory state. These are authoring-policy checks rather than a browser sandbox; runtime authentication still depends on the canonical backend and protected cookies.

After running format:check, lint, npm test and build, manually verify the real flow against a permitted development API: password failure/success, TOTP failure/success/expiry, refresh with pending MFA, required labels and visibility toggle, rapid repeated submissions, restricted recovery, existing-session redirects, server revocation/expiration, safe retry after network failure, 403 handling, confirmed logout, multiple tabs, narrow layouts, keyboard/focus, reduced motion and the light theme even with a dark operating-system preference. Browser/component automation and deployed end-to-end verification remain outstanding; no frontend test framework was installed.

## Shared components

Import components directly from src/components/shared; no additional dependency is required.

Each styled component file imports its own same-name CSS Module. Components do not share module files; global CSS contains shared design tokens and application foundations. Reusable Field markup owns field.module.css while each consuming control owns its own control styles.

| Module       | Exports                 | Behavior                                                                                  |
| ------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| button.tsx   | Button                  | Icons, variants, sizes, full width, pending state and async click locking                 |
| form.tsx     | Form                    | FormData submission, synchronous duplicate gate, pending context and safe fallback errors |
| input.tsx    | Input                   | Native input types, leading icon, label, hint and error                                   |
| textarea.tsx | Textarea                | Resizable native textarea with leading icon                                               |
| select.tsx   | Select                  | Native single choice or a checkbox dropdown for multiple choices                          |
| checkbox.tsx | Checkbox                | Native checkbox with label, hint and error                                                |
| radio.tsx    | Radio, RadioGroup       | Native radio navigation and semantic fieldset grouping                                    |
| toast.tsx    | ToastProvider, useToast | Globally mounted top-center notifications                                                 |
| icon.tsx     | Icon                    | Lightweight decorative SVG icons; no remote icon requests                                 |

Inputs, textareas, selects and buttons have default icons and accept a custom decorative React node through icon. Provide unique, stable id values and visible labels for form controls. Native attributes such as required, disabled, autoComplete, minLength and maxLength remain available on inputs and textareas. Checkbox and Radio accept native input attributes and refs. Radio options in one group must share a name; add required to the Radio inputs when selection is mandatory. RadioGroup groups and describes them; it does not invent a validation policy.

### Form composition

This example consumes a caller-supplied saveAction. It does not invent an API endpoint or authorize any operation. The trusted server operation must validate input, permissions and CSRF as applicable.

```tsx
"use client";

import { Button } from "@/components/shared/button";
import { Checkbox } from "@/components/shared/checkbox";
import { Form } from "@/components/shared/form";
import { Icon } from "@/components/shared/icon";
import { Input } from "@/components/shared/input";
import { Radio, RadioGroup } from "@/components/shared/radio";
import { Select } from "@/components/shared/select";
import { Textarea } from "@/components/shared/textarea";
import { useToast } from "@/components/shared/toast";

export function ProfileForm({
  saveAction,
}: {
  saveAction: (data: FormData) => Promise<void>;
}) {
  const toast = useToast();

  return (
    <Form
      onSubmitAction={async (data) => {
        await saveAction(data);
        toast.success("Changes saved.");
      }}
    >
      <Input
        id="profile-name"
        name="name"
        label="Name"
        required
        autoComplete="name"
        maxLength={100}
        icon={<Icon name="user" />}
      />
      <Input
        id="profile-email"
        name="email"
        type="email"
        label="Email"
        required
        autoComplete="email"
      />
      <Select
        id="profile-language"
        name="language"
        label="Language"
        required
        options={[{ value: "en", label: "English" }]}
      />
      <Select
        id="profile-notifications"
        name="notifications"
        label="Notifications"
        multiple
        options={[
          { value: "security", label: "Security updates" },
          { value: "product", label: "Product updates" },
        ]}
      />
      <RadioGroup id="profile-summary" label="Summary frequency">
        <Radio
          id="summary-daily"
          name="summary"
          value="daily"
          label="Daily"
          required
        />
        <Radio
          id="summary-weekly"
          name="summary"
          value="weekly"
          label="Weekly"
          required
        />
      </RadioGroup>
      <Checkbox
        id="profile-tips"
        name="tips"
        value="yes"
        label="Send helpful tips"
      />
      <Textarea id="profile-notes" name="notes" label="Notes" maxLength={500} />
      <Button type="submit" loadingLabel="Saving…" icon={<Icon name="check" />}>
        Save changes
      </Button>
    </Form>
  );
}
```

Apply layout spacing in the consuming feature's CSS Module. The primitives do not impose a page layout.

### Buttons and duplicate submission

- Button defaults to type="button" to prevent accidental form submission. Use type="submit" explicitly.
- Form captures FormData, including the submitter, before changing pending UI. A ref blocks repeated submit events immediately, including Enter and rapid clicks. All shared submit buttons inside it become disabled and show their loading state until the returned promise settles.
- Standalone Button awaits a returned onClick promise and blocks further clicks while it runs. Return/await the actual operation; fire-and-forget work cannot be tracked. Do not combine an asynchronous submit-button onClick with a separate form operation: async click actions cancel native submission to avoid running both.
- For React form actions, Button also observes useFormStatus. Use Form for the explicit synchronous submit gate, or implement equivalent submission handling in the feature.
- pending allows a feature to supply an external loading state. Variants are primary, secondary, danger and ghost; sizes are sm, md and lg. fullWidth fills the parent.
- The three-bead orbit indicator reserves label space and respects reduced motion. No artificial delay or simulated success is added.
- Rejected operations show generic inline feedback. Optional onErrorAction (Form) or onActionError (Button) callbacks can map errors into additional safe UI; they must not throw or log raw secrets. Handle field errors in the feature and pass safe messages through each control's error prop.

These locks prevent overlapping browser interactions, not replay from other tabs or clients. The backend still needs authorization, rate limits and idempotency. A network timeout may leave an unknown result: check the authoritative outcome before retrying. Form requires JavaScript; its POST fallback avoids putting field values in a query string, but is not a progressive-enhancement endpoint.

### Select behavior

Single selection preserves native platform keyboard and mobile behavior. Use value/defaultValue as a string. Multiple selection uses multiple={true}, string arrays, a disclosure button and native checkboxes. Options must have unique, nonempty values. Labels are plain text. Pass disabled on unavailable options.

Both modes accept name, form, required, disabled, hint, error and onValueChange. Use either controlled value with a state-updating onValueChange, or uncontrolled defaultValue. A controlled owner must update its own state on form reset; uncontrolled selections reset to their defaults. Multiple values are standard repeated FormData entries: read them with data.getAll("notifications"). The native backing select supplies required validation and excludes disabled options from submission.

Use Enter/Space to toggle the multiple-choice dropdown, ArrowDown to open and focus its first enabled checkbox, Tab to move, and Space to check. Escape, Done, outside pointer interaction and focus leaving the component close it. No focus trap is imposed. Required validation moves focus to the visible trigger when it is the first invalid form control.

Options are supplied by the feature and should be bounded. This is not a remote-search or virtualized picker. Dropdowns render locally: avoid clipping them with overflow-hidden containers; a future modal/portal integration must explicitly handle positioning and focus.

### Toasts

ToastProvider is already mounted in the root layout. Client components call useToast:

```tsx
const toast = useToast();
toast.success("Changes saved."); // Only after confirmed server success.
toast.error("We couldn't load the page. Try again.");
toast.info("Your export is being prepared.");
toast.warning("Review these changes before continuing.");
const id = toast.show({
  title: "Update",
  message: "Settings saved.",
  tone: "success",
  duration: 8000,
});
toast.dismiss(id);
```

Toasts appear at the top center with a maximum stack of four. New entries replace the oldest entry that does not own keyboard focus. Non-error defaults last six seconds; errors remain until dismissal or stack eviction. Set duration: 0 for manual dismissal. Nonzero durations are bounded to 5–60 seconds and pause while hovered, keyboard-focused or the document is hidden. Close buttons and Escape support dismissal; live regions announce messages without moving focus.

Use short safe messages. React renders them as text, not HTML. Keep important errors inline as well: a toast may be replaced. Never pass backend exception strings, credentials, MFA codes or sensitive identity details to notifications. Do not show delivery, approval or security success before the server confirms it.

## Verification

The component implementation has not been browser-tested or built by the agent. Humans should run lint/build above and check:

- Rapid double-click and repeated Enter invoke a deferred form action once; loading clears after success or rejection.
- Standalone async buttons lock until settlement; synchronous controls still work normally.
- Native validation blocks submission; a required empty multiple select focuses its visible trigger.
- Multiple selections serialize with getAll, disabled values are excluded, and uncontrolled forms reset correctly.
- Single and multiple selects work with keyboard, outside click, Escape and long labels.
- Toasts stay top-center, support dismissal/pause, remain bounded and announce through assistive technology.
- Every control has a label, visible focus and useful disabled/error states at narrow widths, high zoom, with a dark operating-system preference (the application remains light) and with reduced motion.

The shared components need no additional runtime dependencies. Prettier is a development-only formatter. The native authentication-policy tests supplement the manual checks above; API integration and server-side guarantees remain the responsibility of the consuming feature and canonical backend.

## Organization lifecycle management

Organization details in the directory and `/organizations/[id]` expose lifecycle controls
using the authenticated platform session. Statuses remain `PENDING`, `ACTIVE`,
`SUSPENDED`, and `ARCHIVED`; there is no frontend-only approved state.

- Suspension requires both read access and `platform.organizations.suspend`, a live
  `ACTIVE` record, and explicit confirmation. The UI warns that reactivation is currently
  unavailable. Cancellation sends no mutation.
- The server action checks the trusted admin Origin, readable CSRF cookie, live platform
  session and permissions. It reads the selected record and checks the exact `updatedAt`
  before calling `POST /api/v1/platform/organizations/:id/suspension` with only
  `{ expectedUpdatedAt }`. The existing transport forwards only approved platform cookies
  and the CSRF header, with timeouts, bounded responses, and no shared caching.
- Success requires a matching `SUSPENDED` DTO with a new version and suspension timestamp.
  The directory and detail route are revalidated. Directory filters and cursor state stay
  in place; records that no longer match a filter may disappear from that view.
- Conflict, rate-limit, and uncertain outcomes require refreshing authoritative data before
  retrying. No lifecycle write is automatically retried. A 401 follows session expiration;
  a 403 remains an access denial. Safe errors remain inline as well as in toasts.
- Approval has no verified separate API endpoint. The existing activation endpoint requires
  `platform.organizations.activate` but currently rejects valid pending/suspended activation
  with 503 because approval/readiness and verified owner MFA evidence are unavailable.
  Authorized users see an explanation; approval/reactivation writes are not exposed.
  Archived records have no restoration action. No owner invitations are created here.

Registration and name editing continue to share the organization form dialog. Success now
requires the response to match the submitted name and slug (registration), or selected ID
and advanced version (editing). Uncertain saves require a directory refresh before another
attempt; validation and duplicate-subdomain errors preserve editable fields.

Native Node tests in `test/organization-lifecycle.test.mjs` cover the lifecycle policy,
request DTO, authorization gates, live-state checks, response validation, sanitization,
conflicts, uncertain outcomes, and save-response regressions with injected services.
These tests do not prove live API, database concurrency, or browser dialog behavior.
Browser verification must cover Cancel/Escape, focus restoration, rapid clicks, expiration,
filtered pagination, narrow layouts, and concurrent changes from two administrator tabs.
The Step 4 milestone remains partially complete until backend approval/reactivation
readiness support and runtime verification are available.

## Organization Owner invitation management

The organization details dialog and `/organizations/[id]` now include a permission-aware
Organization Owner section. It shows intended recipient metadata and invitation history;
it does not identify a verified active owner or infer enrollment/MFA readiness.

The verified API base is `/api/v1/platform/organizations/:organizationId/owner-invitations`:

| Operation        | Method and suffix                | Permission                                        | Request and result                                           |
| ---------------- | -------------------------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| List             | GET base, `?limit=20&cursor=...` | `platform.organizations.owners.read`              | Bounded items and nextCursor                                 |
| Create           | POST base                        | `platform.organizations.owners.invite`            | displayName and canonical email; 201 PENDING_DELIVERY record |
| Revoke           | POST `/:invitationId/revocation` | `platform.organizations.owners.revoke-invitation` | Empty body; 200 REVOKED record                               |
| Reserve delivery | POST `/:invitationId/delivery`   | `platform.organizations.owners.send-invitation`   | Empty body; 202 reservation status, not inbox receipt        |

The frontend additionally requires organization read and owner-invitation read permissions
for this management interface and its server handlers. Creation and delivery are allowed
only for PENDING or ACTIVE organizations. Revocation of PENDING_DELIVERY or SENT invitations
remains available on suspended/archived organizations, matching the API's revocation policy.
Accepted invitations cannot be revoked through this operation. The backend makes the final
eligibility and concurrency decisions in its scoped transactions; it accepts no client actor,
role, token, arbitrary expiration or membership assignment.

Every server action, including list reads arriving through POST, validates the trusted admin
Origin, CSRF cookie, verified platform session, exact permission and UUID selectors.
The existing transport retains platform-cookie allowlisting, no-store reads, bounded response
bodies, redirect rejection and timeouts. Before revoke/delivery, the service reads one scoped
20-item page and verifies that the invitation belongs to the selected organization. Stale
page selections require refresh; it never scans unbounded history. Navigation history is
bounded to 20 pages, with no fabricated total counts or server-wide filtering.

Response projection strips tokens, digests, links, provider messages and unexpected fields.
Creating a record neither sends an email nor creates an owner identity/membership/session.
Canonical invitation statuses are PENDING_DELIVERY, SENT, ACCEPTED and REVOKED. There is no
EXPIRED enum; the UI separately notes elapsed recorded expiry at its last refresh. Dates use
Kigali time. Delivery QUEUED/PROCESSING is distinct from provider CONFIRMED, and CONFIRMED does
not prove inbox receipt. FAILED and UNCERTAIN need operator review. No plaintext invitation
proofs, provider secrets or application data are written to browser storage or logs.

Create uses the shared Form/Input/Button components. Delivery and revocation require explicit
confirmation. Buttons and a synchronous request lock prevent overlapping writes. Errors remain
inline and in safe toasts. A 401 redirects to the established expiration flow; 403/network
errors do not log out a valid session. Mutations are never automatically retried. Conflict or
uncertain outcomes disable further writes until a fresh list read succeeds. Closing the error
flow refreshes status. Confirmed operations revalidate organization routes and reload invitation
data while preserving the directory's filters and cursor context. Late responses are ignored
after scope changes/unmounts; conflicting lifecycle/edit controls are locked during dialogs.

Remaining backend capabilities are explicit: there is no resend/reissue route, no platform
owner-identity/enrollment/MFA-readiness endpoint, and activation still fails closed. Delivery
reservation is not a resend mechanism; it is gated on reviewed configuration, persistence
security checks and provider/worker availability. No external email, DNS or database resources
are provisioned by this frontend. Test and live provider availability must be verified by
operators. This milestone remains partially complete pending these dependencies and runtime
verification.

`test/owner-invitations.test.mjs` uses the native Node test runner with injected services to
cover canonical email validation, exact DTOs, action eligibility, server authorization,
request-protection rejection, cross-organization records, secret projection, state conflicts,
uncertain outcomes and delivery semantics. The Step 4 regression suite additionally rejects
suspension responses that alter unrelated lifecycle timestamps. These tests do not establish
live database isolation, provider delivery or browser accessibility. Manually check nested
modal cancellation/Escape, focus restoration, repeated Enter/clicks, narrow/high-zoom layouts,
filtered navigation, expiration and concurrent administration before approval.

### Organization details tabs and owner sheet

The directory details dialog separates Organization details and Organization owner into
independent components. Compact, content-sized controls look like tabs and use native
button keyboard behavior. Organization details remains visible; selecting Organization
owner immediately opens a right-side sheet without an intermediate owner panel.
Invitation data is fetched only when that sheet
is mounted, and is discarded when it closes. The direct detail page uses the same owner
entry point. Recipient cards group identity, invitation status, delivery, lifecycle dates
and eligible actions without presenting invitation recipients as verified account owners.

Owner creation, delivery confirmation and revocation also use the shared dialog's sheet
presentation. The existing permission checks, request guards, uncertain-outcome recovery,
focus restoration and protected pending states remain in place. Parent dialogs cannot
be dismissed during nested actions. Sheets fill the height, use an independently scrolling
body, remain within narrow viewports, and respect reduced motion. Browser verification is
still required for keyboard controls, nested sheets, Escape/cancellation, focus restoration,
mobile layouts and blocked dismissal during writes.
