/** Enclosed transparent regions in a composited actor, excluding the exterior. */
export function transparentHoles({ pixels, width, height }, bounds = [0, 0, width, height]) {
  const visited = new Uint8Array(width * height),
    holes = [];
  for (let seed = 0; seed < visited.length; seed++) {
    if (visited[seed] || pixels[seed * 4 + 3] >= 180) continue;
    const queue = [seed];
    visited[seed] = 1;
    let exterior = false,
      x0 = width,
      y0 = height,
      x1 = 0,
      y1 = 0;
    for (let i = 0; i < queue.length; i++) {
      const p = queue[i],
        x = p % width,
        y = Math.floor(p / width);
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
      if (!x || !y || x === width - 1 || y === height - 1) exterior = true;
      for (const n of [x ? p - 1 : -1, x < width - 1 ? p + 1 : -1, p - width, p + width]) {
        if (n < 0 || n >= visited.length || visited[n] || pixels[n * 4 + 3] >= 180) continue;
        visited[n] = 1;
        queue.push(n);
      }
    }
    if (!exterior && x0 >= bounds[0] && y0 >= bounds[1] && x1 <= bounds[2] && y1 <= bounds[3])
      holes.push({ pixels: queue.length, rect: [x0, y0, x1 - x0 + 1, y1 - y0 + 1] });
  }
  return holes;
}

/** Seal tiny raster-cut cavities using the nearest surrounding painted shading. */
export function sealPaintCavities(pixels, width, height) {
  let sealed = 0;
  for (const hole of transparentHoles({ pixels, width, height }).filter((h) => h.pixels <= 16)) {
    const [left, top, w, h] = hole.rect;
    for (let y = top; y < top + h; y++)
      for (let x = left; x < left + w; x++) {
        const p = (y * width + x) * 4;
        if (pixels[p + 3] >= 180) continue;
        let nearest = null,
          distance = Infinity;
        for (let dy = -4; dy <= 4; dy++)
          for (let dx = -4; dx <= 4; dx++) {
            const q = ((y + dy) * width + x + dx) * 4,
              d = dx * dx + dy * dy;
            if (pixels[q + 3] >= 245 && d < distance) {
              nearest = q;
              distance = d;
            }
          }
        if (nearest === null) throw Error("No neighbouring painted shading for small cavity");
        pixels.copy(pixels, p, nearest, nearest + 3);
        pixels[p + 3] = 255;
        sealed++;
      }
  }
  return sealed;
}
