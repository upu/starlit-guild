import test from "node:test";
import assert from "node:assert/strict";
import {
  hasNextBanter,
  atEndOfBanter,
  interruptBanter,
  nextBanter,
  retainBanter,
  startBanter,
  switchBanter,
} from "../lib/banter-exchange.ts";

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

test("an empty exchange is complete so a waiting scene can continue", () => {
  const empty = startBanter([]);
  assert.equal(hasNextBanter(empty, []), false);
  assert.equal(atEndOfBanter(empty), true);
  assert.equal(atEndOfBanter(startBanter(route)), false);
  assert.equal(atEndOfBanter(nextBanter(startBanter(route), route)), true);
});

test("urgent battle cues keep interrupted lines in the transcript before the new cue", () => {
  let exchange = startBanter(route);
  exchange = interruptBanter(exchange, rest);
  assert.deepEqual(texts(exchange), [...route.map((line) => line.text), rest[0].text]);
  exchange = interruptBanter(exchange, later);
  assert.deepEqual(texts(exchange), [
    ...route.map((line) => line.text),
    ...rest.map((line) => line.text),
    later[0].text,
  ]);
  for (let i = 0; i < 6; i++) exchange = nextBanter(exchange, later);
  assert.deepEqual(texts(exchange), [
    ...route.map((line) => line.text),
    ...rest.map((line) => line.text),
    ...later.map((line) => line.text),
  ]);
  assert.equal(hasNextBanter(exchange, later), false);
});

test("an interruption retains an already queued exchange in chronological order without replaying it", () => {
  const queued = retainBanter(startBanter(route), rest);
  let exchange = interruptBanter(queued, later);
  assert.deepEqual(texts(exchange), [
    ...route.map((line) => line.text),
    ...rest.map((line) => line.text),
    later[0].text,
  ]);
  exchange = nextBanter(exchange, later);
  assert.equal(hasNextBanter(exchange, rest), false);
  assert.equal(interruptBanter(exchange, later), exchange);
});

test("a stopped performance discards queued lines but keeps displayed history", () => {
  let exchange = interruptBanter(startBanter(route), rest);
  exchange = switchBanter(exchange, later);
  assert.deepEqual(texts(exchange), [
    ...route.map((line) => line.text),
    rest[0].text,
    later[0].text,
  ]);
  exchange = nextBanter(exchange, later);
  assert.deepEqual(texts(exchange), [
    ...route.map((line) => line.text),
    rest[0].text,
    ...later.map((line) => line.text),
  ]);
  assert.equal(hasNextBanter(exchange, later), false);
});

test("situational dialogue switches immediately and keeps earlier lines in history", () => {
  let exchange = startBanter(route);
  exchange = switchBanter(exchange, rest);
  assert.deepEqual(texts(exchange), [route[0].text, rest[0].text]);
  assert.equal(exchange.lines[exchange.index], rest[0]);
  assert.equal(switchBanter(exchange, rest), exchange);
  exchange = switchBanter(exchange, route);
  assert.equal(exchange.lines[exchange.index], route[0]);
  assert.deepEqual(texts(exchange), [route[0].text, rest[0].text, route[0].text]);
  exchange = switchBanter(exchange, rest, 1);
  assert.equal(exchange.lines[exchange.index], rest[1]);
  const before = texts(exchange);
  exchange = switchBanter(exchange, route, route.length);
  assert.deepEqual(exchange.lines, []);
  assert.deepEqual(texts(exchange), before, "an exhausted exchange does not repeat in history");
  assert.equal(switchBanter(exchange, route, route.length), exchange);
  assert.equal(hasNextBanter(exchange, route), false);
});

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

test("queued lines can be skipped at display time without entering history or recurring", () => {
  let exchange = startBanter(route);
  exchange = nextBanter(exchange, rest, (line) => line.speaker !== "leon");
  assert.deepEqual(texts(exchange), [route[0].text, rest[0].text]);
  exchange = nextBanter(exchange, rest, (line) => line.speaker !== "leon");
  assert.deepEqual(texts(exchange), [route[0].text, rest[0].text]);
  assert.equal(hasNextBanter(exchange, rest), false);
  assert.equal(nextBanter(exchange, rest), exchange);
});
