# Hooks and effects

Use hooks only in valid Client Component/custom-hook contexts. Follow hook ordering and dependency rules. Do not suppress exhaustive dependency warnings to freeze a stale identity or callback.

## Effects

Effects synchronize with external systems; they are not the default way to derive values or load all initial page data. Prefer server fetching where appropriate. Avoid effects that copy props into state or trigger repeated request loops.

Clean up timers, subscriptions, observers and pending requests. Account for development lifecycle replay and remounts. Do not perform a destructive or security-sensitive mutation automatically on mount.

## Asynchronous behavior

Use cancellation and stale-result protection. Prevent late callbacks from updating the wrong page, user or selected resource. Handle failure and unknown outcomes explicitly.

Custom hooks should have a coherent responsibility and typed contract. Do not hide global stores, cross-user caches or unbounded polling inside an innocently named helper.

React Compiler is enabled. Do not add useMemo/useCallback everywhere by habit; measure expensive work and follow the installed compiler guidance. Memoization must not be relied on for correctness or authorization.

Do not use mount-only guards to conceal hydration bugs. Read browser APIs only in supported contexts and keep initial markup consistent.

