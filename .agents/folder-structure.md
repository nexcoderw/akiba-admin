# Folder and ownership structure

## Current layout

The application uses src/app for App Router routes, layouts and route files; public contains static assets. Preserve those conventions. Do not reorganize the starter solely to create empty architecture folders.

Authentication UI pages live under src/app/(auth), with the shared authentication route layout in (auth)/layout.tsx. The login route is (auth)/login/page.tsx and still resolves to /login. MFA currently remains a step inside that page; do not create placeholder routes.

All authorized platform pages live under src/app/(platform) and inherit its verified-session layout. Keep permission checks near protected data access and mutations; a group name or layout alone does not authorize an operation. API adapters remain under src/app/api/auth because they are endpoint handlers rather than UI pages.

Reusable authentication presentation components remain in src/components/auth so both route groups can render safe status and loading views without duplicating their styles.

## Growth rules

Colocate route-specific components and CSS near the route when that improves clarity. Extract genuinely reusable UI primitives into a shared component area once needed. Group substantial feature logic by feature, with explicit server/client boundaries.

Keep secret-bearing configuration and transport in clearly server-only modules. Avoid shared barrel exports that accidentally pull server code into the browser. Dependency direction should remain understandable.

An API route handler or Server Action is a public boundary, not an internal trusted function. Its location does not replace validation, authentication or CSRF checks.

## Ownership limits

Do not add Prisma schema files, database migrations, direct database clients or backend authorization engines. Those belong to api/db and api/api. Frontend adapters consume verified contracts.

Use App Router route groups and private folders only according to the installed framework docs. Avoid accidental public routes from organizational folders.

Do not create docs directories, completion reports, generated command scripts or empty feature scaffolding by default. Maintain relevant existing documentation and these explicitly requested rules.
