# Icons

No icon package is currently declared. Reuse suitable existing assets or accessible SVG before proposing a dependency. Do not install a library merely because the reference project used it.

## Consistency and cost

Use one coherent visual family, consistent stroke/weight and deliberate sizes. Import individual icons if an approved library supports it; avoid importing an entire catalog or large runtime for a few symbols.

Do not use arbitrary emoji as professional product icons. Avoid remote icon requests that add latency, tracking or availability dependencies.

## Accessibility

Decorative icons should be hidden from assistive technology. Icon-only controls require a meaningful accessible name, visible focus and an adequate hit target. Tooltips supplement labels rather than being the only accessible name.

Pair unfamiliar, destructive or security-sensitive actions with clear text. Do not rely on icon shape or color alone for status.

SVG content must come from trusted sources. Do not inject untrusted SVG markup or allow script/event attributes. Decorative SVG should not capture keyboard focus.

Review icons at small sizes, in supported themes, high contrast and narrow layouts. Do not duplicate text announcements by labeling both the control and its decorative child.

