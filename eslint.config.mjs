import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "localStorage",
          message:
            "Browser persistence is prohibited. Use transient in-memory UI state and server-managed session cookies.",
        },
        {
          name: "sessionStorage",
          message:
            "Browser persistence is prohibited. Use transient in-memory UI state and server-managed session cookies.",
        },
      ],
      "no-restricted-properties": [
        "error",
        {
          property: "localStorage",
          message:
            "Do not access localStorage, including through window, globalThis, self or destructuring.",
        },
        {
          property: "sessionStorage",
          message:
            "Do not access sessionStorage, including through window, globalThis, self or destructuring.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
