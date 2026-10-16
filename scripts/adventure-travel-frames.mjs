import sharp from "sharp";
import { readFrame, headBounds, rowCuts } from "./home-pixel-frames.mjs";
import { registerHeroPose } from "./hero-pose-registration.mjs";
import { adventureHeroArt } from "../lib/adventure-hero-art.ts";

export async function walkingHeadWidth(home) {
  const frame = await readFrame(home, { left: 0, top: 0, width: 128, height: 128 });
  return (await headBounds(await sharp(frame.cell).extract(frame.box).png().toBuffer(), 0.25))
    .width;
}

export async function adventureTravelFrames(source, headWidth) {
  const { width } = await sharp(source).metadata();
  const cuts = await rowCuts(source, 2),
    result = new Map();
  for (const [i, index] of [8, 9, 18, 19, 20, 21].entries()) {
    const row = Math.floor(i / 3);
    const frame = await readFrame(source, {
      left: (i % 3) * (width / 3),
      top: cuts[row],
      width: width / 3,
      height: cuts[row + 1] - cuts[row],
    });
    const pose = await registerHeroPose(frame, headWidth, i < 2 ? 96 : 92, adventureHeroArt);
    const meta = await sharp(pose.input).metadata();
    result.set(index, {
      ...pose,
      anchor: {
        frame: index,
        source: frame.box,
        headWidth,
        left: pose.left,
        top: pose.top,
        width: meta.width,
        height: meta.height,
        sourceFile: "travel-v2",
      },
    });
  }
  return result;
}
