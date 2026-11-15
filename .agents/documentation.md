# Documentation

Maintain documentation that helps a developer or operator act correctly. Prefer updating the existing README and relevant rule file over creating parallel explanations.

## Accuracy

Separate implemented behavior, proposed architecture, human verification and deployment requirements. Verify paths, commands, dependencies and endpoint contracts against the repository. Do not claim a BFF, test suite, security header, provider or authentication flow exists because a rule requires one.

Document setup without secrets. Use safe placeholders and explain security-sensitive prerequisites. Distinguish frontend configuration from API/database ownership.

## Scope

Do not create completion reports, audit dossiers, docs directories or commit-plan scripts by default. Deliver task summaries and copy/paste commit commands in the conversation. The .agents directory is the explicitly requested home of engineering rules.

Keep policy centralized: link to the owning topic instead of duplicating long sections that may drift. Update the index when adding or removing a rule.

## Evidence and maintenance

Report exact executed checks and unverified work. Never present source inspection as a live test, performance measurement or production-readiness assessment.

When architecture or tooling changes, update the affected rules in the same task. Preserve the generated Next.js instruction block. Rules guide engineering; they are not executable enforcement, proof of tenant isolation or a substitute for security review.

