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
  findNewPlayerOrder,
  isNewOrder,
  isReadyOrder,
  morningRushReadyCount,
  signCheck,
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
  assert.equal(
    morningRushReadyCount(
      [...orders, ready({ _id: "same-name-other-id", item: "Julekake" })],
      "player-order",
    ),
    4,
  );
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

test("the newest non-sample published order is captured by id, not its name", () => {
  const player = {
    _id: "felix-order",
    item: "Lussekatter",
    orderedBy: "Felix",
    date: "2026-12-14",
    status: "ny",
    createdAt: "2026-12-15T10:00:00Z",
  };
  const earlier = {
    ...player,
    _id: "older-player-order",
    createdAt: "2026-12-14T10:00:00Z",
  };
  const sample = {
    ...player,
    _id: "bakery-sample-brann",
    createdAt: "2026-12-16T10:00:00Z",
  };
  assert.equal(
    findNewPlayerOrder([sample, earlier, player])._id,
    "felix-order",
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

test("the skilt needs two paragraphs with the bold word in the first", () => {
  const block = (text, marks = []) => ({
    _type: "block",
    children: [{ _type: "span", text, marks }],
  });
  const plain = (x) => JSON.parse(JSON.stringify(x));
  assert.deepEqual(plain(signCheck({ text: [block("Nystekt", ["strong"])] })), {
    twoBlocks: false,
    boldFirst: true,
    done: false,
  });
  assert.equal(
    signCheck({ text: [block("Åpent til fire"), block("Nystekt", ["strong"])] })
      .done,
    false,
  );
  assert.equal(
    signCheck({ text: [block("Nystekt", ["strong"]), block("Åpent til fire")] })
      .done,
    true,
  );
  assert.equal(signCheck(null).done, false);
});

test("luke 7 counts only an order made after the model board was solved", () => {
  const { isOrderSince } = require("./bakery.ts");
  const order = {
    _id: "o",
    item: "Lussekatter",
    date: "2026-12-14",
    status: "ny",
    createdAt: "2026-12-14T10:00:00Z",
  };
  assert.equal(isOrderSince(order, "2026-12-14T09:59:00Z"), true);
  assert.equal(isOrderSince(order, "2026-12-14T10:05:00Z"), true);
  assert.equal(isOrderSince(order, "2026-12-14T11:00:00Z"), false);
  assert.equal(isOrderSince(order, undefined), false);
});
