import assert from "node:assert/strict";
import test from "node:test";
import { Linter } from "eslint";
import configuration from "../eslint.config.mjs";

const policy = configuration.find(
  (entry) =>
    entry.rules?.["no-restricted-globals"] &&
    entry.rules?.["no-restricted-properties"],
);

function diagnostics(source) {
  assert.ok(
    policy,
    "The application must configure browser-storage restrictions.",
  );
  return new Linter().verify(
    source,
    [
      {
        rules: policy.rules,
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: "module",
          globals: {
            localStorage: "readonly",
            sessionStorage: "readonly",
            window: "readonly",
            globalThis: "readonly",
            self: "readonly",
          },
        },
      },
    ],
    { filename: "storage-policy-fixture.js" },
  );
}

for (const source of [
  'localStorage.setItem("token", "example");',
  'sessionStorage.getItem("profile");',
  'window.localStorage.setItem("preference", "example");',
  'window["localStorage"].getItem("profile");',
  "globalThis.sessionStorage.clear();",
  'self["sessionStorage"].getItem("draft");',
  "const { localStorage: store } = window;",
  "const { sessionStorage } = globalThis;",
  "const store = window.localStorage;",
]) {
  test(`browser storage is rejected: ${source}`, () => {
    const messages = diagnostics(source);
    assert.ok(
      messages.some(
        (message) =>
          message.severity === 2 &&
          ["no-restricted-globals", "no-restricted-properties"].includes(
            message.ruleId,
          ),
      ),
    );
  });
}

test("transient in-memory state remains allowed", () => {
  assert.deepEqual(
    diagnostics('const draft = new Map(); draft.set("name", "Example");'),
    [],
  );
});
