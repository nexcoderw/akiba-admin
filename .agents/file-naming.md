# File naming and exports

Use predictable names that describe responsibility. Follow neighboring code and framework-required names before introducing a new convention.

## Framework files

Preserve exact App Router special names such as page.tsx, layout.tsx and route.ts. Add loading/error/not-found files only with behavior supported by the installed Next.js version. Do not rename special files to generic component conventions.

Use .tsx for JSX and .ts for modules without JSX. Keep CSS Modules named *.module.css. Follow actual test-runner conventions if a runner is later approved; do not invent discovery patterns.

## Application modules

Prefer descriptive kebab-case filenames for new ordinary modules and PascalCase component/type identifiers. Hooks use use-prefixed camelCase exports. Maintain consistent casing across imports for case-sensitive deployment systems.

Names should reveal server-only transport, validation or feature responsibility when useful. Avoid vague helpers, utils2, final, temp and catch-all common modules.

Prefer explicit exports and avoid broad barrels that blur client/server boundaries or introduce cycles. Use default exports when the framework requires them or an established local pattern warrants them.

Renaming files is not a cosmetic excuse to expand scope. Review import updates and preserve user changes.

