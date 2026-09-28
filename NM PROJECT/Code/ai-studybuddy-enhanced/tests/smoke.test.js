const test = require("node:test");
const assert = require("node:assert/strict");

test("project smoke test", () => {
  assert.equal(typeof require("../index"), "function");
});
