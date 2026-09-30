import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { LAB_PAIR_MIN_DISTANCE } from "../lib/guild-lab-spacing.ts";

export async function captureLabAppearance(browser, root, output, baseline = false) {
  mkdirSync(output, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 1000 },
    deviceScaleFactor: 3,
  });
  const previous = "work/lab-tenth-baseline";
  if (baseline) {
    await context.route(`${root}/guild-lab`, async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        body: (await response.text()).replaceAll("住人を追う", "寄って見る"),
      });
    });
    for (const [url, file] of [
      ["lib/guild-lab-rig.ts", "rig.js"],
      ["lib/guild-lab-aria-art.ts", "art.js"],
      ["lib/guild-lab-art.ts", "leon-art.js"],
      ["lib/guild-lab-arms.ts", "guild-lab-arms.js"],
      ["lib/guild-lab-model.ts", "guild-lab-model.js"],
      ["app/guild-lab/room.tsx", "room.js"],
    ]) {
      await context.route(`**/${url}*`, (route) =>
        route.fulfill({
          contentType: "text/javascript",
          body: readFileSync(`${previous}/${file}`, "utf8"),
        }),
      );
    }
    await context.route("**/guild/aria-parts-v1.webp", (route) =>
      route.fulfill({ contentType: "image/webp", body: readFileSync(`${previous}/aria.webp`) }),
    );
  }
  await context.route("**/app/phaser/guild-cutout.ts*", async (route) => {
    const response = await route.fetch();
    const source = baseline ? readFileSync(`${previous}/cutout.js`, "utf8") : await response.text();
    assert.ok(source.includes("this.debug(debug);"));
    await route.fulfill({
      response,
      body: source
        .replace(
          "this.face.paint(feeling, pose.blink);",
          `this.face.paint(this.character === "aria" && window.__labExpression ? {...feeling, expression:window.__labExpression,yawn:false}: feeling, window.__labBlink ?? pose.blink);`,
        )
        .replace(
          "this.debug(debug);",
          `
      this.debug(debug);
      if (this.character === "aria") window.__ariaSkirt = {
        rotation: this.skirt.rotation, width: this.skirt.displayWidth,
        thighs: this.legs.map(leg => leg.upper.rotation),
        cup: { visible: this.cup.visible, depth: this.cup.depth },
        hand: this.raisedForearm?.visible ? (() => {
          const source = this.arms[1].lower.getWorldTransformMatrix();
          const drawing = this.raisedForearm.getWorldTransformMatrix();
          return { error: Math.hypot(source.tx - drawing.tx, source.ty - drawing.ty),
            depth: this.raisedForearm.depth };
        })() : null
      };
    `,
        ),
    });
  });
  await context.route("**/app/phaser/guild-lab-controller.ts*", async (route) => {
    const response = await route.fetch();
    const source = baseline
      ? readFileSync(`${previous}/controller.js`, "utf8")
      : await response.text();
    assert.ok(source.includes("this.elapsed += step;"));
    const camera = baseline
      ? source
          .replace("close ? 1.8 : 1", "close ? 5 : 1")
          .replace(
            "(this.residents[0].actor.root.x + this.residents[1].actor.root.x) / 2",
            "this.residents[window.__labFocus === 'leon' ? 0 : 1].actor.root.x",
          )
          .replace(
            "(this.residents[0].actor.root.y + this.residents[1].actor.root.y) / 2",
            "this.residents[window.__labFocus === 'leon' ? 0 : 1].actor.root.y",
          )
      : source.replace(
          "this.camera(controls, step, reduced);",
          `this.camera(controls, step, reduced); const focus=this.residents[window.__labFocus === 'leon' ? 0 : 1]; this.scene.cameras.main.setZoom(this.scene.game.canvas.width / LAB_WIDTH * 5).centerOn(focus.actor.root.x, focus.actor.root.y - 42.5);`,
        );
    await route.fulfill({
      response,
      body: camera
        .replace("this.elapsed += step;", "this.elapsed = Number(window.__labCaptureTime ?? 0);")
        .replace("new LabAffection()", "new LabAffection(() => 0.5)"),
    });
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${root}/guild-lab`);
  await page.locator('.guild-lab-stage[data-status="ready"]').waitFor();
  const button = (name) => page.getByRole("button", { name, exact: true });
  const time = async (t) => {
    await page.evaluate((t) => (window.__labCaptureTime = t), t);
    await page.waitForTimeout(120);
  };
  const clearance = async () => {
    if (baseline) return;
    const feet = JSON.parse(await page.locator("canvas").getAttribute("data-feet"));
    assert.ok(
      Math.hypot(feet[0].x - feet[1].x, feet[0].y - feet[1].y) >= LAB_PAIR_MIN_DISTANCE - 1e-6,
    );
  };
  const shot = async (name) => {
    await clearance();
    return page.locator("canvas").screenshot({ path: `${output}/${name}.png` });
  };
  // Monitor all rendered pairs, including the corners and mode transitions.
  if (!baseline)
    await page.evaluate(() => {
      window.__labMinimumDistance = Infinity;
      window.__labObserver = new MutationObserver(() => {
        const feet = JSON.parse(document.querySelector("canvas").dataset.feet || "[]");
        if (feet.length === 2)
          window.__labMinimumDistance = Math.min(
            window.__labMinimumDistance,
            Math.hypot(feet[0].x - feet[1].x, feet[0].y - feet[1].y),
          );
      });
      window.__labObserver.observe(document.querySelector("canvas"), {
        attributes: true,
        attributeFilter: ["data-feet"],
      });
    });
  if (baseline) await button("寄って見る").click();
  await time(3800);
  await shot("tea-sip");
  if (!baseline) {
    const cup = (await page.evaluate(() => window.__ariaSkirt)).cup;
    assert.ok(cup.visible && cup.depth > 9, "raised cup remains visible in front of Aria's face");
    const hand = (await page.evaluate(() => window.__ariaSkirt)).hand;
    assert.ok(
      hand && hand.error < 0.001 && hand.depth > cup.depth,
      "raised glove shares the original elbow and covers the handle",
    );
  }
  await time(6100);
  await shot("tea");
  for (const expression of ["neutral", "smile", "surprised", "tired", "yawn"]) {
    await page.evaluate((value) => {
      window.__labExpression = value;
      window.__labBlink = false;
    }, expression);
    await time(2000);
    await shot(`tea-expression-${expression}`);
  }
  await page.evaluate(() => {
    window.__labExpression = "neutral";
    window.__labBlink = true;
  });
  await time(2000);
  await shot("tea-expression-blink");
  await page.evaluate(() => {
    delete window.__labExpression;
    delete window.__labBlink;
  });
  if (!baseline)
    assert.equal((await page.evaluate(() => window.__ariaSkirt)).rotation, 0, "seated skirt fixed");
  const canvasSize = await page.locator("canvas").boundingBox();
  await page
    .locator("canvas")
    .click({ position: { x: canvasSize.width / 2, y: canvasSize.height * 0.42 } });
  await time(6550);
  await shot("tap");
  await button("2人で歩く").click();
  await page.waitForTimeout(1600);
  await button("一時停止").click();
  for (let t = 8100; t < 9000; t += 50) await time(t);
  const stride = [];
  for (let i = 0; i < 8; i++) {
    await time(9000 + i * 112.5);
    await shot(`walk-${i}`);
    stride.push(await page.evaluate(() => window.__ariaSkirt));
  }
  writeFileSync(`${output}/stride.json`, JSON.stringify(stride, null, 2));
  if (!baseline) {
    assert.ok(stride.every((p) => Math.abs(p.rotation) <= 0.12 + 1e-8));
    assert.ok(
      Math.max(...stride.map((p) => p.width)) / Math.min(...stride.map((p) => p.width)) <= 1.06,
    );
    assert.ok(
      stride.some((p) => Math.abs(p.rotation - ((p.thighs[0] + p.thighs[1]) / 2) * 0.25) > 0.001),
    );
  }
  await button("動きを再開").click();
  await page.locator('.guild-lab-stage[data-activity="idle"]').waitFor({ timeout: 30000 });
  await time(10500);
  await button("タイルと関節を見る").click();
  await shot("aria-idle-debug");
  await page.evaluate(() => (window.__labFocus = "leon"));
  await time(10500);
  await shot("leon-idle-debug");
  await page.evaluate(() => (window.__labFocus = "aria"));
  await button("タイルと関節を見る").click();
  await button("アリアが寄り道").click();
  await page.waitForTimeout(150);
  await button("アリアが寄り道").click();
  await page.waitForTimeout(17000);
  await time(13100);
  await shot("detour-follow");
  await button("作業台へ").click();
  await page.waitForTimeout(17000);
  await time(16000);
  await shot("work");
  if (!baseline) {
    assert.equal((await page.evaluate(() => window.__ariaSkirt)).rotation, 0, "work skirt fixed");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await button("2人で歩く").click();
    for (const t of [16100, 16800]) {
      await time(t);
      assert.equal(
        (await page.evaluate(() => window.__ariaSkirt)).rotation,
        0,
        "reduced skirt fixed",
      );
    }
  }
  if (!baseline) {
    await clearance();
    assert.ok(
      (await page.evaluate(() => window.__labMinimumDistance)) >= LAB_PAIR_MIN_DISTANCE - 1e-6,
    );
  }
  assert.deepEqual(await page.evaluate(() => ({ ...localStorage })), {});
  assert.deepEqual(errors, []);
  await context.close();
}

if (process.argv[1].endsWith("guild-lab-appearance.browser.mjs")) {
  const browser = await chromium.launch({ headless: true });
  try {
    const baseline = process.argv.includes("--baseline");
    await captureLabAppearance(
      browser,
      process.env.TEST_ROOT || "http://localhost:5174",
      baseline ? "work/lab-tenth-before" : "work/lab-tenth-after",
      baseline,
    );
    console.log(
      "PASS: Aria-centred 5x tea, sip, tap, stride, detour and work; clearance and isolated storage",
    );
  } finally {
    await browser.close();
  }
}
