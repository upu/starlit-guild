import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { residentArt, residentHeight } from "../lib/home-actor.ts";
const root = process.env.TEST_ROOT || "http://localhost:5173";
const output = "work/pixel-home";
mkdirSync(output, { recursive: true });
mkdirSync(`${output}/work-study`, { recursive: true });
mkdirSync(`${output}/garden-study`, { recursive: true });
const browser = await chromium.launch({ headless: true });
const failures = [],
  sizes = [];
async function setup(width, dpr) {
  const context = await browser.newContext({
    viewport: { width, height: 1000 },
    deviceScaleFactor: dpr,
  });
  await context.route("**/app/phaser/home-room-game.ts*", async (route) => {
    const response = await route.fetch(),
      source = await response.text();
    assert.ok(source.includes("this.art = new HomeRoomArt(scene);"));
    await route.fulfill({
      response,
      body: source.replace(
        "this.art = new HomeRoomArt(scene);",
        "this.art = new HomeRoomArt(scene); window.__home = this;",
      ),
    });
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => failures.push(e.message));
  await page.goto(root + "/guild-lab");
  await page.locator('.home-room[data-status="ready"]').waitFor({ timeout: 60000 });
  await page.waitForTimeout(700);
  return { page, context };
}
async function point(page, x, y) {
  await page.locator("canvas").scrollIntoViewIfNeeded();
  const r = await page.locator("canvas").boundingBox();
  return { x: r.x + (x / 384) * r.width, y: r.y + (y / 312) * r.height };
}
async function clickWorld(page, x, y) {
  const p = await point(page, x, y);
  await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(150);
}
async function fastForward(page, ms) {
  await page.waitForTimeout(120);
  await page.evaluate((ms) => {
    const c = window.__home;
    for (let n = 0; n < ms; n += 33) c.life.tick(33, c.bridge.read().furniture, false);
    c.update(0);
  }, ms);
}
try {
  for (const [width, dpr] of [
    [320, 1],
    [390, 3],
    [844, 2],
    [1000, 1],
  ]) {
    const { page, context } = await setup(width, dpr);
    const size = await page
      .locator("canvas")
      .evaluate((c) => ({ width: c.width, css: c.clientWidth, dpr: devicePixelRatio }));
    assert.equal(size.width, Math.round(size.css * Math.min(3, dpr)));
    sizes.push({ viewport: width, ...size, characterHeight: (residentHeight * size.css) / 384 });
    assert.equal(await page.evaluate(() => window.__home.life.residents.length), 5);
    await page.getByRole("button", { name: "一時停止", exact: true }).click();
    const t = await page.evaluate(() => window.__home.life.time);
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => window.__home.life.time), t);
    await checkZoom(page, width, dpr);
    const r = await page.evaluate(() => window.__home.life.residents[0]);
    await clickWorld(page, r.x, r.y - 30);
    assert.match(await page.locator(".home-caption").innerText(), /笑顔/);
    // Empty center of workbench, away from its resident.
    await clickWorld(page, 13.7 * 24, 4 * 24);
    assert.equal(
      await page
        .getByRole("button", { name: "道具の手入れ", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    await fastForward(page, 30000);
    await page.locator(".home-stage").screenshot({ path: `${output}/home-${width}-dpr${dpr}.png` });
    if (width === 390) {
      await captureWorkbench(page);
      await captureWorkbench(page, "desk");
    }
    await page.getByRole("button", { name: "家具を置く・動かす" }).click();
    await page.getByLabel("動かす家具").selectOption("fern");
    await page.getByRole("button", { name: "←に1マス" }).click();
    await page.getByRole("button", { name: "この配置にする" }).click();
    assert.equal(
      await page.evaluate(
        () => window.__home.bridge.read().furniture.find((f) => f.id === "fern").x,
      ),
      13,
    );
    await page.getByRole("button", { name: "家具を置く・動かす" }).click();
    await page.getByLabel("動かす家具").selectOption("fern");
    await clickWorld(page, 8 * 24 + 5, 12 * 24 + 5);
    assert.match(await page.locator('.home-editor [role="status"]').innerText(), /入口/);
    await page.getByRole("button", { name: "取り消す" }).click();
    await page.getByRole("button", { name: "みんなでお茶", exact: true }).click();
    await fastForward(page, 30000);
    assert.ok(
      await page.evaluate(() => window.__home.life.residents.every((r) => r.pose === "tea")),
    );
    await page.locator(".home-stage").screenshot({ path: `${output}/tea-${width}.png` });
    const seated = await page.evaluate(() => {
      const c = window.__home;
      const r = c.life.residents.find((r) => r.seat === 4);
      const image = c.art.images.get(`r-${r.id}`);
      return { x: image.x, y: image.y - 30 };
    });
    await clickWorld(page, seated.x, seated.y);
    assert.match(await page.locator(".home-caption").innerText(), /リコ.*笑顔/);
    await page.getByRole("button", { name: "リンデの菜園", exact: true }).click();
    await page.locator('.home-room[data-status="ready"]').waitFor();
    await page.waitForTimeout(300);
    await page.locator(".home-stage").screenshot({ path: `${output}/garden-${width}.png` });
    if (width === 390) {
      await captureGarden(page);
      await captureGarden(page, 1, "-mature");
    }
    await page.getByRole("button", { name: "塔の栽培所", exact: true }).click();
    await page.locator('.home-room[data-status="ready"]').waitFor();
    await page.waitForTimeout(300);
    await page.locator(".home-stage").screenshot({ path: `${output}/brekka-${width}.png` });
    if (width === 390) await captureGarden(page, 0, "-moss");
    await page.getByRole("button", { name: "動きを減らす", exact: true }).click();
    await page.waitForTimeout(100);
    const reduced = await page.evaluate(() => window.__home.life.time);
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.__home.life.time), reduced);
    await page.getByRole("button", { name: "旅団ホーム", exact: true }).click();
    await page.locator('.home-room[data-status="ready"]').waitFor();
    if (width === 390) {
      await page.getByRole("button", { name: "一時停止", exact: true }).click();
      await page.getByRole("button", { name: "みんなでお茶", exact: true }).click();
      const frames = [];
      for (let n = 0; n < 12; n++) {
        await fastForward(page, 120);
        const frame = await page.locator(".home-stage").screenshot();
        frames.push(await sharp(frame).resize(384, 312, { kernel: "nearest" }).png().toBuffer());
      }
      await sharp({ create: { width: 1536, height: 936, channels: 4, background: "#233529" } })
        .composite(
          frames.map((input, n) => ({ input, left: (n % 4) * 384, top: Math.floor(n / 4) * 312 })),
        )
        .png()
        .toFile(`${output}/walk-contact-sheet.png`);
      const walkFrames = [];
      await page.evaluate(() => {
        window.__home.art.furniture = () => {};
      });
      for (let frame = 0; frame < 8; frame++) {
        const actual = await page.evaluate(
          ({ frame, art }) => {
            const c = window.__home;
            c.life.residents.forEach((r, i) => {
              Object.assign(r, {
                x: 40 + i * 76,
                y: 298,
                left: false,
                rear: false,
                pose: "walk",
                walkDistance: frame * 3,
                greetUntil: 0,
                path: [],
              });
            });
            c.update(0);
            return c.life.residents.map((r) => {
              const image = c.art.images.get(`r-${r.id}`);
              return {
                frame: image.frame.name,
                pixels: image.frame.width,
                width: image.displayWidth,
                height: image.displayHeight,
                sole: image.y - image.displayHeight * ((art.cell - art.foot) / art.cell),
              };
            });
          },
          { frame, art: residentArt },
        );
        for (const image of actual) {
          assert.equal(image.frame, frame);
          assert.equal(image.pixels, residentArt.cell);
          assert.equal(image.width, residentArt.displayCell);
          assert.ok(
            image.sole >= 297.5 && image.sole <= 298,
            "rise is limited to one texture pixel",
          );
          assert.equal(image.height, image.width, "walking never squashes the face");
          if (frame === 0) assert.equal(image.sole, 298, "contact returns to the floor");
          if (frame === 2)
            assert.equal(image.sole, 297.5, "passing leg lifts by one texture pixel");
        }
        const capture = await page.locator(".home-stage").screenshot();
        const { width: w, height: h } = await sharp(capture).metadata();
        walkFrames.push(
          await sharp(capture)
            .extract({
              left: 0,
              top: Math.round((h * 218) / 312),
              width: w,
              height: Math.round((h * 84) / 312),
            })
            .png()
            .toBuffer(),
        );
      }
      const row = await sharp(walkFrames[0]).metadata();
      await sharp({
        create: { width: row.width, height: row.height * 8, channels: 4, background: "#233529" },
      })
        .composite(walkFrames.map((input, n) => ({ input, left: 0, top: n * row.height })))
        .png()
        .toFile(`${output}/walk-eight-poses.png`);
      await captureNewActions(page);
    }
    assert.equal(
      await page.evaluate(() => Object.keys(localStorage).filter((k) => /starlit/.test(k)).length),
      0,
    );
    await context.close();
  }
  const { page, context } = await setup(390, 3);
  await page.route("**/home-pixel/aria.webp", (route) => route.abort());
  await page.reload();
  await page.locator('.home-room[data-status="error"]').waitFor();
  await page.unroute("**/home-pixel/aria.webp");
  await page.getByRole("button", { name: "景色を読み直す" }).click();
  await page.locator('.home-room[data-status="ready"]').waitFor();
  await context.close();
  assert.deepEqual(failures, []);
  writeFileSync(`${output}/measurements.json`, JSON.stringify(sizes, null, 2));
  console.log("PASS pixel home", sizes);
} finally {
  await browser.close();
}

