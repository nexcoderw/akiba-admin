# Comments

Explain why a non-obvious choice exists, especially trust boundaries, cache exclusions, security ordering, framework constraints and concurrency behavior.

Do not narrate obvious syntax or add banners to every function. Prefer clear names and small functions over comments that explain confusing structure.

## Useful comments

Document why a private response must bypass shared caching, why a redirect is rejected, or why a mutation cannot be retried automatically. Link to a relevant installed guide, contract or issue when it helps future maintenance.

State whether a limitation is current behavior, a deployment dependency or planned work. A TODO must not substitute for required authentication, validation or error handling.

## Sensitive information

Never include live tokens, passwords, MFA secrets, personal account details or production connection strings in comments or examples. Use obviously fake placeholders.

Avoid copying entire external documents into source. Keep explanations close to the code that relies on them and update comments when behavior changes.

Do not claim an invariant is enforced unless the implementation enforces it. For example, a comment saying platform-only is insufficient without backend permission checks.

Review comments during diffs for obsolete assumptions and misleading success claims.
