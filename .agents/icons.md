# Icons

Hugeicons is the required UI icon library. Use `@hugeicons/react` with static named imports from
`@hugeicons/core-free-icons` (Stroke Rounded). Render icons through `src/components/shared/icon.tsx`;
extend its typed name map when another icon is needed. Do not add another icon library, hand-drawn
SVG UI glyphs, CSS-drawn replacement glyphs, remote icon URLs or the deprecated `hugeicons-react` package.
Brand logos and native browser form indicators are distinct from UI glyphs.

## Consistency and cost

Use one coherent visual family, consistent stroke/weight and deliberate sizes. Import individual
icons by name; never use namespace imports, full-catalog lookup or dynamic full-bundle loading.
Keep the client boundary at the shared icon primitive; do not make pages or layouts client components
just to display an icon. Icons inherit currentColor and retain the primitive's matching CSS Module.

Do not use arbitrary emoji as professional product icons. Avoid remote icon requests that add latency, tracking or availability dependencies.

## Accessibility

Decorative icons should be hidden from assistive technology. Icon-only controls require a meaningful accessible name, visible focus and an adequate hit target. Tooltips supplement labels rather than being the only accessible name.

Pair unfamiliar, destructive or security-sensitive actions with clear text. Do not rely on icon shape or color alone for status.

SVG content must come from trusted sources. Do not inject untrusted SVG markup or allow script/event attributes. Decorative SVG should not capture keyboard focus.

Review icons at small sizes, in supported themes, high contrast and narrow layouts. Do not duplicate text announcements by labeling both the control and its decorative child.
