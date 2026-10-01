import sharp from "sharp";

// The builder records added paint separately, in exactly the same crop as the source layer.
export async function withoutUnderpaint(art, frame, data) {
  const part = art.master.parts.find((p) => p.frame === frame);
  if (!part) return data;
  const padding = art.framePadding;
  const mask = await sharp(`assets/source/guild/aria-master-v5-parts/${part.name}-underpaint.png`)
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .raw()
    .toBuffer();
  if (mask.length !== data.length) throw Error(`Underpaint crop mismatch: ${part.name}`);
  const clean = Buffer.from(data);
  for (let p = 3; p < clean.length; p += 4) if (mask[p]) clean[p] = 0;
  return clean;
}

export async function diagnosticAtlas(art, file, hide = false) {
  const { data, info } = await sharp(`public${art.asset}`)
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (const part of art.master.parts) {
    const [left, top, width, height] = art.frames[part.frame];
    let layer = await sharp(`public${art.asset}`)
      .extract({ left, top, width, height })
      .raw()
      .toBuffer();
    if (hide) layer = await withoutUnderpaint(art, part.frame, layer);
    else
      for (let p = 0; p < layer.length; p += 4) {
        layer[p] = (part.frame * 71 + 60) % 255;
        layer[p + 1] = (part.frame * 113 + 100) % 255;
        layer[p + 2] = (part.frame * 149 + 150) % 255;
      }
    for (let y = 0; y < height; y++)
      layer.copy(data, ((top + y) * info.width + left) * 4, y * width * 4, (y + 1) * width * 4);
  }
  await sharp(data, { raw: info }).webp({ lossless: true }).toFile(file);
}
