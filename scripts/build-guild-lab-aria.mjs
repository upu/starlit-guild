import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { format } from "prettier";
import { guildLabArt } from "../lib/guild-lab-art.ts";
import { cutMaster, readMasterConfig } from "./guild-lab-master-layers.mjs";
import { registerHead, faceMask } from "./guild-lab-face-masks.mjs";
import { addFramePadding } from "./guild-lab-frame-padding.mjs";

const config = readMasterConfig(),
  cut = await cutMaster(config);
const index = (i) => (i < 12 ? i : i + 1);
const images = new Map(cut.parts.map((p) => [index(p.frame), p.image]));
const parts = cut.parts.map((p) => ({ ...p, frame: index(p.frame) }));
const head = parts[0],
  torso = parts[2];
const local = (point, part = head) => point.slice(0, 2).map((v, i) => v - part.rect[i]);
const regions = {
  eyes: config.eyes.map((r) => [...local(r), ...r.slice(2)]),
  mouth: config.mouthRegion.map((r) => [...local(r), ...r.slice(2)]),
};
const [mw, mh] = local(config.mouth);
const art = {
  width: 1600,
  height: 0,
  frames: [],
  sourceCells: parts.map((p) => p.rect),
  framePadding: 4,
  armJoints: Object.fromEntries(
    parts.filter((p) => p.frame >= 4 && p.frame <= 7).map((p) => [p.frame, p.localJoints]),
  ),
  legJoints: Object.fromEntries(
    parts.filter((p) => p.frame >= 8 && p.frame <= 11).map((p) => [p.frame, p.localJoints]),
  ),
  head: {
    displayHeight: head.rect[3] * config.scale,
    neck: {
      center: local(config.headNeck),
      chinUnder: local(config.chin),
      earUnder: local(config.earUnder),
      visibleNeck: false,
      chinPixels: 1,
    },
    mouth: { x: mw, y: mh, bounds: [mw - 20, mh - 9, 40, 18] },
    blink: null,
    expressions: { neutral: { patches: [], closedEyes: false } },
    faceRegions: regions,
  },
  torso: { neck: { center: local(config.headNeck, torso), source: config.headNeck } },
  hairLock: {
    root: local(config.parts[12].root, parts[12]),
    reviewed: { ears: 0, flowers: 0, skull: false, view: "right" },
  },
  hairLocks: [14, 12, 15].map((i, j) => ({
    name: ["far", "back", "front"][j],
    frame: index(i),
    root: local(config.parts[i].root, parts[i]),
    source: parts[i].rect,
  })),
  backCape: { reviewed: { flowers: 0, knots: 0, frontClasp: false } },
  nearGlove: {
    mirrored: false,
    thumb: local(config.nearGlove.thumb, parts[7]),
    outerEdge: local(config.nearGlove.outerEdge, parts[7]),
  },
  extras: { backHair: 13, skirt: 14 },
  costume: { matchedPair: true, parts: parts.map((p) => ({ rect: p.rect, pixels: p.visible })) },
  asset: "/guild/aria-parts-v1.webp",
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
    parts: parts.map((p) => ({
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
const cp = guildLabArt.framePadding,
  cf = guildLabArt.frames[12];
images.set(
  12,
  await sharp(`public${guildLabArt.asset}`)
    .extract({ left: cf[0] + cp, top: cf[1] + cp, width: cf[2] - cp * 2, height: cf[3] - cp * 2 })
    .png()
    .toBuffer(),
);
const base = await sharp(head.image).ensureAlpha().raw().toBuffer();
const settings = { regions, seed: local(config.faceMask.seed), bounds: config.faceMask.bounds };
for (const key of ["smile", "surprised", "tired", "yawn"]) {
  const aligned = await registerHead(
    `assets/source/guild/aria-head-${key}-v5.png`,
    base,
    head.rect[2],
    head.rect[3],
  );
  const patches = [];
  for (const region of ["eyes", "mouth"]) {
    const patch = faceMask(
      base,
      aligned.pixels,
      head.rect[2],
      head.rect[3],
      region,
      key === "smile" || key === "yawn",
      settings,
    );
    const { pixels, rect, ...measurement } = patch;
    if (!patch.changedPixels) throw Error(`Empty expression ${key}/${region}`);
    const frame = images.size;
    images.set(
      frame,
      await sharp(pixels, { raw: { width: rect[2], height: rect[3], channels: 4 } })
        .png()
        .toBuffer(),
    );
    patches.push({ frame, rect, roi: rect, region, ...measurement, alignment: aligned.alignment });
  }
  art.head.expressions[key] = { patches, closedEyes: key === "smile" || key === "yawn" };
  await sharp(head.image)
    .composite(
      patches.map((p) => ({ input: images.get(p.frame), left: p.rect[0], top: p.rect[1] })),
    )
    .png()
    .toFile(`work/aria-face-${key}.png`);
}
art.head.blink = { ...art.head.expressions.smile.patches[0] };
let x = 8,
  y = 8,
  rowHeight = 0;
const packed = [];
for (let frame = 0; frame < images.size; frame++) {
  const input = images.get(frame),
    { width, height } = await sharp(input).metadata();
  if (x + width + 12 > art.width) {
    x = 8;
    y += rowHeight + 16;
    rowHeight = 0;
  }
  art.frames.push([x, y, width, height]);
  packed.push({ input, left: x, top: y });
  x += width + 16;
  rowHeight = Math.max(rowHeight, height);
}
art.height = y + rowHeight + 8;
await sharp({
  create: {
    width: art.width,
    height: art.height,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(packed)
  .webp({ lossless: true })
  .toFile(`public${art.asset}`);
const padded = addFramePadding(art),
  master = padded.master;
delete padded.master;
writeFileSync(
  "lib/guild-lab-aria-master.ts",
  await format(
    "// Generated from aria-master-v5.json by build-guild-lab-aria.mjs\nexport const ariaLabMaster = " +
      JSON.stringify(master) +
      " as const;\n",
    { parser: "typescript", printWidth: 100 },
  ),
);
writeFileSync(
  "lib/guild-lab-aria-art.ts",
  await format(
    "// Generated: node scripts/build-guild-lab-aria.mjs\nimport {ariaLabMaster} from './guild-lab-aria-master.ts';\nexport const guildLabAriaArt = " +
      JSON.stringify(padded).replace(/}$/, ',"master":ariaLabMaster}') +
      " as const;\n",
    { parser: "typescript", printWidth: 100 },
  ),
);
console.log(`Built master-derived Aria: ${parts.length} layers, ${images.size} frames`);
