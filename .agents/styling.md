# Styling

Use the existing CSS Modules for component/page styles and global CSS for deliberate shared foundations. Do not introduce Tailwind, CSS-in-JS or a second styling system without explicit scope and dependency review.

## One CSS Module per component file

Every styled component file MUST own a colocated CSS Module with the same basename: input.tsx imports input.module.css, select.tsx imports select.module.css, and so on. Multiple exports in one component file may use that file's module.

MUST NOT import another component's CSS Module, collect unrelated components in controls.module.css, use cross-component CSS imports or composition to bypass ownership, or move component selectors into global CSS. Each module contains only its owner's selectors and states. Shared design values remain CSS custom properties in globals.css.

Reuse a shared component by rendering it; its implementation owns its styles. If different components need similar low-level declarations, keep those declarations local while using the same tokens. Do not introduce a shared stylesheet solely to avoid those local declarations. Pure types, hooks and helpers with no visual output do not need empty CSS files.

## Visual system

Define reusable semantic tokens for colors, spacing, typography, borders, radii and elevation when the product requires them. Keep component variants consistent. Avoid scattered magic values and large global selector overrides.

Preserve the existing next/font setup unless a reviewed design change requires otherwise. Avoid duplicate font requests or unnecessary weights.

## Complete states

Style hover, focus-visible, active, disabled, pending, invalid, selected and unavailable states. Do not use color alone to convey meaning. Maintain contrast in every supported theme and avoid implying dark-mode support without checking it.

Respect reduced motion. Prefer inexpensive animations using opacity/transform where appropriate and avoid animating layout across large regions. Motion must not delay task completion.

## Maintainability

Keep selectors locally scoped and specificity manageable. Avoid !important as a routine fix, broad element overrides and inline styles for reusable variants. Dynamic values may use deliberate CSS variables.

Review long content, narrow layouts, high zoom and loading dimensions. CSS must never act as an authorization boundary; unauthorized content must not be rendered.
