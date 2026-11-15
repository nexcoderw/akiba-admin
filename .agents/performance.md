# Performance

## Rendering and network work

MUST prefer server-rendered content and small interactive islands. Avoid making the entire shell a Client Component for one control. Keep providers narrowly scoped. Avoid redundant hydration, large serialized props and importing server-only modules into the client graph.

Fetch independent authorized resources concurrently after prerequisite access checks. Avoid request waterfalls, duplicate reads and server-to-self HTTP. Deduplicate within a request where appropriate without introducing shared identity caches. Use bounded backend pagination, filters and selected fields; do not download every row for a small table.

Debounce expensive search where useful, cancel stale requests and prevent out-of-order results. Keep typing responsive. Do not poll without an agreed freshness requirement, visibility handling and bounded frequency.

## Assets and interaction

Use existing font optimization, appropriately sized images and reserved dimensions. Defer heavy optional charts, editors and exports until useful. Do not hide essential server content behind client-only rendering merely to reduce an initial metric. Consider the cost of each dependency and import.

Keep loading regions stable, show immediate pending feedback and preserve usable navigation. Avoid layout shifts, blocking full-page spinners, unnecessary rerenders and repeated background requests.

## Evidence

Measure representative navigation, input, large lists and slow/error paths on realistic devices and networks. Record baseline, change, conditions and tradeoffs. Treat p75 LCP ≤2.5 seconds, INP ≤200 milliseconds and CLS ≤0.1 as project targets, not measured achievements. Establish route-specific payload budgets from evidence.

Humans execute profiling and builds unless explicitly authorized otherwise. Never claim speed, bundle reduction or production performance from source inspection alone. See [testing.md](testing.md).
