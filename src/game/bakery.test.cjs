/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");
const { transform } = require("sucrase");

const moduleResult = { exports: {} };
vm.runInNewContext(transform(readFileSync(`${__dirname}/bakery.ts`, "utf8"), {
  transforms: ["typescript", "imports"],
}).code, { module: moduleResult, exports: moduleResult.exports });
const { isNewOrder } = moduleResult.exports;

test("only a new, dated order with an item counts", () => {
  const order = { _id: "order-1", item: "Julekake", date: "2026-12-14", status: "ny" };
  assert.equal(isNewOrder(order), true);
  for (const change of [{ status: "klar" }, { date: "" }, { item: " " }]) {
    assert.equal(isNewOrder({ ...order, ...change }), false);
  }
});