async function cameraState(page) {
  return page.evaluate(() => {
    const c = window.__home.scene.cameras.main;
    return {
      zoom: c.zoom,
      center: c.getWorldPoint(c.width / 2, c.height / 2),
      start: c.getWorldPoint(0, 0),
      end: c.getWorldPoint(c.width, c.height),
      event: window.__home.life.event,
    };
  });
}
async function checkZoom(page, width, dpr) {
  const before = await cameraState(page);
  await page.getByRole("button", { name: "拡大する", exact: true }).click();
  await page.waitForTimeout(100);
  assert.equal((await cameraState(page)).zoom, before.zoom * 2);
  await page.locator("canvas").scrollIntoViewIfNeeded();
  const rect = await page.locator("canvas").boundingBox();
  const x = rect.x + rect.width / 2,
    y = rect.y + rect.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + rect.width * 0.2, y + rect.height * 0.15, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(100);
  const panned = await cameraState(page);
  assert.ok(panned.center.x < before.center.x - 30);
  assert.ok(panned.center.y < before.center.y - 20);
  assert.equal(panned.event, before.event, "drag is not a furniture or resident tap");
  await page.locator(".home-stage").press("Home");
  await page.waitForTimeout(80);
  if (width === 390) await touchPan(page, x, y, rect.width);
  await page.locator(".home-stage").press("Home");
  for (let i = 0; i < 12; i++) await page.locator(".home-stage").press("ArrowRight");
  await page.waitForTimeout(80);
  const edge = await cameraState(page);
  assert.ok(edge.start.x >= -0.1 && edge.end.x <= 384.1, JSON.stringify(edge));
  assert.ok(edge.start.y >= -0.1 && edge.end.y <= 312.1);
  await page.locator(".home-stage").screenshot({ path: `${output}/zoom-${width}-dpr${dpr}.png` });
  // The same bench remains tappable after both magnification and camera panning.
  const box = await page.locator("canvas").boundingBox();
  await page.mouse.click(
    box.x + ((13.7 * 24 - edge.start.x) / (edge.end.x - edge.start.x)) * box.width,
    box.y + ((4 * 24 - edge.start.y) / (edge.end.y - edge.start.y)) * box.height,
  );
  await page.waitForTimeout(100);
  assert.equal(
    await page
      .getByRole("button", { name: "道具の手入れ", exact: true })
      .getAttribute("aria-pressed"),
    "true",
    "furniture taps follow the panned, magnified camera",
  );
  await page.getByRole("button", { name: "部屋全体", exact: true }).click();
  await page.waitForTimeout(100);
  assert.equal((await cameraState(page)).zoom, before.zoom);
}
async function touchPan(page, x, y, width) {
  const cdp = await page.context().newCDPSession(page);
  const before = await cameraState(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let i = 1; i <= 8; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x - width * 0.025 * i, y }],
    });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(100);
  const after = await cameraState(page);
  assert.ok(after.center.x > before.center.x + 30, "touch swipes pan the room");
  assert.equal(after.event, before.event);
  await cdp.detach();
}

