import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setImmediate } from "node:timers/promises";
import { GameMusic, parseMusic } from "../lib/music.ts";

function audioHarness() {
  const originalAudio = globalThis.AudioContext,
    originalFetch = globalThis.fetch,
    contexts = [],
    requests = [];
  const param = () => ({
    value: 0,
    setValueAtTime(value) {
      this.value = value;
    },
    linearRampToValueAtTime(value) {
      this.value = value;
    },
    setTargetAtTime(value) {
      this.value = value;
    },
    cancelScheduledValues() {},
  });
  class Context {
    currentTime = 0;
    destination = {};
    sources = [];
    gains = [];
    state = "suspended";
    constructor() {
      contexts.push(this);
    }
    createGain() {
      const gain = { gain: param(), connect() {}, disconnect() {} };
      this.gains.push(gain);
      return gain;
    }
    createBufferSource() {
      const source = {
        buffer: null,
        loop: false,
        stops: [],
        started: false,
        connect() {},
        disconnect() {},
        start() {
          this.started = true;
        },
        stop(at) {
          this.stops.push(at);
        },
      };
      this.sources.push(source);
      return source;
    }
    resume() {
      this.state = "running";
      return Promise.resolve();
    }
    suspend() {
      this.state = "suspended";
      return Promise.resolve();
    }
    close() {
      this.state = "closed";
      return Promise.resolve();
    }
    decodeAudioData(bytes) {
      return Promise.resolve({ bytes });
    }
  }
  globalThis.AudioContext = Context;
  globalThis.fetch = (url) => new Promise((resolve) => requests.push({ url, resolve }));
  const finish = async (index, ok = true) => {
    requests[index].resolve({ ok, arrayBuffer: async () => new ArrayBuffer(4) });
    await setImmediate();
  };
  return {
    contexts,
    requests,
    finish,
    restore() {
      globalThis.AudioContext = originalAudio;
      globalThis.fetch = originalFetch;
    },
  };
}

test("music is gesture-gated and a pending request cannot play after the tab becomes inactive", async () => {
  const h = audioHarness(),
    music = new GameMusic();
  try {
    music.configure("camp", true, { enabled: true, volume: 25 });
    assert.equal(h.contexts.length, 0);
    assert.equal(h.requests.length, 0);
    music.unlock();
    await setImmediate();
    assert.equal(h.requests[0].url, "/music/camp.wav");
    music.configure("camp", false, { enabled: true, volume: 25 });
    await h.finish(0);
    assert.equal(h.contexts[0].sources.length, 0);
    assert.equal(h.contexts[0].state, "suspended");
    music.configure("camp", true, { enabled: true, volume: 25 });
    await setImmediate();
    assert.equal(h.requests.length, 1, "decoded loop reused on resume");
    assert.equal(h.contexts[0].sources[0].loop, true);
    music.configure("camp", true, { enabled: false, volume: 25 });
    assert.equal(h.contexts[0].sources[0].stops.length, 1);
    music.unlock();
    await setImmediate();
    assert.equal(h.contexts[0].sources.length, 1);
  } finally {
    music.dispose();
    h.restore();
  }
});

test("scene changes crossfade, cached tracks are reused and volume is independent", async () => {
  const h = audioHarness(),
    music = new GameMusic();
  try {
    music.configure("camp", true, { enabled: true, volume: 25 });
    music.unlock();
    await setImmediate();
    await h.finish(0);
    const ctx = h.contexts[0];
    music.configure("journey", true, { enabled: true, volume: 40 });
    await setImmediate();
    await h.finish(1);
    assert.equal(ctx.sources.length, 2);
    assert.equal(ctx.sources[0].stops[0], 0.65);
    assert.equal(ctx.gains[0].gain.value, 0.26);
    music.configure("camp", true, { enabled: true, volume: 40 });
    await setImmediate();
    assert.equal(h.requests.length, 2);
    assert.equal(ctx.sources.length, 3);
    assert.equal(ctx.sources[0].stops.at(-1), undefined, "old fading voice stopped immediately");
    music.configure("camp", true, { enabled: true, volume: 0 });
    assert.equal(ctx.state, "suspended");
    music.dispose();
    assert.equal(ctx.state, "closed");
  } finally {
    music.dispose();
    h.restore();
  }
});

test("failed audio requests report a retry message and do not poison the cache", async () => {
  const h = audioHarness(),
    messages = [],
    music = new GameMusic((message) => messages.push(message));
  try {
    music.configure("journey", true, { enabled: true, volume: 25 });
    music.unlock();
    await setImmediate();
    await h.finish(0, false);
    assert.match(messages[0], /再試行/);
    music.unlock();
    await setImmediate();
    await h.finish(1);
    assert.equal(messages.at(-1), "");
    assert.equal(h.contexts[0].sources.length, 1);
  } finally {
    music.dispose();
    h.restore();
  }
});

test("invalid music preferences fall back safely without changing game save data", () => {
  assert.deepEqual(parseMusic("{broken"), { enabled: true, volume: 25 });
  assert.deepEqual(parseMusic('{"enabled":false,"volume":900}'), { enabled: false, volume: 100 });
  assert.deepEqual(parseMusic('{"enabled":"yes","volume":"loud"}'), { enabled: true, volume: 25 });
});

test("both original BGM files are non-clipped audible PCM loops of the intended duration", () => {
  for (const [name, seconds] of [
    ["camp", 48],
    ["journey", 40],
  ]) {
    const wav = readFileSync(new URL(`../public/music/${name}.wav`, import.meta.url));
    assert.equal(wav.toString("ascii", 0, 4), "RIFF");
    assert.equal(wav.readUInt16LE(20), 1);
    assert.equal(wav.readUInt32LE(24), 24000);
    assert.equal((wav.length - 44) / 2 / 24000, seconds);
    let peak = 0,
      squares = 0;
    for (let i = 44; i < wav.length; i += 2) {
      const value = wav.readInt16LE(i) / 32768;
      peak = Math.max(peak, Math.abs(value));
      squares += value * value;
    }
    assert.ok(peak < 0.8 && peak > 0.7);
    assert.ok(Math.sqrt(squares / ((wav.length - 44) / 2)) > 0.1);
    assert.ok(
      Math.abs(wav.readInt16LE(44) - wav.readInt16LE(wav.length - 2)) / 32768 < 0.03,
      "loop boundary has no large sample jump",
    );
  }
});
