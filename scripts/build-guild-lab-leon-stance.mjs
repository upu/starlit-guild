import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { renderMasterPose } from "./guild-lab-master-render.mjs";
import { leonLabStance } from "../lib/guild-lab-leon-stance.ts";

// Deliberate authoring operation, never part of tests: the fixed image is their reference.
const source = JSON.parse(readFileSync("assets/source/guild/leon-stand-v6.json", "utf8"));
if (
  JSON.stringify(source.hip) !== JSON.stringify(leonLabStance.hips.map((p) => [p.x, p.y])) ||
  source.reach !== leonLabStance.reach
)
  throw Error("Standing reference annotations and rig data differ");
const r = await renderMasterPose("idle", 0, undefined, { character: "leon" });
await sharp(r.pixels, { raw: { width: r.width, height: r.height, channels: 4 } })
  .png()
  .toFile(source.image);
writeFileSync(
  "work/leon-stance-authored.txt",
  "Composed once from unchanged Leon paintings using road idle foot spacing; fixed reference for regression tests.\n",
);
