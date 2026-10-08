export function isolateSprite(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) throw Error("敵の輪郭を読み取れませんでした。");
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const largest = largestComponent(image.data, canvas.width, canvas.height);
  const keep = new Uint8Array(canvas.width * canvas.height);
  for (const p of largest) keepEdge(keep, p, canvas.width, canvas.height);
  for (let p = 0; p < keep.length; p++) if (!keep[p]) image.data.fill(0, p * 4, p * 4 + 4);
  context.putImageData(image, 0, 0);
}

function keepEdge(keep: Uint8Array, p: number, width: number, height: number) {
  const x = p % width,
    y = Math.floor(p / width);
  for (let dy = -2; dy <= 2; dy++)
    for (let dx = -2; dx <= 2; dx++) {
      const nx = x + dx,
        ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) keep[ny * width + nx] = 1;
    }
}

function largestComponent(data: Uint8ClampedArray, width: number, height: number) {
  const seen = new Uint8Array(width * height);
  let largest: number[] = [];
  for (let p = 0; p < seen.length; p++) {
    if (seen[p] || data[p * 4 + 3] < 96) continue;
    const pixels = collectComponent(p, data, seen, width, height);
    if (pixels.length > largest.length) largest = pixels;
  }
  return largest;
}

function collectComponent(
  start: number,
  data: Uint8ClampedArray,
  seen: Uint8Array,
  width: number,
  height: number,
) {
  const pixels = [start];
  seen[start] = 1;
  for (let n = 0; n < pixels.length; n++) {
    const p = pixels[n],
      x = p % width,
      y = Math.floor(p / width);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        ny = y + dy,
        q = ny * width + nx;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height || seen[q] || data[q * 4 + 3] < 96)
        continue;
      seen[q] = 1;
      pixels.push(q);
    }
  }
  return pixels;
}
