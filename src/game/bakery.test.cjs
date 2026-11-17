/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");
const { transform } = require("sucrase");

const moduleResult = { exports: {} };
vm.runInNewContext(
  transform(readFileSync(`${__dirname}/bakery.ts`, "utf8"), {
    transforms: ["typescript", "imports"],
  }).code,
  { module: moduleResult, exports: moduleResult.exports, URL },
);
const {
  SAMPLE_ORDERS,
  isNewOrder,
  isReadyOrder,
  morningRushReadyCount,
  signHasHttpsLink,
  signHasStrong,
  signText,
} = moduleResult.exports;

test("morning-rush samples include one complete and two deliberately incomplete orders", () => {
  assert.equal(SAMPLE_ORDERS.length, 3);
  assert.ok(SAMPLE_ORDERS.every(({ orderedBy }) => orderedBy));
  assert.equal(SAMPLE_ORDERS[0].item, "Lussekatter");
  assert.equal(SAMPLE_ORDERS[0].date, "2026-12-14");
  assert.equal(SAMPLE_ORDERS[1].date, undefined);
  assert.equal(SAMPLE_ORDERS[2].item, undefined);
  assert.ok(SAMPLE_ORDERS.every((order) => !isNewOrder(order)));
  assert.ok(SAMPLE_ORDERS.every((order) => !isReadyOrder(order)));
});

test("only a new, dated order with an item counts", () => {
  const order = {
    _id: "order-1",
    item: "Julekake",
    date: "2026-12-14",
    status: "ny",
  };
  assert.equal(isNewOrder(order), true);
  for (const change of [{ status: "klar" }, { date: "" }, { item: " " }]) {
    assert.equal(isNewOrder({ ...order, ...change }), false);
  }
});

test("only a ready published order with a real item counts", () => {
  assert.equal(
    isReadyOrder({
      _id: "order-1",
      item: "Julekake",
      date: "2026-12-14",
      status: "klar",
    }),
    true,
  );
  assert.equal(
    isReadyOrder({ _id: "order-1", item: "Julekake", status: "ny" }),
    false,
  );
  assert.equal(
    isReadyOrder({ _id: "order-1", item: "  ", status: "klar" }),
    false,
  );
});

test("morning rush counts only the three samples and the player's order", () => {
  const ready = (order) => ({ ...order, status: "klar" });
  const orders = [
    ...SAMPLE_ORDERS.map((order) =>
      ready({
        ...order,
        item: order.item ?? "Julekake",
        date: order.date ?? "2026-12-14",
      }),
    ),
    ready({ _id: "player-order", item: "Kringle", date: "2026-12-14" }),
    ready({ _id: "some-other-order", item: "Brød", date: "2026-12-14" }),
  ];
  assert.equal(morningRushReadyCount(orders, "player-order"), 4);
  assert.equal(morningRushReadyCount(orders, undefined), 0);
  assert.equal(
    morningRushReadyCount(
      orders.map((order) =>
        order._id === "bakery-sample-kari"
          ? { ...order, item: undefined }
          : order,
      ),
      "player-order",
    ),
    3,
  );
});

test("the skilt needs readable published text with a genuinely bold span", () => {
  const sign = {
    _id: "bakery-sign",
    text: [
      {
        _type: "block",
        children: [{ _type: "span", text: "Julekaker", marks: ["strong"] }],
      },
    ],
  };
  assert.equal(signText(sign), "Julekaker");
  assert.equal(signHasStrong(sign), true);
  assert.equal(
    signHasStrong({
      ...sign,
      text: [
        {
          _type: "block",
          children: [{ _type: "span", text: "Julekaker", marks: [] }],
        },
      ],
    }),
    false,
  );
  assert.equal(signHasStrong(null), false);
});

test("the optional skilt link needs an HTTPS annotation applied to text", () => {
  const sign = {
    _id: "bakery-sign",
    text: [
      {
        _type: "block",
        children: [{ _type: "span", text: "Julekaker", marks: ["link-a"] }],
        markDefs: [
          { _key: "link-a", _type: "link", href: "https://example.org/kaker" },
        ],
      },
    ],
  };
  assert.equal(signHasHttpsLink(sign), true);
  for (const change of [
    {
      children: [
        { _type: "span", text: "https://example.org/kaker", marks: [] },
      ],
    },
    {
      markDefs: [
        { _key: "link-a", _type: "link", href: "http://example.org/kaker" },
      ],
    },
    {
      markDefs: [
        { _key: "link-b", _type: "link", href: "https://example.org/kaker" },
      ],
    },
    { children: [{ _type: "span", text: " ", marks: ["link-a"] }] },
  ])
    assert.equal(
      signHasHttpsLink({ ...sign, text: [{ ...sign.text[0], ...change }] }),
      false,
    );
  assert.equal(signHasHttpsLink(null), false);
});
