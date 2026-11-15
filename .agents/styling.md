# Styling

Use the existing CSS Modules for component/page styles and global CSS for deliberate shared foundations. Do not introduce Tailwind, CSS-in-JS or a second styling system without explicit scope and dependency review.

## Visual system

Define reusable semantic tokens for colors, spacing, typography, borders, radii and elevation when the product requires them. Keep component variants consistent. Avoid scattered magic values and large global selector overrides.

Preserve the existing next/font setup unless a reviewed design change requires otherwise. Avoid duplicate font requests or unnecessary weights.

## Complete states

Style hover, focus-visible, active, disabled, pending, invalid, selected and unavailable states. Do not use color alone to convey meaning. Maintain contrast in every supported theme and avoid implying dark-mode support without checking it.

Respect reduced motion. Prefer inexpensive animations using opacity/transform where appropriate and avoid animating layout across large regions. Motion must not delay task completion.

## Maintainability

Keep selectors locally scoped and specificity manageable. Avoid !important as a routine fix, broad element overrides and inline styles for reusable variants. Dynamic values may use deliberate CSS variables.

Review long content, narrow layouts, high zoom and loading dimensions. CSS must never act as an authorization boundary; unauthorized content must not be rendered.

