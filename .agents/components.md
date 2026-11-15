# Components and composition

Default to Server Components. Put browser interaction in small Client Components, with serializable minimal props. Never send credentials, full backend records or unauthorized fields through props or rendered HTML.

## Reuse boundaries

Build shared primitives when repeated behavior and semantics justify them. Keep feature-specific orchestration near the feature. Do not create a universal component with many unrelated booleans or duplicate competing Button, Dialog and FormField implementations.

Prefer composition, explicit variants and clear responsibilities. A visual primitive must not secretly fetch data, change authorization or read global identity. A feature component should expose meaningful inputs and outputs.

Use native elements and preserve accessible names, keyboard behavior, focus, disabled and pending states. A custom control needs equivalent semantics and interaction, not only matching appearance.

## Rendering cost

Avoid broad use client boundaries, deeply nested global providers and copying large data arrays into local state. Lazy-load genuinely optional heavy interactions; do not defer critical content without reason.

Keep markup stable during loading to reduce layout shifts. Review empty, error, long-content and responsive states alongside the happy path.

Current styling is CSS Modules and global CSS. No component library is installed in the starting manifest. Reuse existing patterns before proposing a dependency.

