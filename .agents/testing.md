# Verification and testing

## Current tooling and execution

Only lint and build verification scripts exist in the starting manifest. No test runner, test script, typecheck script or formatter is configured. Recheck package.json before recommending commands.

Humans execute checks unless a later instruction authorizes execution. Do not invoke them indirectly. Provide the correct working directory and prerequisites. Existing commands are npm run lint and npm run build; they establish different things and neither replaces security or browser tests.

Do not invent npm test, test:e2e, format:check or typecheck scripts. A proposed testing setup requires an explicit dependency/configuration change and human installation.

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

