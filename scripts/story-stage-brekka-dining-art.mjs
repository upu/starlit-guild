import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, headBounds } from "./home-pixel-frames.mjs";
import { registerHeroPose } from "./hero-pose-registration.mjs";

const source = (root, name) => readFile(new URL(`assets/source/story-stage/${name}-v1.png`, root));
async function cell(frame, head, height) {
  const pose = await registerHeroPose(frame, head, height);
  return sharp({ create: { width: 128, height: 128, channels: 4, background: "#00000000" } })
    .composite([pose])
    .raw()
    .toBuffer();
}
function copyCell(target, cell, frame) {
  for (let y = 0; y < 128; y++)
    cell.copy(target, (y * 512 + frame * 128) * 4, y * 512, (y + 1) * 512);
}
export async function brekkaDiningPoses(root, name, raw, image) {
  const id = name.replace(/-poses$/, "");
  if (!["aria", "leon", "mira", "finn", "lico", "worker"].includes(id) || !name.endsWith("-poses"))
    return { raw, image };
  const old = await sharp(image).ensureAlpha().raw().toBuffer();
  const base = await readFrame(image, {
    left: 0,
    top: id === "worker" ? 0 : 768,
    width: 128,
    height: 128,
  });
  const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
  const added = Buffer.alloc(512 * 128 * 4);
  let input;
  if (id === "lico") {
    const reserved = await sharp(image)
      .extract({ left: 0, top: 768, width: 512, height: 128 })
      .ensureAlpha()
      .raw()
      .toBuffer();
    reserved.copy(added);
  } else {
    const young = ["aria", "leon"].includes(id);
    input = await source(
      root,
      id === "worker" ? "worker-dining" : young ? "brekka-young-drinks" : "brekka-adult-drinks",
    );
    const { width, height } = await sharp(input).metadata();
    const rows = id === "worker" ? 1 : 2;
    const row =
      id === "worker" ? 0 : young ? ["aria", "leon"].indexOf(id) : ["mira", "finn"].indexOf(id);
    for (let col = 0; col < 3; col++) {
      const frame = await readFrame(input, {
        left: (col * width) / 3,
        top: (row * height) / rows,
        width: width / 3,
        height: height / rows,
      });
      if (
        frame.box.left < 2 ||
        frame.box.top < 2 ||
        frame.box.left + frame.box.width > width / 3 - 2 ||
        frame.box.top + frame.box.height > height / rows - 2
      )
        throw Error(`${id}: dining source touches cell edge`);
      copyCell(added, await cell(frame, head.width, id === "worker" ? 88 : base.box.height), col);
    }
    for (let y = 0; y < 128; y++)
      added.copy(added, (y * 512 + 384) * 4, y * 512 * 4, (y * 512 + 128) * 4);
  }
  return {
    raw: input ? Buffer.concat([raw, input]) : raw,
    image: await sharp(Buffer.concat([old, added]), {
      raw: { width: 512, height: id === "worker" ? 640 : 1920, channels: 4 },
    })
      .webp({ lossless: true })
      .toBuffer(),
  };
}
export async function brekkaDiningProps(root, emit) {
  const raw = await source(root, "brekka-drinks"),
    { width, height } = await sharp(raw).metadata();
  const cuts = [0, 430, height];
  for (const [i, name] of ["ale-cup-empty", "ale-cup-full", "fruit-glass", "ale-jug"].entries()) {
    const row = Math.floor(i / 2);
    const frame = await readFrame(raw, {
      left: ((i % 2) * width) / 2,
      top: cuts[row],
      width: width / 2,
      height: cuts[row + 1] - cuts[row],
    });
    const image = await sharp(frame.cell)
      .extract(frame.box)
      .resize(128)
      .webp({ lossless: true })
      .toBuffer();
    await emit(`prop-${name}`, raw, image);
  }
  const room = await source(root, "brekka-dining-room");
  await emit(
    "brekka-dining-room",
    room,
    await sharp(room).resize(960, 640).webp({ lossless: true }).toBuffer(),
  );
}
