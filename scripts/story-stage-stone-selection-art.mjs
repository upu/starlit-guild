import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, rowCuts, headBounds } from "./home-pixel-frames.mjs";
import { registerHeroPose } from "./hero-pose-registration.mjs";

async function cells(raw, columns, rows) {
  const { width } = await sharp(raw).metadata();
  const cuts = await rowCuts(raw, rows);
  return Promise.all(
    Array.from({ length: columns * rows }, (_, i) => {
      const column = i % columns,
        row = Math.floor(i / columns);
      const left = Math.floor((column * width) / columns);
      return readFrame(raw, {
        left,
        top: cuts[row],
        width: Math.floor(((column + 1) * width) / columns) - left,
        height: cuts[row + 1] - cuts[row],
      });
    }),
  );
}
export async function stoneSelectionAssets(root, emit) {
  const carrier = await readFile(new URL("assets/source/story-stage/stone-carrier-v1.png", root));
  const worker = await readFile(new URL("public/story-stage/worker-poses.webp", root));
  const reference = await readFrame(worker, { left: 0, top: 0, width: 128, height: 128 });
  const head = await headBounds(
    await sharp(reference.cell).extract(reference.box).png().toBuffer(),
    0.25,
  );
  const frames = await cells(carrier, 4, 2),
    layers = [];
  for (const [i, frame] of frames.entries()) {
    const registered = await registerHeroPose(
      frame,
      head.width,
      i === 5 || i === 6 ? undefined : reference.box.height,
    );
    layers.push({
      input: registered.input,
      left: (i % 4) * 128 + registered.left,
      top: Math.floor(i / 4) * 128 + registered.top,
    });
  }
  await emit(
    "stone-carrier-poses",
    Buffer.concat([carrier, worker]),
    await sharp({ create: { width: 512, height: 256, channels: 4, background: "#00000000" } })
      .composite(layers)
      .webp({ lossless: true })
      .toBuffer(),
  );
  const props = await readFile(new URL("assets/source/story-stage/stone-candidates-v1.png", root));
  const parts = await cells(props, 3, 2);
  const names = [
    "candidate-blue",
    "candidate-violet",
    "candidate-dull",
    "covered-stone",
    "stone-wrap",
    "wrapped-stone",
  ];
  for (const [i, name] of names.entries()) {
    const frame = parts[i];
    const image = await sharp(frame.cell)
      .extract(frame.box)
      .resize(256, 320, { fit: "contain", position: "bottom", background: "#00000000" })
      .webp({ lossless: true })
      .toBuffer();
    await emit(`prop-${name}`, props, image);
  }
  const room = await readFile(new URL("assets/source/story-stage/stone-storeroom-v2.png", root));
  await emit(
    "stone-storeroom",
    room,
    await sharp(room).resize(960).webp({ lossless: true }).toBuffer(),
  );
}
