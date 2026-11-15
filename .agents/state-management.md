# State management

The server owns identity, permissions and persisted business state. The URL may own shareable nonsecret filters, sorting and pagination. Local component state should own short-lived interaction and drafts.

## Minimize duplication

Do not copy server data into client state unless editing or another explicit need requires it. Avoid global stores for page-local toggles. Do not introduce a state/query library without a demonstrated requirement and reviewed dependency change.

Keep derived values derived instead of synchronizing multiple versions through effects. Use a single clear owner for each piece of state.

## Privacy and concurrency

Never persist session tokens, passwords, MFA material or invitation proofs in browser storage or URL state. Scope identity-derived caches to the verified principal and clear them on logout or switching accounts. Avoid mutable process-global user state on the server.

Cancel obsolete requests and ignore stale results. A slower prior search must not overwrite a newer one. Distinguish loading from empty or failed data.

Optimistic updates are suitable only for reviewed reversible operations with rollback. Do not optimistically claim organization approval, delivery, owner activation, MFA completion or privilege assignment.

Refresh from authoritative server results after changes. A cached permission flag can improve display, but cannot authorize a mutation. Review cache lifetimes and invalidation with [nextjs.md](nextjs.md).
