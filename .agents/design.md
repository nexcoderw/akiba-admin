# Product design and usability

## Clear hierarchy

Build a professional administrative interface around actual user tasks. Keep page titles, navigation, primary actions and status language consistent. Use a restrained visual system with clear typography, spacing and predictable control placement.

Show real data and truthful states. Do not fabricate metrics, activity, delivery success, approval or readiness. Development fixtures must be explicitly isolated and must never silently replace failed production reads.

## Feedback and confidence

Make the next useful action visible. Explain consequential actions in plain language, including scope and effect. Confirm destructive or privilege-sensitive actions when appropriate, without interrupting routine navigation with unnecessary dialogs.

Show immediate pending feedback, prevent duplicate submission and preserve user context. Prefer local skeletons and progress to full-page blocking spinners. Provide useful empty states, safe retries and clear completion messages based on server confirmation.

Do not expose implementation details, internal flags or database terminology unless the user needs them to make a meaningful decision.

## Information design

Use readable tables with meaningful headings, appropriate density and discoverable filters. Avoid icon-only mystery actions. Format dates, amounts and counts consistently with the actual locale/time-zone contract; never guess currency or lose numeric precision.

Support long names, translated text, keyboard use and small screens. Review [accessibility.md](accessibility.md) and [responsive.md](responsive.md) together. A visually polished screen is incomplete if its task cannot be completed accessibly.
