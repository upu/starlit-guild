// npm run build, then node tests/story-video.browser.mjs (requires Playwright + Chromium).
// Isolated browser context/port: never reads or replaces the player's saved game.
import { build } from "esbuild";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = fileURLToPath(new URL("../", import.meta.url));
const dir = path.join(root, "work/story-video-browser");
mkdirSync(dir, { recursive: true });
const bundle = await build({
  stdin: {
    contents: `
 import React from 'react';import {createRoot} from 'react-dom/client';
 import {StoryReader} from './app/story-scenes';import {stories} from './lib/stories';
 const story=stories.find(s=>s.id==='waiting-households-return');
 createRoot(document.getElementById('root')).render(<main className="phone-game"><div className="phone-dialog story-dialog" data-slot="dialog-content" style={{position:'relative',inset:'auto',transform:'none',width:'100%',height:'100dvh'}}><StoryReader story={story} ready onRead={()=>true} onClose={()=>{}}/></div></main>);
 `,
    resolveDir: root,
    loader: "tsx",
  },
  bundle: true,
  write: false,
  platform: "browser",
  format: "esm",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [
    {
      name: "image-shim",
      setup(b) {
        b.onResolve({ filter: /^next\/image$/ }, () => ({ path: "image", namespace: "shim" }));
        b.onLoad({ filter: /.*/, namespace: "shim" }, () => ({
          contents:
            'import React from "react"; export default function Image({unoptimized,...props}){return React.createElement("img",props)}',
          loader: "js",
          resolveDir: root,
        }));
      },
    },
  ],
});
const css = readdirSync(path.join(root, "dist/client"), { recursive: true })
  .filter((f) => f.endsWith(".css"))
  .map((f) => readFileSync(path.join(root, "dist/client", f), "utf8"))
  .join("\n");
const server = createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/test.js") {
    res.setHeader("Content-Type", "text/javascript");
    res.end(bundle.outputFiles[0].contents);
    return;
  }
  if (url.pathname === "/style.css") {
    res.setHeader("Content-Type", "text/css");
    res.end(css);
    return;
  }
  if (url.pathname === "/") {
    res.setHeader("Content-Type", "text/html");
    res.end(
      '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><div id="root"></div><script type="module" src="/test.js"></script>',
    );
    return;
  }
  const local = path.resolve(root, "public", `.${decodeURIComponent(url.pathname)}`);
  if (!local.startsWith(path.join(root, "public") + path.sep)) {
    res.writeHead(403);
    res.end();
    return;
  }
  try {
    res.setHeader(
      "Content-Type",
      local.endsWith(".mp4") ? "video/mp4" : local.endsWith(".webp") ? "image/webp" : "image/png",
    );
    res.end(readFileSync(local));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const url = `http://127.0.0.1:${server.address().port}`;
async function reveal(page) {
  for (let i = 0; i < 4; i++) await page.locator(".story-conversation").click();
}
try {
  const context = await browser.newContext({ viewport: { width: 430, height: 900 } }),
    page = await context.newPage();
  let requests = 0;
  page.on("request", (r) => {
    if (r.url().endsWith(".mp4")) requests++;
  });
  await page.goto(url);
  await page.locator(".story-conversation").waitFor();
  assert.equal(requests, 0);
  await reveal(page);
  await page.waitForFunction(() => document.querySelector("video")?.currentTime > 0.2);
  assert.equal(await page.locator("video").count(), 1);
  assert.equal(
    await page.locator("video").evaluate((v) => v.muted && !v.loop && v.playsInline),
    true,
  );
  const cue = await page.locator(".story-tap-hint").textContent();
  await page.getByRole("button", { name: "動画を一時停止", exact: true }).click();
  assert.equal(await page.locator("video").evaluate((v) => v.paused), true);
  assert.equal(await page.locator(".story-tap-hint").textContent(), cue);
  await page.getByRole("button", { name: "動画を再生", exact: true }).click();
  await page.waitForFunction(() => !document.querySelector("video").paused);
  await page.locator("video").evaluate((v) => {
    v.currentTime = v.duration - 0.2;
  });
  await page.getByRole("button", { name: "動画をもう一度再生", exact: true }).waitFor();
  assert.equal(
    await page
      .locator("video")
      .evaluate((v) => v.ended && v.paused && v.currentTime === v.duration),
    true,
  );
  assert.equal(await page.locator(".story-tap-hint").textContent(), cue);
  await page.getByRole("button", { name: "動画をもう一度再生", exact: true }).click();
  await page.waitForFunction(() => {
    const v = document.querySelector("video");
    return !v.paused && v.currentTime < 2;
  });
  await page.locator(".still-expand").click();
  await page.locator(".art-viewer video").waitFor();
  assert.equal(await page.locator("video").count(), 1, "backing story video is stopped");
  await page.locator(".art-viewer video").evaluate((v) => {
    window.closedVideo = v;
  });
  await page.screenshot({ path: path.join(dir, "expanded.png") });
  await page.locator(".art-return").click();
  await page.locator(".story-still video").waitFor();
  assert.equal(await page.evaluate(() => window.closedVideo.paused), true);
  await page.setViewportSize({ width: 320, height: 568 });
  const box = await page.locator(".story-video-toggle").boundingBox();
  assert.ok(box.width >= 44 && box.height >= 44 && box.x >= 0 && box.x + box.width <= 320);
  await page.screenshot({ path: path.join(dir, "mobile.png") });
  await page.locator("video").evaluate((v) => {
    window.hiddenVideo = v;
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.locator(".story-still img").waitFor();
  assert.equal(await page.evaluate(() => window.hiddenVideo.paused), true);
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.locator("video").waitFor();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator(".story-still img").waitFor();
  assert.equal(await page.locator("video").count(), 0);
  await page.reload();
  await reveal(page);
  assert.equal(await page.locator("video").count(), 0);
  await context.close();
  for (const mode of ["network-error", "autoplay-rejected"]) {
    const c = await browser.newContext(),
      p = await c.newPage();
    if (mode === "network-error") await p.route("**/*.mp4", (route) => route.abort());
    else
      await p.addInitScript(() => {
        HTMLMediaElement.prototype.play = function () {
          return Promise.reject(new DOMException("blocked", "NotAllowedError"));
        };
      });
    await p.goto(url);
    await p.locator(".story-conversation").waitFor();
    await reveal(p);
    await p.locator(".story-still img").waitFor();
    assert.equal(await p.locator("video").count(), 0);
    const before = await p.locator(".story-tap-hint").textContent();
    await p.locator(".story-conversation").click();
    assert.notEqual(await p.locator(".story-tap-hint").textContent(), before);
    await c.close();
  }
  console.log(
    "PASS: reveal, single playback, final frame, replay, pause/resume, expanded view, mobile controls, visibility, reduced motion, network/autoplay fallback",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
