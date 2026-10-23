import { receptionAssets } from "./story-stage-reception-art.mjs";
import { nightHandAssets } from "./story-stage-night-hand-art.mjs";
import { bridgeProps } from "./story-stage-bridge-art.mjs";
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { readFrame, packFrames, spriteBounds } from "./home-pixel-frames.mjs";
import { workPoseFrames } from "./story-stage-pose-frames.mjs";

import { chapterAssets } from "./build-story-stage-chapter.mjs";
import { laterAssets } from "./build-story-stage-later.mjs";
import { reviewHero, reviewProps } from "./story-stage-review-art.mjs";
import { rpgBackground } from "./rpg-backgrounds.mjs";
import { teaPreparationAssets } from "./story-stage-tea-art.mjs";
import { reviewNpcChair, licoFieldAssets } from "./story-stage-lico-art.mjs";
import { reviewMaskedMotion, puppetMotionAssets } from "./story-stage-puppet-art.mjs";
import { reviewWorkerMotion, carrierAssets } from "./story-stage-carrier-art.mjs";
import { golemClothAssets } from "./story-stage-golem-art.mjs";
import { reviewParentMotion, householdProps } from "./story-stage-household-art.mjs";
import { reviewWorkerHat, homewardProps } from "./story-stage-homeward-art.mjs";
import { picnicAssets } from "./story-stage-picnic-art.mjs";
import { walnutAssets } from "./story-stage-walnut-art.mjs";
import { berneOpeningAssets } from "./story-stage-berne-opening-art.mjs";
import { berneVisitAssets } from "./story-stage-berne-visit-art.mjs";
import { keystoneAssets } from "./story-stage-keystone-art.mjs";
import { reviewManorNpc, manorAssets } from "./story-stage-manor-art.mjs";
import { stoneSelectionAssets } from "./story-stage-stone-selection-art.mjs";
import { surveyAssets } from "./story-stage-survey-art.mjs";

const root = new URL("../", import.meta.url);
const output = new URL("public/story-stage/", root);
const check = process.argv.includes("--check");
const manifest = {};
await mkdir(output, { recursive: true });
async function emit(name, source, image) {
  const background = await rpgBackground(root, "story", name);
  if (background) {
    source = background.raw;
    image = await sharp(background.image)
      .resize({ width: 960 })
      .webp({ lossless: true })
      .toBuffer();
  }
  const hero = await reviewHero(root, name, source, image);
  const reviewed = await reviewNpcChair(root, name, hero.raw, hero.image);
  const masked = await reviewMaskedMotion(root, name, reviewed.raw, reviewed.image);
  const worker = await reviewWorkerMotion(root, name, masked.raw, masked.image);
  const hat = await reviewWorkerHat(root, name, worker.raw, worker.image);
  const parent = await reviewParentMotion(root, name, hat.raw, hat.image);
  const manor = await reviewManorNpc(root, name, parent.raw, parent.image);
  source = manor.raw;
  image = manor.image;
  const path = new URL(`${name}.webp`, output);
  if (check) {
    if (!(await readFile(path)).equals(image)) throw Error(`Stale story stage art: ${name}`);
  } else {
    const existing = await readFile(path).catch(() => null);
    if (!existing?.equals(image)) await writeFile(path, image);
  }
  manifest[name] = {
    source: createHash("sha256").update(source).digest("hex"),
    output: createHash("sha256").update(image).digest("hex"),
  };
}
for (const [name, width] of [
  ["meeting-path", 960],
  ["town-exit", 960],
  ["town-shop", 960],
  ["town-shop-return", 960],
  ["delivery-box", 256],
  ["packing-table", 384],
  ["meeting-dusk", 960],
  ["loaded-cart", 420],
  ["return-cart", 420],
  ["travel-bundle", 144],
]) {
  const original = name.startsWith("town-shop") ? "town-warehouse-close" : name;
  const source = await readFile(new URL(`assets/source/story-stage/${original}-v1.png`, root));
  const trimmed = ["packing-table", "delivery-box"].includes(name)
    ? await sharp(source)
        .extract(await spriteBounds(source))
        .png()
        .toBuffer()
    : source;
  const image = await sharp(trimmed)
    .resize({ width, kernel: "lanczos3" })
    .webp({ lossless: true })
    .toBuffer();
  await emit(name, source, image);
}
const merchant = await readFile(new URL("assets/source/story-stage/merchant-poses-v1.png", root));
const merchantSize = await sharp(merchant).metadata();
const merchantFrames = [];
for (let i = 0; i < 4; i++)
  merchantFrames.push(
    await readFrame(merchant, {
      left: (i % 2) * (merchantSize.width / 2),
      top: Math.floor(i / 2) * (merchantSize.height / 2),
      width: merchantSize.width / 2,
      height: merchantSize.height / 2,
    }),
  );
