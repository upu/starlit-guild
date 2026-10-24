import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, headBounds } from "./home-pixel-frames.mjs";
import { registerHeroPose } from "./hero-pose-registration.mjs";

const source = (root, name) => readFile(new URL(`assets/source/story-stage/${name}-v1.png`, root));
async function poseCell(frame, head, height) {
  const pose = await registerHeroPose(frame, head, height);
  return sharp({ create: { width: 128, height: 128, channels: 4, background: "#00000000" } })
    .composite([pose])
    .raw()
    .toBuffer();
}
async function referenceHead(image) {
  const ref = await readFrame(image, { left: 0, top: 0, width: 128, height: 128 });
  return (await headBounds(await sharp(ref.cell).extract(ref.box).png().toBuffer(), 0.25)).width;
}
function copyCell(target, cell, frame) {
  for (let y = 0; y < 128; y++) {
    const at = ((Math.floor(frame / 4) * 128 + y) * 512 + (frame % 4) * 128) * 4;
    cell.copy(target, at, y * 128 * 4, (y + 1) * 128 * 4);
  }
}
export async function lanternWorkPoses(root, name, raw, image) {
  if (name === "worker-poses") return workerWiping(root, raw, image);
  if (!["aria", "leon", "mira", "finn", "lico"].some((id) => name === `${id}-poses`))
    return { raw, image };
  const original = await sharp(image).ensureAlpha().raw().toBuffer();
  const output = Buffer.alloc(512 * 1792 * 4);
  original.copy(output);
  let added;
  if (name === "aria-poses") {
    added = await source(root, "aria-fieldwork");
    const { width } = await sharp(added).metadata(),
      // The upper row's boots extend past the nominal 627px half; cut in the clear gutter.
      cuts = [0, 700, 1254];
    const head = await referenceHead(image);
    for (let i = 0; i < 4; i++) {
      const row = Math.floor(i / 2),
        height = cuts[row + 1] - cuts[row];
      const frame = await readFrame(added, {
        left: ((i % 2) * width) / 2,
        top: cuts[row],
        width: width / 2,
        height,
      });
      if (
        frame.box.top < 1 ||
        frame.box.top + frame.box.height >= height ||
        frame.box.left < 1 ||
        frame.box.left + frame.box.width >= width / 2
      )
        throw Error("Fieldwork source is clipped");
      copyCell(output, await poseCell(frame, head, row ? 63 : 96), 52 + i);
    }
  } else {
    // The shared atlas row is reserved for the other heroes, without changing existing cells.
    original.copy(output, original.length, 0, 512 * 128 * 4);
  }
  return {
    raw: added ? Buffer.concat([raw, added]) : raw,
    image: await sharp(output, { raw: { width: 512, height: 1792, channels: 4 } })
      .webp({ lossless: true })
      .toBuffer(),
  };
}
async function workerWiping(root, raw, image) {
  const added = await source(root, "worker-wiping"),
    { width, height } = await sharp(added).metadata();
  const output = await sharp(image).ensureAlpha().raw().toBuffer(),
    head = await referenceHead(image);
  for (let i = 0; i < 2; i++) {
    const frame = await readFrame(added, {
      left: (i * width) / 2,
      top: 0,
      width: width / 2,
      height,
    });
    copyCell(output, await poseCell(frame, head, 96), 13 + i);
  }
  return {
    raw: Buffer.concat([raw, added]),
    image: await sharp(output, { raw: { width: 512, height: 512, channels: 4 } })
      .webp({ lossless: true })
      .toBuffer(),
  };
}
export async function lanternServiceProps(root, emit) {
  const raw = await source(root, "lantern-service-states"),
    { width, height } = await sharp(raw).metadata();
  for (const [i, name] of [
    "stone-lantern-closed-sooty",
    "stone-lantern-empty",
    "stone-lantern-closed-lit",
  ].entries()) {
    const frame = await readFrame(raw, { left: (i * width) / 3, top: 0, width: width / 3, height });
    const body = await sharp(frame.cell)
      .extract(frame.box)
      .resize({ height: 376 })
      .png()
      .toBuffer();
    const roof = await headBounds(body, 0.25);
    const image = await sharp({
      create: { width: 320, height: 400, channels: 4, background: "#00000000" },
    })
      .composite([{ input: body, left: Math.round(160 - roof.left - roof.width / 2), top: 16 }])
      .webp({ lossless: true })
      .toBuffer();
    await emit(`prop-${name}`, raw, image);
  }
  await fieldKit(root, emit);
}
async function fieldKit(root, emit) {
  const raw = await source(root, "lantern-field-kit"),
    { height } = await sharp(raw).metadata();
  const cuts = [0, 840, 1730, 2172];
  for (const [i, name] of ["roadside-grass", "roadside-stubble", "lamp-oil"].entries()) {
    const frame = await readFrame(raw, {
      left: cuts[i],
      top: 0,
      width: cuts[i + 1] - cuts[i],
      height,
    });
    let image;
    if (i === 2)
      image = await sharp(frame.cell)
        .extract(frame.box)
        .resize(128)
        .webp({ lossless: true })
        .toBuffer();
    else {
      // Match the roots and scale, not the changed width/height of the cut blades.
      const scale = 0.3,
        roots = [350, 1190];
      const body = await sharp(frame.cell)
        .extract(frame.box)
        .resize(Math.round(frame.box.width * scale), Math.round(frame.box.height * scale))
        .png()
        .toBuffer();
      image = await sharp({
        create: { width: 320, height: 256, channels: 4, background: "#00000000" },
      })
        .composite([
          {
            input: body,
            left: Math.round(128 - (roots[i] - cuts[i] - frame.box.left) * scale),
            top: 248 - Math.round(frame.box.height * scale),
          },
        ])
        .webp({ lossless: true })
        .toBuffer();
    }
    await emit(`prop-${name}`, raw, image);
  }
}
