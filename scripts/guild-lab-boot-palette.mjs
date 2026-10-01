import sharp from "sharp";

export const bootLeather = (r, g, b, a) =>
  a >= 180 &&
  r > 40 &&
  r < 190 &&
  g < 145 &&
  r / g > 1.12 &&
  r / g < 1.85 &&
  b / g > 0.5 &&
  b / g < 0.85;
export function leatherMedian(pixels) {
  const colors = [[], [], []];
  for (let i = 0; i < pixels.length; i += 4)
    if (bootLeather(...pixels.subarray(i, i + 4)))
      for (let c = 0; c < 3; c++) colors[c].push(pixels[i + c]);
  if (colors[0].length < 100) throw Error("Missing leather colour samples");
  return colors.map((values) => values.sort((a, b) => a - b)[Math.floor(values.length / 2)]);
}

/** Adopt the edited leather RGB only; keep the approved bend silhouette and all other paint. */
export async function matchBootPalette(pixels, side) {
  const image = await sharp("assets/source/guild/aria-boot-colors-v6.png")
    .extract({ left: side * 512, top: 512, width: 512, height: 512 })
    .raw()
    .toBuffer();
  const reference = await sharp(
    `assets/source/guild/aria-master-v5-parts/${side ? "near" : "far"}-leg.png`,
  )
    .raw()
    .toBuffer();
  const target = leatherMedian(reference);
  for (let p = 0; p < pixels.length; p += 4)
    if (bootLeather(...pixels.subarray(p, p + 4)) && bootLeather(...image.subarray(p, p + 4)))
      image.copy(pixels, p, p, p + 3);
  const current = leatherMedian(pixels),
    delta = target.map((v, i) => v - current[i]);
  for (let p = 0; p < pixels.length; p += 4)
    if (bootLeather(...pixels.subarray(p, p + 4)))
      for (let c = 0; c < 3; c++)
        pixels[p + c] = Math.max(0, Math.min(255, pixels[p + c] + delta[c]));
  return { target, before: current, delta, measured: leatherMedian(pixels) };
}
