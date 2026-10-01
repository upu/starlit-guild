import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { format } from "prettier";
import { guildLabArt as previous } from "../lib/guild-lab-art.ts";
import { cutLeonMaster } from "./guild-lab-leon-master.mjs";
import { splitMasterFeet } from "./guild-lab-foot-paint.mjs";
import { registerHead, faceMask } from "./guild-lab-face-masks.mjs";
import { addFramePadding } from "./guild-lab-frame-padding.mjs";

const config = JSON.parse(readFileSync("assets/source/guild/leon-master-v7.json"));
const cut = await cutLeonMaster(config),
  feet = await splitMasterFeet(config, cut),
  head = cut.parts[0];
const local = (p, part = head) => p.map((v, i) => v - part.rect[i]);
const images = new Map(cut.parts.map((p) => [p.frame, p.image]));
const cup = "assets/source/guild/tea-cup-v7.png";
if (!existsSync(cup)) {
  const [left, top, width, height] = previous.frames[12];
  await sharp("public" + previous.asset)
    .extract({ left, top, width, height })
    .png()
    .toFile(cup);
}
images.set(12, readFileSync(cup));
const regions = {
  eyes: config.eyes.map((r) => [...local(r.slice(0, 2)), ...r.slice(2)]),
  mouth: config.mouthRegion.map((r) => [...local(r.slice(0, 2)), ...r.slice(2)]),
};
const [mx, my] = local(config.mouth);
const art = {
  width: 1800,
  height: 0,
  frames: [],
  framePadding: 4,
  asset: "/guild/leon-parts-v4.webp",
  armJoints: Object.fromEntries(cut.parts.slice(4, 8).map((p) => [p.frame, p.localJoints])),
  legJoints: Object.fromEntries(cut.parts.slice(8, 12).map((p) => [p.frame, p.localJoints])),
  head: {
    displayHeight: head.rect[3] * config.scale,
    neck: {
      center: local(config.headNeck),
      chinUnder: local(config.chin),
      earUnder: local(config.earUnder),
      visibleNeck: false,
    },
    mouth: { x: mx, y: my, bounds: [mx - 22, my - 10, 44, 20] },
    blink: null,
    expressions: {},
  },
  torso: { neck: { center: local(config.headNeck, cut.parts[2]) } },
  master: {
    image: config.image,
    scale: config.scale,
    origin: config.origin,
    waist: config.waist,
    neck: config.headNeck,
    collar: config.collar,
    chin: config.chin,
    cheeks: config.cheeks,
    reviewed: config.reviewed,
    parts: cut.parts.map((p) => ({
      name: p.name,
      frame: p.frame,
      layer: p.layer,
      visible: p.visible,
      added: p.added,
      ...(p.joints ? { joints: p.joints } : {}),
      ...(p.root ? { root: p.root } : {}),
      rect: [p.rect[0] - 4, p.rect[1] - 4, p.rect[2] + 8, p.rect[3] + 8],
    })),
  },
};
const base = await sharp(head.image).raw().toBuffer();
const sheet = await sharp("assets/source/guild/leon-expressions-v7.png")
  .resize(1536, 1024)
  .png()
  .toBuffer();
for (const [key, cell] of [
  ["blink", 5],
  ["neutral", 0],
  ["smile", 1],
  ["surprised", 2],
  ["tired", 3],
  ["yawn", 4],
]) {
  const source = `assets/source/guild/leon-head-${key}-v7.png`;
  await sharp(sheet)
    .extract({ left: (cell % 3) * 512, top: Math.floor(cell / 3) * 512, width: 512, height: 512 })
    .png()
    .toFile(source);
  const aligned = await registerHead(source, base, head.rect[2], head.rect[3]),
    patches = [];
  for (const region of key === "blink" || key === "neutral" ? ["eyes"] : ["eyes", "mouth"]) {
    const patch = faceMask(
      base,
      aligned.pixels,
      head.rect[2],
      head.rect[3],
      region,
      ["blink", "smile", "yawn"].includes(key),
      {
        regions,
        seed: local(config.faceMask.seed),
        bounds: config.faceMask.bounds.map((v, i) => v - head.rect[i % 2]),
      },
    );
    const { pixels, rect, ...measure } = patch,
      frame = images.size;
    images.set(
      frame,
      await sharp(pixels, { raw: { width: rect[2], height: rect[3], channels: 4 } })
        .png()
        .toBuffer(),
    );
    patches.push({ frame, rect, roi: rect, region, ...measure, alignment: aligned.alignment });
  }
  if (key === "blink") art.head.blink = patches[0];
  else art.head.expressions[key] = { patches, closedEyes: ["smile", "yawn"].includes(key) };
}
art.feet = feet.map((f) => {
  const frame = images.size;
  images.set(frame, f.image);
  return { frame, root: f.root, rect: f.rect, sole: f.sole, point: f.point, overlap: f.overlap };
});
let x = 8,
  y = 8,
  row = 0;
const packed = [];
for (const input of images.values()) {
  const { width, height } = await sharp(input).metadata();
  if (x + width + 12 > art.width) {
    x = 8;
    y += row + 16;
    row = 0;
  }
  art.frames.push([x, y, width, height]);
  packed.push({ input, left: x, top: y });
  x += width + 16;
  row = Math.max(row, height);
}
art.height = y + row + 8;
await sharp({
  create: { width: art.width, height: art.height, channels: 4, background: "#00000000" },
})
  .composite(packed)
  .webp({ lossless: true })
  .toFile("public" + art.asset);
writeFileSync(
  "lib/guild-lab-art.ts",
  await format(
    "// Generated: node scripts/build-guild-lab-leon.mjs\nexport const guildLabArt = " +
      JSON.stringify(addFramePadding(art)) +
      " as const;\n",
    { parser: "typescript", printWidth: 100 },
  ),
);
console.log("Built completed-master Leon", images.size, "frames");
