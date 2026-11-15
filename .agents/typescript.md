# TypeScript and data contracts

Preserve strict TypeScript. Use meaningful explicit types at public module boundaries and inference for clear local values. Avoid any, unchecked assertions, non-null assertions and suppression comments as shortcuts.

## Untrusted input

Use unknown for untrusted payloads and caught errors, then narrow or validate. Type assertions do not validate network data. Parse request/response shapes at the actual trust boundary and handle missing or malformed fields safely.

Model distinct states explicitly so pending authentication cannot be mistaken for a full session. Keep platform and organization context types separate. Treat IDs as opaque values, not grants.

## DTOs and serialization

Use verified canonical API contracts. Do not duplicate Prisma schemas in the frontend or import database runtime code into browser bundles. Return minimal DTOs rather than full backend entities.

Handle dates, decimals, large integers, nullability and enums intentionally. Do not lose monetary or identifier precision through Number conversion. Only serialize values supported by the server/client boundary.

Avoid unnecessary generic frameworks and type tricks that obscure behavior. Prefer readable discriminated unions and small domain types.

Keep @/* imports aligned with the actual src alias. Follow current module conventions and avoid circular imports. A successful type check does not establish runtime validation or authorization.
