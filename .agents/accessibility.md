# Accessibility

## Required design target

Target WCAG 2.2 AA and verify relevant behavior; do not claim certification from source inspection. Prefer native semantic HTML before ARIA. Use buttons for actions, links for navigation, real labels for inputs and meaningful heading order.

All workflows must work with a keyboard. Keep focus visible, logical and unobscured by sticky UI. Do not use positive tabindex or click-only divs. Icon-only controls need accessible names. Decorative icons must not add duplicate announcements.

## Forms, dialogs and feedback

Associate hints and errors with fields; identify invalid inputs programmatically and in text. Announce meaningful asynchronous outcomes without repeatedly announcing every keystroke. Do not rely on color alone.

Use ARIA attributes supported by the element's actual implicit or explicit role. Do not add aria-invalid to native radio inputs or disclosure buttons; associate their error text with aria-describedby, expose group validity where supported, and use data-invalid for visual styling. Do not change an element's role or suppress a lint rule merely to allow an unsupported attribute.

Dialogs require an accessible name, appropriate focus entry/containment, a clear close path and focus restoration. Use established accessible primitives when available; do not assume installing a library is authorized.

Tables need headers and understandable relationships. Loading and empty states must be understandable to assistive technology. Navigation should expose the current page.

## Visual and input checks

Maintain sufficient contrast, readable text, reduced-motion behavior and usable high-contrast modes. Design generous pointer targets, aiming for at least 44 CSS pixels where practical. Support text enlargement and reflow at high zoom without losing controls or content.

Human verification must cover keyboard-only use, screen-reader announcements, focus recovery, zoom and narrow viewports. Automated checks, if later configured, supplement manual testing.

