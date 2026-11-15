# Navigation and routing

Use App Router conventions and the installed Next.js documentation. Keep route definitions and labels predictable. Distinguish internal navigation from external links and use native semantics.

## Authorization and redirects

Visible navigation may reflect verified permissions, but route access and API operations require server enforcement. Do not use the active route or selected organization as authority.

Accept return destinations only through a reviewed internal-route policy. Reject external origins, protocol-relative URLs, unsafe schemes and ambiguous encodings. Never concatenate untrusted input into redirects. Authentication flows must not redirect secrets through URLs.

After logout, expiration or identity changes, prevent stale private pages and cached state from displaying. Handle unauthorized direct links safely; hiding the menu is insufficient.

## Performance and experience

Understand enabled partial prefetching before changing Link options. Avoid prefetch storms in large lists and speculative requests for sensitive challenge routes. GET navigation must not perform mutations.

Preserve useful nonsecret filter state in the URL. Support browser back/forward behavior and avoid unnecessary full reloads. Show clear active navigation with aria-current. Restore or move focus appropriately after route changes and dialogs.

Provide useful loading, unavailable and not-found states without disclosing unauthorized resources. A link must lead to an implemented destination; do not ship dead controls or simulated navigation as complete functionality.
