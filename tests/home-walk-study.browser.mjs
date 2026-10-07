import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
import sharp from "sharp";
import { residentIds, residentNames, residentAnimation } from "../lib/home-actor.ts";

const out = "work/pixel-home/walk-study";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1100 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${process.env.TEST_ROOT ?? "http://localhost:5173"}/sprite-lab/walk`);
  await page.locator('.walk-study[data-ready="true"]').waitFor();
  const saved = await page.evaluate(() => JSON.stringify(localStorage));
  const phase = () => page.locator(".walk-phase").textContent();
  const waitFrame = (n) =>
    page.waitForFunction(
      (n) => document.querySelector(".walk-phase")?.textContent.startsWith(`${n} /`),
      n,
    );
  await page.getByRole("button", { name: "前のコマ", exact: true }).click();
  await waitFrame(8);
  await page.getByRole("button", { name: "次のコマ", exact: true }).click();
  await waitFrame(1);
  await page.getByLabel("ゆっくり").check();
  await page.getByRole("button", { name: "再生", exact: true }).click();
  await waitFrame(2);
  await page.getByRole("button", { name: "一時停止", exact: true }).click();
  const stopped = await phase();
  await page.waitForTimeout(350);
  assert.equal(await phase(), stopped);
  await page.getByLabel("関節と手の軌跡").uncheck();
  const frames = [];
  for (let i = 0; i < 8; i++) {
    await page.locator(".walk-sheet button").nth(i).click();
    await waitFrame(i + 1);
    const svg = await page.locator(".walk-live .walk-large svg").evaluate((el) => el.outerHTML);
    frames.push(
      await sharp(
        Buffer.from(
          svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="210" height="297" '),
        ),
      )
        .png()
        .toBuffer(),
    );
    await page.locator(".walk-pilot-pair").screenshot({ path: `${out}/pilot-${i + 1}.png` });
  }
  await sharp({ create: { width: 1536, height: 1024, channels: 4, background: "#f3f0e7" } })
    .composite(
      frames.map((input, i) => ({
        input,
        left: (i % 4) * 384 + 87,
        top: Math.floor(i / 4) * 512 + 107,
      })),
    )
    .png()
    .toFile(`${out}/guide-sheet.png`);
  for (const id of residentIds) {
    await page.locator(".walk-residents button").filter({ hasText: residentNames[id] }).click();
    await page.locator(`.walk-pilot-pair[data-resident="${id}"]`).waitFor();
    // The same selected resident must appear in every simultaneous phase tile.
    assert.equal(await page.locator(".walk-pilot-sheet button").count(), 8);
    await page.locator(".walk-pilot-sheet button").nth(6).click();
    await waitFrame(7);
    assert.equal(await page.getByRole("button", { name: "再生", exact: true }).count(), 1);
    const sheetTextures = await page
      .locator(".walk-pilot-sheet .walk-pilot-sprite")
      .evaluateAll((nodes) => nodes.map((el) => el.style.backgroundImage));
    assert.ok(sheetTextures.every((texture) => texture.includes(`/home-pixel/${id}.webp`)));
    await page.locator(".walk-pilot-sheet").screenshot({
      path: `${out}/${id}-all-phases.png`,
      // Keep the sticky playback bar out of the full-height contact sheet.
      style: ".walk-controls { visibility: hidden !important; }",
    });
    const images = [];
    for (let frame = 0; frame < 8; frame++) {
      await page.locator(".walk-sheet button").nth(frame).click();
      await waitFrame(frame + 1);
      const style = await page.locator(".walk-pilot-pair .walk-pilot-sprite").getAttribute("style");
      assert.ok(style.includes(`/home-pixel/${id}.webp`), "use the real home atlas");
      assert.ok(
        style.includes(
          `translateY(${(residentAnimation("walk", 0, frame * 3, false).bob / 64) * 100}%)`,
        ),
      );
      images.push(await page.locator(".walk-pilot-pair").screenshot());
    }
    const { width, height } = await sharp(images[0]).metadata();
    await sharp({
      create: { width: width * 2, height: height * 4, channels: 4, background: "#233529" },
    })
      .composite(
        images.map((input, i) => ({
          input,
          left: (i % 2) * width,
          top: Math.floor(i / 2) * height,
        })),
      )
      .png()
      .toFile(`${out}/${id}-comparison.png`);
  }
  for (const width of [320, 390, 1000]) {
    await page.setViewportSize({ width, height: 1100 });
    const fits = await page.locator(".walk-study").evaluate((el) => {
      el.scrollTop = 0;
      return el.scrollWidth <= el.clientWidth;
    });
    assert.ok(fits, `horizontal overflow at ${width}px`);
    await page.screenshot({ path: `${out}/page-${width}.png` });
  }
  assert.equal(await page.evaluate(() => JSON.stringify(localStorage)), saved);
  assert.deepEqual(errors, []);
  console.log("Walk study: playback, stepping, mobile layout, screenshots, no save writes PASS");
} finally {
  await browser.close();
}
