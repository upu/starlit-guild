import test from "node:test";
import assert from "node:assert/strict";
import { hasNextBanter, nextBanter, startBanter } from "../lib/banter-exchange.ts";

const route = [
    { speaker: "aria", text: "この先の木陰、薬草を採るときによく通るんだ。" },
    { speaker: "leon", text: "じゃあ、踏まないほうがいい場所も教えてくれ。" },
  ],
  rest = [
    { speaker: "aria", text: "布、ここに敷くね。少し座ろう。" },
    { speaker: "leon", text: "ああ。入れ物は平らなところに置いておこう。" },
  ],
  later = [
    { speaker: "leon", text: "石の横に水が残ってるな。" },
    { speaker: "aria", text: "うん。根の脇も見てみよう。" },
  ];
const texts = (exchange) => exchange.history.map((line) => line.text);

test("finishes the current exchange before switching to new banter", () => {
  let exchange = startBanter(route);
  assert.deepEqual(texts(exchange), [route[0].text]);
  exchange = nextBanter(exchange, rest);
  assert.deepEqual(texts(exchange), [route[0].text, route[1].text]);
  exchange = nextBanter(exchange, rest);
  assert.deepEqual(texts(exchange).slice(-1), [rest[0].text]);
});

test("does not append an exchange again when the route returns to it", () => {
  let exchange = startBanter(route);
  for (const latest of [route, rest, rest, route, route, rest, rest]) {
    exchange = nextBanter(exchange, latest);
  }
  assert.deepEqual(
    texts(exchange),
    [...route, ...rest].map((line) => line.text),
  );
  assert.equal(hasNextBanter(exchange, route), false);
  assert.equal(hasNextBanter(exchange, rest), false);
  assert.equal(nextBanter(exchange, route), exchange);
  assert.equal(hasNextBanter(exchange, later), true);
  exchange = nextBanter(nextBanter(exchange, later), later);
  assert.deepEqual(
    texts(exchange).slice(-2),
    later.map((line) => line.text),
  );
});

test("a changed expression alone is not treated as new banter", () => {
  const exchange = nextBanter(startBanter(route), route);
  const smiling = route.map((line) => ({ ...line, expression: "smile" }));
  assert.equal(hasNextBanter(exchange, smiling), false);
  assert.equal(nextBanter(exchange, smiling), exchange);
});

test("keeps only the latest 100 lines of history", () => {
  let exchange = startBanter([{ speaker: "aria", text: "0" }]);
  for (let i = 1; i <= 150; i++)
    exchange = nextBanter(exchange, [{ speaker: "aria", text: String(i) }]);
  assert.equal(exchange.history.length, 100);
  assert.equal(exchange.history.at(-1).text, "150");
  assert.equal(exchange.turn, 150);
});
