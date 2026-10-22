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
    if (id === "aria" && i < 19) {
      frames.push(
        await registerWorkPose(
          await sheetFrame(await source(root, "aria-writing-v1"), i - 17, 0, 2, 1),
          head,
          96,
        ),
      );
      continue;
    }
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
  const walk = row < 2 ? await source(root, "carry-walk-v3") : null;
  if (walk)
    for (const [col, index] of [8, 9, 22, 23].entries())
      frames[index] = await registerWorkPose(await sheetFrame(walk, col, row, 4, 2), head, 96);
  while (frames.length < 24) frames.push(frames[0]);
  const chair = await source(root, `${id}-chair-v1`);
  for (let i = 0; i < 8; i++)
    frames.push(
      await registerWorkPose(await sheetFrame(chair, i % 4, Math.floor(i / 4), 4, 2), head, 88),
    );
  const bed = id === "mira" ? await source(root, "mira-bed-v1") : null;
  for (let i = 0; i < 4; i++)
    frames.push(
      bed
        ? await registerWorkPose(
            await sheetFrame(bed, i, 0, 4, 1),
            head,
            undefined,
            i === 3 ? { headCenter: 94 } : {},
          )
        : frames[0],
    );
  const stool = id === "lico" ? await source(root, "lico-stool-v1") : null;
  const perch = !stool ? await source(root, "perch-poses-v1") : null;
  for (let i = 0; i < 8; i++) {
    const f = stool
      ? await sheetFrame(stool, i % 4, Math.floor(i / 4), 4, 2)
      : await sheetFrame(perch, i % 4, row, 4, 4);
    const registered = await registerWorkPose(f, head, 80);
    if (perch && i >= 4) {
      const { width } = await sharp(registered.input).metadata();
      registered.input = await sharp(registered.input).flop().png().toBuffer();
      registered.left = 128 - registered.left - width;
    }
    frames.push(registered);
  }
  const push = id === "leon" ? await source(root, "leon-push-v1") : null;
  const knock = id === "finn" ? await source(root, "finn-knock-v1") : null;
  const gesture = push ?? knock;
  for (let i = 0; i < 4; i++)
    frames.push(
      gesture && i < 2
        ? await registerWorkPose(await sheetFrame(gesture, i, 0, 2, 1), head, 92)
        : frames[0],
    );
  const image = await sharp({
    create: { width: 512, height: 1536, channels: 4, background: "#00000000" },
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
  return {
    raw: Buffer.concat([
      raw,
      home,
      rest,
      carry,
      actions,
      adventure,
      chair,
      ...(stool ? [stool] : []),
      ...(perch ? [perch] : []),
      ...(bed ? [bed] : []),
      ...(walk ? [walk] : []),
      ...(push ? [push] : []),
      ...(knock ? [knock] : []),
    ]),
    image,
  };
}
export async function reviewProps(root, emit) {
  const notebook = await source(root, "closed-ledger-v1");
  await emit(
    "prop-closed-ledger",
    notebook,
    await sharp(notebook)
      .extract(await spriteBounds(notebook))
      .resize({ width: 192 })
      .webp({ lossless: true })
      .toBuffer(),
  );
  const teaKit = await source(root, "tea-kit-v1");
  const { height: teaHeight } = await sharp(teaKit).metadata();
  const cuts = [0, 550, 1100, 1480, 2172];
  for (const [i, name] of ["brazier", "kettle", "teacup", "tea-four"].entries()) {
    const f = await readFrame(teaKit, {
      left: cuts[i],
      top: 0,
      width: cuts[i + 1] - cuts[i],
      height: teaHeight,
    });
    await emit(
      `prop-${name}`,
      teaKit,
      await sharp(f.cell).extract(f.box).resize({ width: 256 }).webp({ lossless: true }).toBuffer(),
    );
  }
  const diningTable = await source(root, "dining-table-v1");
  await emit(
    "prop-dining-table",
    diningTable,
    await sharp(diningTable)
      .extract(await spriteBounds(diningTable))
      .resize({ width: 384 })
      .webp({ lossless: true })
      .toBuffer(),
  );
  const chair = await source(root, "chair-v1");
  await emit(
    "prop-chair",
    chair,
    await sharp(chair)
      .extract(await spriteBounds(chair))
      .resize({ width: 192 })
      .webp({ lossless: true })
      .toBuffer(),
  );
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
  const jar = await source(root, "moss-jar-v1");
  await emit(
    "prop-moss-jar",
    jar,
    await sharp(jar)
      .extract(await spriteBounds(jar))
      .resize({ width: 192 })
      .webp({ lossless: true })
      .toBuffer(),
  );
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
