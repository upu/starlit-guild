import sharp from "sharp";

export async function isolatedParts(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info,
    labels = new Int32Array(width * height),
    parts = [];
  let id = 0;
  for (let p = 0; p < labels.length; p++) {
    if (labels[p] || data[p * 4 + 3] < 32) continue;
    id++;
    const queue = [p];
    labels[p] = id;
    let x0 = width,
      y0 = height,
      x1 = 0,
      y1 = 0;
    for (let i = 0; i < queue.length; i++) {
      const q = queue[i],
        x = q % width,
        y = Math.floor(q / width);
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
      for (const n of [x ? q - 1 : -1, x < width - 1 ? q + 1 : -1, q - width, q + width])
        if (n >= 0 && n < labels.length && !labels[n] && data[n * 4 + 3] >= 32) {
          labels[n] = id;
          queue.push(n);
        }
    }
    if (queue.length > 1000)
      parts.push({ id, rect: [x0, y0, x1 - x0 + 1, y1 - y0 + 1], count: queue.length });
  }
  return parts
    .sort((a, b) => a.rect[0] - b.rect[0])
    .map((part) => {
      const [left, top, w, h] = part.rect,
        pixels = Buffer.alloc(w * h * 4);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const p = (top + y) * width + left + x;
          // Include antialiasing immediately next to this component, never neighbours.
          if (
            labels[p] === part.id ||
            (!labels[p] && [-1, 1, -width, width].some((d) => labels[p + d] === part.id))
          )
            data.copy(pixels, (y * w + x) * 4, p * 4, p * 4 + 4);
        }
      return { ...part, pixels, width: w, height: h };
    });
}
export async function fitPadded(input, width, height, padding = 6) {
  const trimmed = await sharp(input).trim({ threshold: 20 }).png().toBuffer();
  const resized = await sharp(trimmed)
    .resize(width - padding * 2, height - padding * 2, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  return sharp(resized)
    .extend({
      left: padding,
      right: padding,
      top: padding,
      bottom: padding,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}
