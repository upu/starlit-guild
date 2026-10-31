import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { readFrame } from "./home-pixel-frames.mjs";

const root = "public/storybook-study/";
for (const name of [
  "drain-inspection-empty-dusk-v1",
  "tower-front-dusk-v1",
  "tower-front-open-dusk-v1",
]) {
  const source = `assets/source/storybook/${name}.png`,
    metadata = await sharp(source).metadata();
  if (metadata.width !== 1536 || metadata.height !== 1024) throw Error("Keep the approved camera");
  await sharp(source).png({ compressionLevel: 9 }).toFile(`${root}${name}.png`);
}
await strip(
  "keeper-lantern-registered-v2",
  "keeper-lantern-v1",
  3,
  [0, 1, 2, 3].map((frame) => ["keeper-lantern-v1", frame]),
  128,
  120,
  93,
);
await strip(
  "worker-repair-basket-v2",
  "waterway-worker-handoff-v1",
  0,
  [
    ...[0, 1, 2, 3].map((frame) => ["waterway-worker-handoff-v1", frame]),
    ...[0, 1, 2, 3].map((frame) => ["waterway-worker-basket-walk-v1", frame]),
  ],
  128,
  120,
  93,
);
for (const hero of ["aria", "leon"])
  await strip(
    `${hero}-rest-perch-v2`,
    `${hero}-perch-v1`,
    0,
    [0, 1, 2, 3].map((frame) => [`${hero}-perch-v1`, frame]),
    192,
    176,
    148,
  );

async function strip(name, reference, standing, frames, cell, baseline, height) {
  const referencePose = await readFrame(
    `${root}${reference}.webp`,
    await cellRect(reference, standing),
  );
  const scale = height / referencePose.box.height;
  const layers = [],
    metrics = [];
  for (const [index, [source, frame]] of frames.entries()) {
    const pose = await readFrame(`${root}${source}.webp`, await cellRect(source, frame));
    const { data, info } = await sharp(pose.cell)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const box = pose.box;
    let sum = 0,
      count = 0;
    const low =
      (name.startsWith("keeper") && frame < 2) ||
      (source.includes("handoff") && (frame === 1 || frame === 2));
    for (let y = box.top + Math.floor(box.height * 0.92); y < box.top + box.height; y++)
      for (
        let x = box.left + Math.floor(box.width * (low ? 0.45 : 0));
        x < box.left + box.width;
        x++
      )
        if (data[(y * info.width + x) * 4 + 3] > 128) {
          sum += x;
          count++;
        }
    if (!count) throw Error(`Missing feet: ${name}/${index}`);
    const width = Math.round(box.width * scale),
      h = Math.round(box.height * scale);
    const left = Math.round(cell / 2 - (sum / count - box.left) * scale),
      top = baseline - h;
    if (left < 2 || left + width > cell - 2 || top < 3) throw Error(`Clipped ${name}/${index}`);
    layers.push({
      input: await sharp(pose.cell)
        .extract(box)
        .resize(width, h, { kernel: "nearest" })
        .png()
        .toBuffer(),
      left: (index % 4) * cell + left,
      top: Math.floor(index / 4) * cell + top,
    });
    metrics.push({
      frame: index,
      source,
      sourceFrame: frame,
      scale,
      left,
      top,
      width,
      height: h,
      baseline,
    });
  }
  await sharp({
    create: {
      width: cell * 4,
      height: Math.ceil(frames.length / 4) * cell,
      channels: 4,
      background: "#00000000",
    },
  })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`${root}${name}.webp`);
  await writeFile(`${root}${name}-metrics.json`, JSON.stringify(metrics, null, 2) + "\n");
  console.log(
    name,
    metrics.map((m) => ({ frame: m.frame, height: m.height, left: m.left, top: m.top })),
  );
}
async function cellRect(source, frame) {
  const m = await sharp(`${root}${source}.webp`).metadata();
  return {
    left: ((frame % 4) * m.width) / 4,
    top: Math.floor(frame / 4) * (source.includes("handoff") ? 192 : m.height),
    width: m.width / 4,
    height: source.includes("handoff") ? 192 : m.height,
  };
}
