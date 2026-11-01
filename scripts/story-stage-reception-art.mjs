import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame } from "./home-pixel-frames.mjs";

export async function receptionAssets(root, emit) {
  const raw = await readFile(new URL("assets/source/story-stage/reception-props-v1.png", root));
  // Generated objects have clear gutters at 738..947 and 1213..1400.
  // The rope extends beyond a mathematical third of the source canvas.
  const cuts = [0, 840, 1300, 2160];
  for (const [i, name] of ["snag-rope", "iron-fastener", "cart-drape"].entries()) {
    const f = await readFrame(raw, {
      left: cuts[i],
      top: 0,
      width: cuts[i + 1] - cuts[i],
      height: 728,
    });
    const image = await sharp(f.cell)
      .extract(f.box)
      .resize(256, 256, { fit: "contain", position: "bottom", background: "#00000000" })
      .webp({ lossless: true })
      .toBuffer();
    await emit(`prop-${name}`, raw, image);
  }
  for (const [name, version] of [
    ["manor-well", 2],
    ["manor-display-back", 1],
  ]) {
    const source = await readFile(
      new URL(`assets/source/story-stage/${name}-v${version}.png`, root),
    );
    await emit(name, source, await sharp(source).resize(960).webp({ lossless: true }).toBuffer());
  }
}
