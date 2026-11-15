# Forms and validation

## Input contracts

Follow verified backend DTOs. Validate early for user feedback and again at the trusted server boundary. Reject unexpected privileged fields. Apply explicit bounds to strings, collections and uploads.

Normalize only under the actual contract. Never trim or transform passwords. Email and slug canonicalization must agree with the API, not create a competing identity policy. Use appropriate input types, input modes and autocomplete values. Do not disable paste or password managers.

## Submission

Use clear labels, useful hints and specific safe validation messages. Preserve nonsensitive drafts after errors. Associate errors with inputs and offer focus/navigation to invalid fields. Validate at sensible times; do not distract users with premature errors while typing.

Show pending state immediately and prevent duplicate submission. A disabled button does not enforce idempotency, authorization or rate limiting. Confirm success only after the server confirms the intended outcome.

## Sensitive and conflicting operations

Keep credentials and proofs out of URLs, persistence and analytics. Clear transient secrets when no longer needed. Never prefill hidden role IDs or approval flags as a substitute for trusted assignment.

Handle 409/conflict and stale versions without silently overwriting changes. If a mutation times out, its outcome may be unknown; do not blindly resubmit. Security-sensitive operations require the backend's actual CSRF and step-up flow, not a visual confirmation alone.

Test keyboard submission, slow requests, repeated clicks, expiration, rejection and recovery.

