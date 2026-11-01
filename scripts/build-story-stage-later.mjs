import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, packFrames, headBounds } from "./home-pixel-frames.mjs";
import { registerWorkPose } from "./story-stage-pose-frames.mjs";
import { fieldLanterns, plantLabel } from "./story-stage-field-art.mjs";

async function cells(raw, columns, rows) {
  const { width, height } = await sharp(raw).metadata();
  return Promise.all(
    Array.from({ length: columns * rows }, (_, i) =>
      readFrame(raw, {
        left: Math.floor(((i % columns) * width) / columns),
        top: Math.floor((Math.floor(i / columns) * height) / rows),
        width: Math.floor(width / columns),
        height: Math.floor(height / rows),
      }),
    ),
  );
}

async function hero(root, id, source, emit) {
  const raw =
      id === "lico"
        ? await readFile(new URL("assets/source/story-stage/lico-poses-v2.png", root))
        : await source(`${id}-poses`),
    frames = await cells(raw, 4, 2);
  const base = await packFrames(frames.slice(0, 6), 0.25);
  const home = await readFile(new URL(`public/home-pixel/${id}.webp`, root));
  const adventure = await readFile(new URL(`public/adventure-pixel/${id}.webp`, root));
  const homeFrame = await readFrame(home, { left: 0, top: 0, width: 128, height: 128 });
  const head = await headBounds(
    await sharp(homeFrame.cell).extract(homeFrame.box).png().toBuffer(),
    0.25,
  );
  const work = [];
  for (const index of [22, 23])
    work.push(
      await registerWorkPose(
        await readFrame(adventure, {
          left: (index % 4) * 192,
          top: Math.floor(index / 4) * 192,
          width: 192,
          height: 192,
        }),
        head.width,
      ),
    );
  for (const frame of frames.slice(6)) work.push(await registerWorkPose(frame, head.width));
  const image = await sharp({
    create: { width: 512, height: 384, channels: 4, background: "#00000000" },
  })
    .composite([
      { input: base.image, left: 0, top: 0 },
      ...work.map((frame, i) => ({
        input: frame.input,
        left: ((i + 6) % 4) * 128 + frame.left,
        top: Math.floor((i + 6) / 4) * 128 + frame.top,
      })),
    ])
    .webp({ lossless: true })
    .toBuffer();
  await emit(`${id}-poses`, Buffer.concat([raw, home, adventure]), image);
}

export async function laterAssets(root, emit) {
  const source = (name) => readFile(new URL(`assets/source/story-stage/${name}-v1.png`, root));
  const backgrounds = {
    "later-interiors": ["medicine-room", "dining-room", "manor-garden", "workshop"],
    "later-streets": ["mountain-road", "berne-street", "brekka-alley", "village-house"],
    "later-worksites": ["stone-yard", "storeroom", "moss-beds", "registry"],
    "later-locations": ["bridge-night", "warehouse-office", "patient-room", "new-moss-beds"],
  };
  for (const [sheet, names] of Object.entries(backgrounds)) {
    const raw = await source(sheet),
      frames = await cells(raw, 2, 2);
    for (const [i, name] of names.entries())
      await emit(
        name,
        raw,
        await sharp(frames[i].cell).resize({ width: 960 }).webp({ lossless: true }).toBuffer(),
      );
  }
  const raw = await source("later-props"),
    frames = await cells(raw, 4, 3);
  const names = [
    "bread",
    "tea",
    "medicine",
    "herbs",
    "honey",
    "signpost",
    "keystone",
    "replacement",
    "ledger",
    "seedlings",
    "stone-lantern",
    "table",
  ];
  for (const [i, name] of names.entries()) {
    if (name === "stone-lantern") {
      await fieldLanterns(root, emit);
      continue;
    }
    await emit(
      `prop-${name}`,
      raw,
      await sharp(frames[i].cell)
        .extract(frames[i].box)
        .resize({ width: 256 })
        .webp({ lossless: true })
        .toBuffer(),
    );
  }
  await plantLabel(root, emit);
  const hand = await source("later-hand-props"),
    handFrames = await cells(hand, 3, 2);
  for (const [i, name] of ["pot", "key", "juice", "ale", "sample-jar", "handcart"].entries())
    await emit(
      `prop-${name}`,
      hand,
      await sharp(handFrames[i].cell)
        .extract(handFrames[i].box)
        .resize({ width: 256 })
        .webp({ lossless: true })
        .toBuffer(),
    );
  const carts = await source("later-cart"),
    cartFrames = await cells(carts, 3, 1);
  for (const [i, name] of ["basket-cart", "seedling-cart", "empty-cart"].entries())
    await emit(
      `prop-${name}`,
      carts,
      await sharp(cartFrames[i].cell)
        .extract(cartFrames[i].box)
        .resize({ width: 384 })
        .webp({ lossless: true })
        .toBuffer(),
    );
  for (const id of ["puppet", "golem"]) {
    const raw = await readFile(new URL(`assets/source/adventure-enemies/${id}-v1.png`, root));
    const [frame] = await cells(raw, 1, 1);
    await emit(
      `prop-${id}`,
      raw,
      await sharp(frame.cell)
        .extract(frame.box)
        .resize({ height: 384 })
        .webp({ lossless: true })
        .toBuffer(),
    );
  }
  const picnic = await source("picnic-cloth"),
    [spread] = await cells(picnic, 1, 1);
  await emit(
    "prop-picnic-cloth",
    picnic,
    await sharp(spread.cell)
      .extract(spread.box)
      .resize({ width: 384 })
      .webp({ lossless: true })
      .toBuffer(),
  );
  for (const id of ["mira", "finn", "lico"]) await hero(root, id, source, emit);
  for (const id of ["masked-pumpety", "merrill"]) {
    const raw = await source(`${id}-poses`),
      frames = await cells(raw, 2, 2);
    // The reach drawing omits Merrill's left gauntlet: retain her complete idle drawing there.
    if (id === "merrill") frames[2] = frames[0];
    await emit(`${id}-poses`, raw, (await packFrames(frames, 0.25)).image);
  }
  await townsfolk(source, emit);
}

async function townsfolk(source, emit) {
  const raw = await source("later-townsfolk"),
    { width, height } = await sharp(raw).metadata();
  // The source leaves its inter-row gutter slightly below the mathematical midpoint.
  const split = Math.round(height * 0.52);
  for (const [i, id] of ["cook", "doctor", "parent", "child"].entries()) {
    const frame = await readFrame(raw, {
      left: ((i % 2) * width) / 2,
      top: i < 2 ? 0 : split,
      width: width / 2,
      height: i < 2 ? split : height - split,
    });
    let image = (await packFrames([frame, frame, frame, frame], 0.25)).image;
    let provenance = raw;
    if (id === "child") {
      const bed = await source("child-bed");
      const { childBedAtlas } = await import("./story-stage-patient-art.mjs");
      image = await childBedAtlas(image, bed);
      provenance = Buffer.concat([raw, bed]);
    }
    await emit(`${id}-poses`, provenance, image);
  }
}
