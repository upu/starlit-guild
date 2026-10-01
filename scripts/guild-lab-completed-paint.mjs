import sharp from "sharp";

/** Registration maps a reviewed complete garment to its master-painting footprint. */
export async function completedPaint(config, name) {
  const part = config.completedPaint?.parts[name];
  if (!part) return null;
  const [left, top, width, height] = part.cell;
  const crop = await sharp(config.completedPaint.image)
    .extract({ left, top, width, height })
    .ensureAlpha()
    .raw()
    .toBuffer();
  // Find the painted component, excluding fully transparent RGB and soft export halos.
  let x0 = width,
    y0 = height,
    x1 = 0,
    y1 = 0;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (crop[(y * width + x) * 4 + 3] >= 200) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
  const pixels = await sharp(crop, { raw: { width, height, channels: 4 } })
    .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
    .resize(part.rect[2], part.rect[3], { fit: "fill" })
    .raw()
    .toBuffer();
  return { ...part, pixels };
}
