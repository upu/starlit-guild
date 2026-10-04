import { readFile } from "node:fs/promises";
import { readFrame } from "./home-pixel-frames.mjs";

// Each half-cycle is authored independently so the returning leg cannot be
// silently replaced by another front-contact pose in a dense eight-cell sheet.
export async function readWalkFrames(source, name) {
  const frames = [];
  for (const half of ["a", "b"]) {
    const image = await readFile(new URL(walkSourceName(name, half), source));
    for (let i = 0; i < 4; i++) {
      frames.push(
        await readFrame(image, {
          left: (i % 2) * 768,
          top: Math.floor(i / 2) * 512,
          width: 768,
          height: 512,
        }),
      );
    }
  }
  return frames;
}

export function walkSourceName(name, half) {
  const version = half === "b" && ["mira", "finn"].includes(name) ? 10 : 9;
  return `${name}-walk-v${version}-${half}.png`;
}