async function captureNewActions(page) {
  const captures = [];
  const cases = [
    ...Array.from({ length: 6 }, (_, i) => ({ pose: "walk", distance: i * 4, time: 0 })),
    ...[0, 2000, 4000, 6000].map((time) => ({ pose: "tea", distance: 0, time })),
    ...[0, 400, 800, 1200].map((time) => ({ pose: "craft", distance: 0, time })),
    { pose: "paper", distance: 0, time: 0 },
    { pose: "paper", distance: 0, time: 1200 },
  ];
  for (const sample of cases) {
    const images = await page.evaluate((sample) => {
      const c = window.__home;
      c.life.time = sample.time;
      c.life.residents.forEach((r, i) =>
        Object.assign(r, {
          x: 40 + i * 76,
          y: 298,
          rear: true,
          left: true,
          pose: sample.pose,
          walkDistance: sample.distance,
          phase: 0,
          seat: 0,
          greetUntil: 0,
          path: [],
        }),
      );
      c.update(0);
      return c.life.residents.map((r) => {
        const image = c.art.images.get(`r-${r.id}`);
        return { id: r.id, texture: image.texture.key, flip: image.flipX, frame: image.frame.name };
      });
    }, sample);
    for (const image of images) {
      assert.equal(
        image.texture,
        `/home-pixel/${image.id}-${sample.pose === "tea" ? "tea" : ["craft", "paper"].includes(sample.pose) ? "work" : "actions"}.webp`,
      );
      assert.equal(image.flip, false, "tea/work/rear sprites must never swap hands");
      if (sample.pose === "tea") assert.equal(Number(image.frame), 4 + sample.time / 2000);
      if (sample.pose === "craft") assert.equal(Number(image.frame), sample.time / 400);
    }
    const capture = await page.locator(".home-stage").screenshot();
    const { width, height } = await sharp(capture).metadata();
    captures.push(
      await sharp(capture)
        .extract({
          left: 0,
          top: Math.round((height * 218) / 312),
          width,
          height: Math.round((height * 84) / 312),
        })
        .png()
        .toBuffer(),
    );
  }
  const row = await sharp(captures[0]).metadata();
  await sharp({
    create: {
      width: row.width,
      height: row.height * captures.length,
      channels: 4,
      background: "#233529",
    },
  })
    .composite(captures.map((input, n) => ({ input, left: 0, top: n * row.height })))
    .png()
    .toFile(`${output}/rear-chair-work-poses.png`);
  const rear = await sharp(`${output}/rear-chair-work-poses.png`)
    .extract({ left: 0, top: 0, width: row.width, height: row.height * 6 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  await sharp(rear.data, {
    raw: {
      width: row.width,
      height: row.height * 6,
      channels: rear.info.channels,
      pageHeight: row.height,
    },
  })
    .webp({ loop: 0, delay: 138, lossless: true })
    .toFile(`${output}/rear-walk-loop.webp`);
  // A loop as well as a contact sheet, for judging position changes over time.
  const front = await sharp(`${output}/walk-eight-poses.png`)
    .raw()
    .toBuffer({ resolveWithObject: true });
  await sharp(front.data, {
    raw: {
      width: front.info.width,
      height: front.info.height,
      channels: front.info.channels,
      pageHeight: front.info.height / 8,
    },
  })
    .webp({ loop: 0, delay: 100, lossless: true })
    .toFile(`${output}/walk-aligned-loop.webp`);
}

async function captureWorkbench(page, kind = "bench") {
  await page.evaluate(() => {
    const c = window.__home;
    window.__workSnapshot = { residents: c.life.residents, time: c.life.time };
  });
  try {
    for (const id of ["leon", "aria", "mira", "finn", "lico"]) {
      const pictures = [];
      for (let frame = 0; frame < 4; frame++) {
        const shown = await page.evaluate(
          ({ id, frame, kind }) => {
            const c = window.__home;
            const worker = window.__workSnapshot.residents.find((r) => r.pose === "craft");
            const item = c.bridge.read().furniture.find((f) => f.kind === kind);
            c.life.residents = [
              {
                ...worker,
                id,
                phase: 0,
                greetUntil: 0,
                furniture: item.id,
                pose: kind === "desk" ? "paper" : "craft",
                x: (item.x + 1.5) * 24,
                y: (item.y + 2.5) * 24,
              },
            ];
            c.life.time = frame * 400;
            c.update(0);
            const sprite = c.art.images.get(`r-${id}`);
            return {
              texture: sprite.texture.key,
              frame: Number(sprite.frame.name),
              flip: sprite.flipX,
            };
          },
          { id, frame, kind },
        );
        assert.deepEqual(shown, { texture: `/home-pixel/${id}-work.webp`, frame, flip: false });
        const image = await page.locator(".home-stage").screenshot();
        const { width, height } = await sharp(image).metadata();
        pictures.push(
          await sharp(image)
            .extract({
              left: Math.round((width * (kind === "desk" ? 135 : 255)) / 384),
              top: Math.round((height * 60) / 312),
              width: Math.round((width * 105) / 384),
              height: Math.round((height * 85) / 312),
            })
            .resize(420, 340, { kernel: "nearest" })
            .png()
            .toBuffer(),
        );
      }
      await sharp({ create: { width: 840, height: 680, channels: 4, background: "#233529" } })
        .composite(
          pictures.map((input, i) => ({
            input,
            left: (i % 2) * 420,
            top: Math.floor(i / 2) * 340,
          })),
        )
        .png()
        .toFile(`${output}/work-study/${id}-${kind}-in-room.png`);
    }
  } finally {
    await page.evaluate(() => {
      const c = window.__home;
      Object.assign(c.life, window.__workSnapshot);
      delete window.__workSnapshot;
      c.update(0);
    });
  }
}

async function captureGarden(page, plotIndex = 0, variant = "") {
  const ids = variant ? ["leon", "lico"] : ["leon", "aria", "mira", "finn", "lico"];
  await page.evaluate(() => {
    const c = window.__home;
    window.__gardenSnapshot = { residents: c.life.residents, time: c.life.time };
  });
  try {
    for (const id of ids) {
      const pictures = [];
      for (let frame = 0; frame < 4; frame++) {
        const shown = await page.evaluate(
          ({ id, frame, plotIndex }) => {
            const c = window.__home,
              item = c.bridge.read().furniture.filter((f) => f.kind === "plot")[plotIndex];
            c.life.residents = [
              {
                ...window.__gardenSnapshot.residents[0],
                id,
                phase: 0,
                greetUntil: 0,
                pose: "garden",
                furniture: item.id,
                path: [],
                left: id === "lico",
                x: (item.x + (id === "lico" ? 4.5 : -0.5)) * 24,
                y: (item.y + 1.5) * 24,
              },
            ];
            c.life.time = frame * 600;
            c.update(0);
            const image = c.art.images.get(`r-${id}`);
            return {
              texture: image.texture.key,
              frame: Number(image.frame.name),
              flip: image.flipX,
              plot: item,
            };
          },
          { id, frame, plotIndex },
        );
        assert.equal(shown.texture, `/home-pixel/${id}-garden.webp`);
        assert.equal(shown.frame, frame);
        assert.equal(shown.flip, false);
        const image = await page.locator(".home-stage").screenshot();
        const { width, height } = await sharp(image).metadata();
        pictures.push(
          await sharp(image)
            .extract({
              left: Math.round((width * (shown.plot.x * 24 - 36)) / 384),
              top: Math.round((height * ((shown.plot.y + 2) * 24 - 85)) / 312),
              width: Math.round((width * 168) / 384),
              height: Math.round((height * 104) / 312),
            })
            .resize(504, 312, { kernel: "nearest" })
            .png()
            .toBuffer(),
        );
      }
      await sharp({ create: { width: 1008, height: 624, channels: 4, background: "#233529" } })
        .composite(
          pictures.map((input, i) => ({
            input,
            left: (i % 2) * 504,
            top: Math.floor(i / 2) * 312,
          })),
        )
        .png()
        .toFile(`${output}/garden-study/${id}${variant}-in-room.png`);
    }
  } finally {
    await page.evaluate(() => {
      const c = window.__home;
      Object.assign(c.life, window.__gardenSnapshot);
      delete window.__gardenSnapshot;
      c.update(0);
    });
  }
}