await emit("merchant-poses", merchant, (await packFrames(merchantFrames, 0.25)).image);
// Register dialogue poses with the same 128px cell, 96px stature and crown/feet
// contract as walking. Keep the raw 3x2 generated sheet; pack delivery as 4x2.
for (const id of ["aria", "leon"]) {
  const name = `${id}-poses`;
  const source = await readFile(new URL(`assets/source/story-stage/${name}-v1.png`, root));
  const frames = [];
  for (let i = 0; i < 6; i++)
    frames.push(
      await readFrame(source, {
        left: (i % 3) * 512,
        top: Math.floor(i / 3) * 512,
        width: 512,
        height: 512,
      }),
    );
  // Dialogue hands reach the cheeks; register above them to prevent sideways jumps.
  const atlas = await packFrames(frames, 0.25);
  const adventure = await readFile(new URL(`public/adventure-pixel/${id}.webp`, root));
  const home = await readFile(new URL(`public/home-pixel/${id}.webp`, root));
  const carry = await readFile(new URL("assets/source/story-stage/carry-poses-v1.png", root));
  const work = await workPoseFrames(id, adventure, home, carry);
  const expanded = await sharp({
    create: { width: 512, height: 384, channels: 4, background: "#00000000" },
  })
    .composite([
      { input: atlas.image, left: 0, top: 0 },
      ...work.map((f, i) => ({
        input: f.input,
        left: ((i + 6) % 4) * 128 + f.left,
        top: Math.floor((i + 6) / 4) * 128 + f.top,
      })),
    ])
    .webp({ lossless: true })
    .toBuffer();
  await emit(name, Buffer.concat([source, adventure, home, carry]), expanded);
}
await chapterAssets(root, emit);
await laterAssets(root, emit);
await reviewProps(root, emit);
await teaPreparationAssets(root, emit);
const workshopYard = await readFile(
  new URL("assets/source/story-stage/workshop-yard-v1.png", root),
);
await emit(
  "workshop-yard",
  workshopYard,
  await sharp(workshopYard).resize({ width: 960 }).webp({ lossless: true }).toBuffer(),
);
await licoFieldAssets(root, emit);
await puppetMotionAssets(root, emit);
await carrierAssets(root, emit);
await golemClothAssets(root, emit);
await householdProps(root, emit);
await homewardProps(root, emit);
await picnicAssets(root, emit);
await walnutAssets(root, emit);
await berneOpeningAssets(root, emit);
await berneVisitAssets(root, emit);
await keystoneAssets(root, emit);
await manorAssets(root, emit);
await stoneSelectionAssets(root, emit);
await surveyAssets(root, emit);
await receptionAssets(root, emit);
await nightHandAssets(root, emit);
await bridgeProps(root, emit);
const serialized = JSON.stringify(manifest, null, 2) + "\n";
const manifestPath = new URL("manifest.json", output);
if (check) {
  if ((await readFile(manifestPath, "utf8")).replaceAll("\r\n", "\n") !== serialized)
    throw Error("Stale story stage manifest");
} else await writeFile(manifestPath, serialized);
console.log("Story stage art: verified story backgrounds, props and dialogue pose atlases");
