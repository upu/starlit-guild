import sharp from "sharp";
import { readFrame, headBounds } from "./home-pixel-frames.mjs";
import { registerHeroPose } from "./hero-pose-registration.mjs";

// Keep the existing child's four frames byte-for-byte in the first row.
// The bed row uses that child's head scale, not a standing silhouette height.
export async function childBedAtlas(base, raw) {
  const reference = await readFrame(base, { left: 0, top: 0, width: 128, height: 128 });
  const head = await headBounds(
    await sharp(reference.cell).extract(reference.box).png().toBuffer(),
    // The original NPC row has isolated pixels above the hair. Its upper quarter
    // measures only a hair tip; include the whole head when taking the reference.
    0.5,
  );
  const { width, height } = await sharp(raw).metadata();
  const frames = [];
  for (let col = 0; col < 4; col++) {
    const left = Math.round((col * width) / 4);
    const frame = await readFrame(raw, {
      left,
      top: 0,
      width: Math.round(((col + 1) * width) / 4) - left,
      height,
    });
    frames.push(await registerHeroPose(frame, head.width, undefined, { headCenter: 76 }));
  }
  return sharp({
    create: { width: 512, height: 256, channels: 4, background: "#00000000" },
  })
    .composite([
      { input: base, left: 0, top: 0 },
      ...frames.map((f, i) => ({ input: f.input, left: i * 128 + f.left, top: 128 + f.top })),
    ])
    .webp({ lossless: true })
    .toBuffer();
}
