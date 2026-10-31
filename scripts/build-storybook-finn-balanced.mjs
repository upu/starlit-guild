import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

// Keep one scale per sheet: crouching and seated poses must remain lower.
const atlases = [
  ["conversation-balanced-v3", 1, 192],
  ["walk-balanced-v2", 1, 192],
  ["walk-balanced-v3", 1, 192],
  ["night-walk-balanced-v2", 1, 192],
  ["night-push-balanced-v4", 2, 192],
  ["night-battle-balanced-v2", 1, 256],
  ["handheld-balanced-v2", 2, 192],
  ["battle-balanced-v2", 1, 256],
  ["pull-balanced-v3", 1, 192],
  ["earthwork-balanced-v2", 1, 192],
  ["seat-balanced-v3", 1, 192],
  ["drinks-balanced-v2", 1, 192],
  ["sit-down-balanced-v2", 1, 192],
  ["paper-seat-balanced-v2", 1, 192],
  ["chair-balanced-v3", 2, 192],
  ["tray-balanced-v2", 2, 192],
  ["door-balanced-v2", 1, 192],
  ["cloth-balanced-v2", 2, 192],
  ["push-balanced-v2", 2, 192],
  ["pull-scene-balanced-v2", 1, 192],
  ["pull-scene-balanced-v3", 1, 192],
  ["pat-balanced-v2", 1, 192, 2],
  ["injury-balanced-v2", 2, 192],
  ["ground-rest-balanced-v2", 1, 192, 3],
  ["gloves-balanced-v2", 2, 192],
  ["reaction-balanced-v2", 1, 192],
];
for (const [name, rows, cell, columns = 4] of atlases) {
  if (process.argv[2] && process.argv[2] !== name) continue;
  const source = `assets/source/storybook/finn-${name}.png`;
  const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(raw.data, raw.info.width, raw.info.height, {
    count: columns * rows,
    columns,
    rows,
  });
  if (parts.length !== columns * rows) throw Error(`Incomplete Finn atlas: ${name}`);
  const scale = 148 / parts[0].height;
  const layers = [],
    metrics = [];
  let standingHead;
  for (const [frame, p] of parts.entries()) {
    function center(start, end) {
      let sum = 0,
        count = 0;
      for (
        let y = p.top + Math.floor(p.height * start);
        y < p.top + Math.floor(p.height * end);
        y++
      )
        for (let x = p.left; x < p.left + p.width; x++)
          if (raw.data[(y * raw.info.width + x) * 4 + 3] > 128) {
            sum += x;
            count++;
          }
      if (!count) throw Error(`Missing anchor: ${name}/${frame}`);
      return sum / count;
    }
    const head = center(0, 0.3),
      foot = center(0.9, 1);
    // The generated carrying walk is a separate row with a slightly larger source drawing.
    const frameScale = name.startsWith("handheld") && frame >= 4 ? 148 / parts[4].height : scale;
    const width = Math.round(p.width * frameScale),
      height = Math.round(p.height * frameScale);
    const walkHead =
      name === "walk-balanced-v3" || name === "pull-scene-balanced-v3"
        ? 95
        : ["night-walk-balanced-v2", "night-battle-balanced-v2"].includes(name)
          ? 96
          : name === "night-push-balanced-v4" && frame >= 1 && frame <= 5
            ? 100
            : undefined;
    const alignHead = name.startsWith("handheld") && frame >= 4;
    const left = Math.round(
      walkHead !== undefined
        ? walkHead - (head - p.left) * frameScale
        : alignHead
          ? standingHead - (head - p.left) * frameScale
          : 96 - (foot - p.left) * frameScale,
    );
    const top = 176 - height;
    if (left < 3 || left + width > cell - 3 || top < 4)
      throw Error(`Clipped Finn: ${name}/${frame}`);
    if (frame === 0) standingHead = left + (head - p.left) * scale;
    layers.push({
      input: await sharp(source).extract(p).resize(width, height).png().toBuffer(),
      left: (frame % columns) * cell + left,
      top: Math.floor(frame / columns) * 192 + top,
    });
    metrics.push({
      frame,
      source,
      scale: frameScale,
      left,
      top,
      width,
      height,
      baseline: 176,
      headX: left + (head - p.left) * frameScale,
    });
  }
  await sharp({
    create: { width: cell * columns, height: rows * 192, channels: 4, background: "#00000000" },
  })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/finn-${name}.webp`);
  await writeFile(
    `public/storybook-study/finn-${name}-metrics.json`,
    JSON.stringify(metrics, null, 2) + "\n",
  );
  console.log(
    name,
    metrics.map(({ height }) => height),
  );
}
