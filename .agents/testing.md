# Verification and testing

## Current tooling and execution

The manifest provides format, format:check, lint, build and test scripts. Prettier is the required formatter; install the declared exact development dependency before running it. Authentication contract and security-policy tests use Node's built-in test runner with TypeScript stripping (Node 22.18+). No third-party component runner or typecheck script is configured. Recheck package.json before recommending commands.

Humans execute checks unless a later instruction authorizes execution. Do not invoke them indirectly. Provide the correct working directory and prerequisites. The required full sequence is npm run format:check, npm run lint, npm test and npm run build. Use npm run format first when formatting corrections are needed. Unit policies do not replace component, browser or live-backend tests.

Do not invent test:e2e or typecheck scripts. Additional test infrastructure requires an explicit dependency/configuration change and human installation where needed.

## Meaningful coverage

For functional changes, add appropriate regression coverage when a supported setup exists. Test observable behavior rather than implementation details. Prioritize:

- Session expiration, restricted MFA/recovery states and logout cleanup.
- Unauthorized platform access, forged IDs and cross-identity cache isolation.
- Origin/CSRF rejection, malformed responses, redaction and unsafe redirects.
- Duplicate submissions, unknown mutation outcomes, stale responses and conflicts.
- Keyboard/focus, labels, errors, narrow layouts and long content.
- Slow networks, bounded requests, loading stability and realistic large datasets.

Do not remove meaningful security tests to make checks pass. Mocks do not prove backend authorization, database isolation or production behavior.

## Reporting

List exact executed commands and outcomes separately from static review. Report unexecuted checks and deployment dependencies explicitly. Documentation-only edits do not require invented unit tests. Performance claims require measurements; accessibility claims require relevant manual verification too.
