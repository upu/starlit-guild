import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { matchBootPalette } from "./guild-lab-boot-palette.mjs";

export async function bentPaint() {
  const config = JSON.parse(readFileSync("assets/source/guild/aria-bent-limbs-v6.json", "utf8")),
    out = [];
  for (const p of config.parts) {
    const [left, top, width, height] = p.cell;
    const { data, info } = await sharp(config.image)
      .extract({ left, top, width, height })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const palette = p.kind === "leg" ? await matchBootPalette(data, p.side) : null;
    let x0 = width,
      y0 = height,
      x1 = 0,
      y1 = 0;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        if (data[(y * width + x) * 4 + 3] > 200) {
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x);
          y0 = Math.min(y0, y);
          y1 = Math.max(y1, y);
        }
    for (let q = 3; q < data.length; q += 4) data[q] = data[q] >= 180 ? 255 : 0;
    const rect = [x0 - 8, y0 - 8, x1 - x0 + 17, y1 - y0 + 17];
    const image = await sharp(data, { raw: info })
      .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
      .extend({ left: 8, right: 8, top: 8, bottom: 8, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    const local = (point) => [point[0] - left - rect[0], point[1] - top - rect[1]];
    const root = local(p.root),
      hinge = local(p.hinge),
      end = local(p.end);
    const angle = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]);
    const bend = (Math.abs(angle(hinge, end) - angle(root, hinge)) * 180) / Math.PI;
    writeFileSync(`assets/source/guild/${p.name}-v6.png`, image);
    let forearm = null;
    if (p.kind === "arm") {
      const pixels = await sharp(image).raw().toBuffer();
      const dx = hinge[0] - root[0],
        dy = hinge[1] - root[1],
        length2 = dx * dx + dy * dy;
      for (let y = 0; y < rect[3]; y++)
        for (let x = 0; x < rect[2]; x++)
          if (((x - root[0]) * dx + (y - root[1]) * dy) / length2 < 0.83)
            pixels[(y * rect[2] + x) * 4 + 3] = 0;
      forearm = await sharp(pixels, { raw: { width: rect[2], height: rect[3], channels: 4 } })
        .png()
        .toBuffer();
      writeFileSync(`assets/source/guild/${p.name}-forearm-v6.png`, forearm);
    }
    out.push({ ...p, image, forearm, root, hinge, end, bend, rect, palette });
  }
  return out;
}
