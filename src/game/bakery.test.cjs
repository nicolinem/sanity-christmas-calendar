/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");
const { transform } = require("sucrase");

const moduleResult = { exports: {} };
vm.runInNewContext(transform(readFileSync(`${__dirname}/bakery.ts`, "utf8"), {
  transforms: ["typescript", "imports"],
}).code, { module: moduleResult, exports: moduleResult.exports, URL });
const { SAMPLE_ORDERS, isNewOrder, isReadyOrder, signHasHttpsLink, signHasStrong, signText } = moduleResult.exports;

test("sample bakery orders have names and goods without satisfying a core door", () => {
  assert.equal(SAMPLE_ORDERS.length, 3);
  for (const order of SAMPLE_ORDERS) {
    assert.ok(order.item && order.orderedBy && order.date);
    assert.equal(isNewOrder(order), false);
    assert.equal(isReadyOrder(order), false);
  }
});

test("only a new, dated order with an item counts", () => {
  const order = { _id: "order-1", item: "Julekake", date: "2026-12-14", status: "ny" };
  assert.equal(isNewOrder(order), true);
  for (const change of [{ status: "klar" }, { date: "" }, { item: " " }]) {
    assert.equal(isNewOrder({ ...order, ...change }), false);
  }
});

test("only a ready published order with a real item counts", () => {
  assert.equal(isReadyOrder({ _id: "order-1", item: "Julekake", status: "klar" }), true);
  assert.equal(isReadyOrder({ _id: "order-1", item: "Julekake", status: "ny" }), false);
  assert.equal(isReadyOrder({ _id: "order-1", item: "  ", status: "klar" }), false);
});

test("the skilt needs readable published text with a genuinely bold span", () => {
  const sign = { _id: "bakery-sign", text: [{ _type: "block", children: [
    { _type: "span", text: "Julekaker", marks: ["strong"] },
  ] }] };
  assert.equal(signText(sign), "Julekaker");
  assert.equal(signHasStrong(sign), true);
  assert.equal(signHasStrong({ ...sign, text: [{ _type: "block", children: [
    { _type: "span", text: "Julekaker", marks: [] },
  ] }] }), false);
  assert.equal(signHasStrong(null), false);
});

test("the optional skilt link needs an HTTPS annotation applied to text", () => {
  const sign = { _id: "bakery-sign", text: [{ _type: "block", children: [
    { _type: "span", text: "Julekaker", marks: ["link-a"] },
  ], markDefs: [{ _key: "link-a", _type: "link", href: "https://example.org/kaker" }] }] };
  assert.equal(signHasHttpsLink(sign), true);
  for (const change of [
    { children: [{ _type: "span", text: "https://example.org/kaker", marks: [] }] },
    { markDefs: [{ _key: "link-a", _type: "link", href: "http://example.org/kaker" }] },
    { markDefs: [{ _key: "link-b", _type: "link", href: "https://example.org/kaker" }] },
    { children: [{ _type: "span", text: " ", marks: ["link-a"] }] },
  ]) assert.equal(signHasHttpsLink({ ...sign, text: [{ ...sign.text[0], ...change }] }), false);
  assert.equal(signHasHttpsLink(null), false);
});