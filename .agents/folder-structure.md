# Folder and ownership structure

## Current layout

The application uses src/app for App Router routes, layouts and route files; public contains static assets. Preserve those conventions. Do not reorganize the starter solely to create empty architecture folders.

## Growth rules

Colocate route-specific components and CSS near the route when that improves clarity. Extract genuinely reusable UI primitives into a shared component area once needed. Group substantial feature logic by feature, with explicit server/client boundaries.

Keep secret-bearing configuration and transport in clearly server-only modules. Avoid shared barrel exports that accidentally pull server code into the browser. Dependency direction should remain understandable.

An API route handler or Server Action is a public boundary, not an internal trusted function. Its location does not replace validation, authentication or CSRF checks.

## Ownership limits

Do not add Prisma schema files, database migrations, direct database clients or backend authorization engines. Those belong to api/db and api/api. Frontend adapters consume verified contracts.

Use App Router route groups and private folders only according to the installed framework docs. Avoid accidental public routes from organizational folders.

Do not create docs directories, completion reports, generated command scripts or empty feature scaffolding by default. Maintain relevant existing documentation and these explicitly requested rules.
