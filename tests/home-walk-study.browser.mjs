import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
import sharp from "sharp";

const out = "work/pixel-home/walk-study";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1100 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${process.env.TEST_ROOT ?? "http://localhost:5173"}/guild-lab/walk-study`);
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
