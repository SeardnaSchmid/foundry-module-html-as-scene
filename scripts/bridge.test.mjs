import assert from "node:assert/strict";
import test from "node:test";

import { injectBridge, parseStoredValue } from "./bridge.mjs";

test("bridge bootstrap runs before the embedded application and escapes snapshot markup", () => {
  const result = injectBridge(
    "<!doctype html><html><head><script>window.applicationStarted=true</script></head></html>",
    { mode: "player", snapshot: { objective: "</script><p>escape</p>" }, storage: null }
  );

  assert.ok(result.indexOf("htmlAsScene") < result.indexOf("window.applicationStarted"));
  assert.ok(result.includes("\\u003c/script>"));
  assert.ok(!result.includes("</script><p>escape</p>"));
});

test("stored JSON is decoded while legacy plain text remains readable", () => {
  const values = new Map([
    ["json", '{"campaign":"TNO"}'],
    ["text", "legacy"]
  ]);
  const storage = { getItem: (key) => values.get(key) ?? null };

  assert.deepEqual(parseStoredValue(storage, "json"), { campaign: "TNO" });
  assert.equal(parseStoredValue(storage, "text"), "legacy");
  assert.equal(parseStoredValue(storage, "missing"), null);
});
