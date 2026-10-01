import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { inPolygon } from "./guild-lab-master-layers.mjs";
import { completedPaint } from "./guild-lab-completed-paint.mjs";
import { leonMaterialOwner, roundedLimb } from "./guild-lab-leon-ownership.mjs";

export async function cutLeonMaster(config) {
  const { data: master, info } = await sharp(config.image)
      .raw()
      .toBuffer({ resolveWithObject: true }),
    { width, height } = info;
  const owner = new Int16Array(width * height).fill(-1);
  const depths = config.parts
    .map((p, i) => ({ ...p, frame: i }))
    .sort((a, b) => (a.sourceLayer ?? a.layer) - (b.sourceLayer ?? b.layer));
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      if (master[p * 4 + 3] < 180) {
        master[p * 4 + 3] = 0;
        continue;
      }
      master[p * 4 + 3] = 255;
      for (const part of depths)
        if (inPolygon(x + 0.5, y + 0.5, part.polygon)) owner[p] = part.frame;
    }
  const queue = [];
  for (let p = 0; p < owner.length; p++) if (owner[p] >= 0) queue.push(p);
  for (let i = 0; i < queue.length; i++)
    for (const n of [queue[i] - 1, queue[i] + 1, queue[i] - width, queue[i] + width])
      if (n >= 0 && n < owner.length && owner[n] < 0 && master[n * 4 + 3]) {
        owner[n] = owner[queue[i]];
        queue.push(n);
      }
  for (let y = 1035; y < 1115; y++)
    for (let x = 449; x < 580; x++) {
      const p = y * width + x,
        q = p * 4,
        [r, g, b] = master.subarray(q, q + 3);
      if (owner[p] === 10 && r > 165 && g > 150 && b > 120) owner[p] = 2;
    }
  // Cuff folds outside the annotated boot polygon remain leather, never trouser paint.
  for (let y = 1200; y < 1350; y++)
    for (let x = 300; x < 740; x++) {
      const p = y * width + x,
        q = p * 4,
        [r, g, b] = master.subarray(q, q + 3);
      if ([8, 10].includes(owner[p]) && r > g * 1.23 && g > b * 1.18) owner[p] = x < 550 ? 11 : 9;
    }
  mkdirSync(config.directory, { recursive: true });
  for (let p = 0; p < owner.length; p++)
    if (owner[p] >= 0)
      owner[p] = leonMaterialOwner(
        owner[p],
        p % width,
        Math.floor(p / width),
        master.subarray(p * 4, p * 4 + 3),
      );
  for (let p = 0; p < owner.length; p++) {
    const x = p % width,
      y = Math.floor(p / width),
      f = owner[p];
    if (f === 4 && y < 785) owner[p] = 2;
    if ([5, 7].includes(f) && !inPolygon(x, y, config.materialSeams.forearms[f === 7 ? 1 : 0]))
      owner[p] = y < 966 ? (f === 7 ? 6 : 4) : y > 1130 ? (f === 7 ? 10 : 8) : 2;
    if (f === 1 && !inPolygon(x, y, config.materialSeams.frontCape))
      owner[p] = y < 660 ? 0 : x < 480 ? 6 : 2;
    if (f === 6 && !inPolygon(x, y, config.materialSeams.nearUpper)) owner[p] = x < 340 ? 3 : 2;
    if (owner[p] >= 0)
      owner[p] = leonMaterialOwner(owner[p], x, y, master.subarray(p * 4, p * 4 + 3));
  }
  const parts = [];
  for (const [frame, part] of config.parts.entries()) {
    const complete = await completedPaint(config, part.name),
      pixels = Buffer.alloc(master.length);
    let visible = 0,
      added = 0;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const p = y * width + x,
          q = p * 4;
        const closedBacking =
          ([8, 10].includes(frame) && y < 1115) ||
          (frame === 6 && y > 935) ||
          (frame === 4 && y > 946);
        if ([8, 10].includes(frame) && y > part.joints[1][1]) {
          const [kx, ky] = part.joints[1],
            radius = frame === 10 ? 73 : 65;
          if (((x - kx) / radius) ** 2 + ((y - ky) / 12) ** 2 > 1) continue;
        }
        if (owner[p] === frame && !closedBacking) {
          master.copy(pixels, q, q, q + 4);
          visible++;
          continue;
        }
        if (
          !complete ||
          !master[q + 3] ||
          (!inPolygon(x, y, complete.polygon) && ![4, 6, 8, 10].includes(frame)) ||
          owner[p] < 0
        )
          continue;
        if (config.parts[owner[p]].layer < part.layer) continue;
        const xx = x - complete.rect[0],
          yy = y - complete.rect[1];
        if (xx < 0 || yy < 0 || xx >= complete.rect[2] || yy >= complete.rect[3]) continue;
        const u = (yy * complete.rect[2] + xx) * 4;
        if (complete.pixels[u + 3] < 180) continue;
        // Complete backing cells already contain one garment each. Master seam
        // coordinates must not clip their round caps (those seams are occlusions).
        if ([8, 10].includes(frame) && !roundedLimb(x, y, part.joints, frame === 10 ? 73 : 65))
          continue;
        complete.pixels.copy(pixels, q, u, u + 3);
        pixels[q + 3] = 255;
        added++;
      }
    let x0 = width,
      y0 = height,
      x1 = 0,
      y1 = 0;
    // Remove disconnected seam dust. These pixels are not part of a closed
    // painted limb; keeping them would make little coat/outline fragments travel.
    const seen = new Uint8Array(width * height),
      components = [];
    for (let p = 0; p < seen.length; p++) {
      if (seen[p] || !pixels[p * 4 + 3]) continue;
      const group = [p];
      seen[p] = 1;
      for (let k = 0; k < group.length; k++) {
        const at = group[k],
          xx = at % width,
          yy = Math.floor(at / width);
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const nx = xx + dx,
              ny = yy + dy,
              n = ny * width + nx;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height || seen[n] || !pixels[n * 4 + 3])
              continue;
            seen[n] = 1;
            group.push(n);
          }
      }
      components.push(group);
    }
    const largest = Math.max(...components.map((g) => g.length));
    for (const group of components) {
      const collar =
        frame === 2 && group.every((p) => Math.floor(p / width) < 760 && p % width > 480);
      if (frame !== 0 && !collar && group.length < largest * 0.02)
        for (const p of group) pixels[p * 4 + 3] = 0;
    }
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        if (pixels[(y * width + x) * 4 + 3]) {
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x);
          y0 = Math.min(y0, y);
          y1 = Math.max(y1, y);
        }
    const rect = [x0 - 8, y0 - 8, x1 - x0 + 17, y1 - y0 + 17];
    const image = await sharp(pixels, { raw: { width, height, channels: 4 } })
      .extract({ left: rect[0], top: rect[1], width: rect[2], height: rect[3] })
      .png()
      .toBuffer();
    writeFileSync(`${config.directory}/${part.name}.png`, image);
    const local = (p) => p.map((v, i) => v - rect[i]);
    parts.push({
      ...part,
      frame,
      rect,
      image,
      visible,
      added,
      localJoints: part.joints
        ? { proximal: local(part.joints[0]), distal: local(part.joints[1]) }
        : null,
    });
  }
  writeFileSync(
    `${config.directory}/measurements.json`,
    JSON.stringify(
      parts.map((p) => {
        const result = { ...p };
        delete result.image;
        return result;
      }),
      null,
      2,
    ) + "\n",
  );
  return { parts, master, width, height, owner };
}
