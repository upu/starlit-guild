import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, headBounds, rowCuts, spriteBounds } from "./home-pixel-frames.mjs";
import { registerWorkPose } from "./story-stage-pose-frames.mjs";

const ids = ["aria", "leon", "mira", "finn", "lico"];
const source = (root, name) => readFile(new URL(`assets/source/story-stage/${name}.png`, root));
async function sheetFrame(raw, col, row, columns, rows) {
  const { width } = await sharp(raw).metadata(),
    cuts = await rowCuts(raw, rows);
  const left = Math.round((col * width) / columns),
    right = Math.round(((col + 1) * width) / columns);
  return readFrame(raw, {
    left,
    top: cuts[row],
    width: right - left,
    height: cuts[row + 1] - cuts[row],
  });
}
async function walkingHead(home) {
  const f = await readFrame(home, { left: 0, top: 0, width: 128, height: 128 });
  return (await headBounds(await sharp(f.cell).extract(f.box).png().toBuffer(), 0.25)).width;
}

async function restingPose(frame, head) {
  const registered = await registerWorkPose(frame, head);
  const bounds = await spriteBounds(registered.input);
  // Sitting keeps a visibly lower silhouette; allow only the same 3px head
  // variation seen across the existing walking frames, never stretch the body.
  if (bounds.height <= 80) return registered;
  return registerWorkPose(frame, Math.max(head - 3, (head * 80) / bounds.height));
}
export async function reviewHero(root, name, raw, original) {
  const id = name.replace("-poses", ""),
    row = ids.indexOf(id);
  if (row < 0) return { raw, image: original };
  const home = await readFile(new URL(`public/home-pixel/${id}.webp`, root));
  const head = await walkingHead(home),
    rest = await source(root, "rest-poses-v2"),
    carry = await source(root, "carry-reactions-v2");
  const frames = [];
  for (let i = 0; i < 10; i++) {
    const f = await readFrame(original, {
      left: (i % 4) * 128,
      top: Math.floor(i / 4) * 128,
      width: 128,
      height: 128,
    });
    frames.push(await registerWorkPose(f, head, i < 6 || i > 7 ? 96 : undefined));
  }
  for (let col = 0; col < 4; col++)
    frames.push(await restingPose(await sheetFrame(rest, col, row, 4, 5), head));
  for (let col = 0; col < 3; col++)
    frames.push(await registerWorkPose(await sheetFrame(carry, col, row, 3, 5), head, 96));
  const actions = await source(root, "scene-actions-v3");
  for (let i = 17; i <= 20; i++) {
    const action = (id === "leon" && i < 19) || (id === "aria" && i >= 19);
    frames.push(
      action
        ? await registerWorkPose(
            await sheetFrame(actions, (i - 17) % 2, id === "leon" ? 0 : 1, 2, 3),
            head,
            96,
          )
        : frames[0],
    );
  }
  const adventure = await readFile(new URL(`public/adventure-pixel/${id}.webp`, root));
  frames.push(
    id === "leon"
      ? await registerWorkPose(
          await readFrame(adventure, { left: 384, top: 384, width: 192, height: 192 }),
          head,
        )
      : frames[0],
  );
  const image = await sharp({
    create: { width: 512, height: 768, channels: 4, background: "#00000000" },
  })
    .composite(
      frames.map((f, i) => ({
        input: f.input,
        left: (i % 4) * 128 + f.left,
        top: Math.floor(i / 4) * 128 + f.top,
      })),
    )
    .webp({ lossless: true })
    .toBuffer();
  return { raw: Buffer.concat([raw, home, rest, carry, actions, adventure]), image };
}
export async function reviewProps(root, emit) {
  const actions = await source(root, "merrill-walk-v1"),
    merrill = await readFile(new URL("public/story-stage/merrill-poses.webp", root));
  const head = await walkingHead(merrill),
    frames = [];
  for (let col = 0; col < 4; col++)
    frames.push(await registerWorkPose(await sheetFrame(actions, col, 0, 4, 1), head, 96));
  const image = await sharp({
    create: { width: 512, height: 128, channels: 4, background: "#00000000" },
  })
    .composite(frames.map((f, i) => ({ input: f.input, left: i * 128 + f.left, top: f.top })))
    .webp({ lossless: true })
    .toBuffer();
  await emit("merrill-walk", Buffer.concat([actions, merrill]), image);
  const bag = await source(root, "delivery-bag-v1");
  await emit(
    "prop-delivery-bag",
    bag,
    await sharp(bag)
      .extract(await spriteBounds(bag))
      .resize({ width: 256 })
      .webp({ lossless: true })
      .toBuffer(),
  );
}
