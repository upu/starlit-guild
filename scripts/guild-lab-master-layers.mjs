import sharp from "sharp";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fitPadded } from "./guild-lab-image-tools.mjs";
import { completedPaint } from "./guild-lab-completed-paint.mjs";
import { sealPaintCavities } from "./guild-lab-coverage.mjs";
import { bareSkin } from "./guild-lab-materials.mjs";

export const inPolygon = (x, y, polygon) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0])
      inside = !inside;
  }
  return inside;
};
/** Ownership masks partition the finished painting. Only occluded paint is added. */
export async function cutMaster(config) {
  const { data: master, info } = await sharp(config.image)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const owner = new Int16Array(width * height).fill(-1);
  const byDepth = config.parts
    .map((part, frame) => ({ ...part, frame }))
    .sort((a, b) => (a.sourceLayer ?? a.layer) - (b.sourceLayer ?? b.layer));
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      if (master[p * 4 + 3] < 16) {
        master[p * 4 + 3] = 0;
        continue;
      }
      if (master[p * 4 + 3] >= 245) master[p * 4 + 3] = 255;
      owner[p] = -2;
      for (const part of byDepth)
        if (inPolygon(x + 0.5, y + 0.5, part.polygon)) owner[p] = part.frame;
    }
  // Grow reviewed ownership masks only into the still-unassigned painted pixels.
  // This follows thin hair outlines without leaving scraps on the torso layer.
  const queue = [];
  for (let p = 0; p < owner.length; p++)
    if (owner[p] >= 0 && [p - 1, p + 1, p - width, p + width].some((n) => owner[n] === -2))
      queue.push(p);
  for (let i = 0; i < queue.length; i++)
    for (const n of [queue[i] - 1, queue[i] + 1, queue[i] - width, queue[i] + width])
      if (n >= 0 && n < owner.length && owner[n] === -2) {
        owner[n] = owner[queue[i]];
        queue.push(n);
      }
  if (owner.includes(-2)) throw Error("Unassigned disconnected painted component in master");
  // Garment gold must not move with bare thighs or the white upper sleeves.
  for (let p = 0; p < owner.length; p++) {
    const q = p * 4,
      x = p % width,
      y = Math.floor(p / width);
    const gold = master[q] > master[q + 1] && master[q + 1] - master[q + 2] > 40;
    const green = master[q + 1] > master[q] && master[q + 1] - master[q + 2] > 20;
    if ([4, 6].includes(owner[p]) && gold) owner[p] = x > 780 ? 14 : x < 550 ? 12 : 15;
    // The cut silhouette includes cloak folds beside the sleeve. They must stay
    // with the cloak rather than travel backwards with the moving arm.
    if (
      [4, 6].includes(owner[p]) &&
      master[q] < 150 &&
      master[q + 1] >= master[q] - 5 &&
      master[q + 1] - master[q + 2] > 15
    )
      owner[p] = y < 780 ? 1 : 3;
    if ([8, 10].includes(owner[p])) {
      const knee = config.parts[owner[p]].joints[1];
      const skin =
        master[q] > 150 &&
        master[q] - master[q + 1] > 15 &&
        master[q + 1] > 95 &&
        master[q + 2] > 70;
      if (y > knee[1] - 32 && !skin) {
        const white = master[q] > 170 && master[q + 1] > 160 && master[q + 2] > 130;
        owner[p] = white ? 13 : owner[p] + 1;
      } else if (gold || green) owner[p] = 13;
    }
    if (owner[p] === 3 && !(x >= 343 && x <= 530 && y >= 790 && y <= 1065))
      owner[p] = x < 350 && y > 900 ? 12 : x < 490 && y < 790 ? 1 : y > 870 ? 13 : 2;
    if (owner[p] === 3 && y < 790 && gold) owner[p] = x < 500 ? 12 : 15;
    const [armX, armY, armW, armH] = config.nearArmColorCleanup.bounds;
    if (
      owner[p] === 3 &&
      x >= armX &&
      x < armX + armW &&
      y >= armY &&
      y < armY + armH &&
      master[q] < 175 &&
      master[q] > master[q + 1] * 1.12 &&
      master[q + 1] > master[q + 2] + 8
    )
      owner[p] = y < config.nearArmColorCleanup.cuffY ? 6 : 7;
    if (
      [5, 7, 9, 11].includes(owner[p]) &&
      master[q + 1] >= master[q] * 0.98 &&
      master[q + 1] - master[q + 2] > 20 &&
      master[q] < 150
    )
      owner[p] = 3;
  }
  for (let p = 0; p < owner.length; p++) {
    const x = p % width,
      y = Math.floor(p / width);
    // Exposed thighs below the reviewed frill, not pink cloth shadows.
    const thigh = (x > 550 && x < 687 && y > 997) || (x > 692 && x < 783 && y > 1013);
    if (owner[p] === 13 && thigh && bareSkin(...master.subarray(p * 4, p * 4 + 4)))
      owner[p] = x < 690 ? 10 : 8;
  }
  const under = await sharp(config.underpaint.image)
    .resize(width, height)
    .ensureAlpha()
    .raw()
    .toBuffer();
  const dir = config.directory;
  mkdirSync(dir, { recursive: true });
  const parts = [];
  for (const [frame, part] of config.parts.entries()) {
    const complete = await completedPaint(config, part.name);
    const pixels = Buffer.alloc(master.length),
      fills = Buffer.alloc(master.length);
    const croppedFill = part.fillCrop
      ? await sharp(part.fillImage)
          .extract({
            left: part.fillCrop[0],
            top: part.fillCrop[1],
            width: part.fillCrop[2],
            height: part.fillCrop[3],
          })
          .resize(part.fillRect[2], part.fillRect[3], { fit: "fill" })
          .png()
          .toBuffer()
      : null;
    const filled = part.fillImage
      ? await sharp(
          croppedFill ?? (await fitPadded(part.fillImage, part.fillRect[2], part.fillRect[3])),
        )
          .ensureAlpha()
          .raw()
          .toBuffer()
      : null;
    let visible = 0,
      added = 0;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const p = y * width + x,
          q = p * 4;
        if (owner[p] === frame && !complete) {
          master.copy(pixels, q, q, q + 4);
          visible++;
          continue;
        }
        if (complete && master[q + 3] >= 245 && inPolygon(x, y, complete.polygon)) {
          const [cx, cy, cw, ch] = complete.rect,
            xx = x - cx,
            yy = y - cy;
          if (xx >= 0 && yy >= 0 && xx < cw && yy < ch) {
            const u = (yy * cw + xx) * 4;
            if (complete.pixels[u + 3] >= 180) {
              complete.pixels.copy(pixels, q, u, u + 3);
              pixels[q + 3] = 255;
              if (owner[p] === frame) visible++;
              else {
                pixels.copy(fills, q, q, q + 4);
                added++;
              }
              continue;
            }
          }
        }
        if (owner[p] === frame) {
          master.copy(pixels, q, q, q + 4);
          visible++;
          continue;
        }
        const sameLayer = config.parts[owner[p]]?.layer === part.layer;
        const sameJoint = part.name.includes("forearm") && sameLayer;
        if (
          owner[p] < 0 ||
          master[q + 3] < 255 ||
          ((config.parts[owner[p]].sourceLayer ?? config.parts[owner[p]].layer) <=
            (part.sourceLayer ?? part.layer) &&
            !sameJoint &&
            !(part.fillSameLayer && sameLayer))
        )
          continue;
        const fill =
          (part.fill ?? []).some(
            ([cx, cy, rx, ry]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1,
          ) ||
          (part.fillPolygon && inPolygon(x, y, part.fillPolygon));
        if (!fill) continue;
        if (sameJoint) {
          master.copy(pixels, q, q, q + 4);
          continue;
        }
        if (filled) {
          const [fx, fy, fw, fh] = part.fillRect,
            xx = x - fx,
            yy = y - fy;
          if (xx >= 0 && yy >= 0 && xx < fw && yy < fh) {
            const u = (yy * fw + xx) * 4;
            if (filled[u + 3] > 180) {
              filled.copy(pixels, q, u, u + 3);
              pixels[q + 3] = 255;
              pixels.copy(fills, q, q, q + 4);
              added++;
              continue;
            }
          }
        }
        if (part.name.includes("hair")) {
          master.copy(pixels, q, q, q + 4);
          continue;
        }
        if (part.fillSample) {
          const s = (part.fillSample[1] * width + part.fillSample[0]) * 4;
          master.copy(pixels, q, s, s + 3);
          pixels[q + 3] = 255;
          pixels.copy(fills, q, q, q + 4);
          added++;
          continue;
        }
        // Registration of the underpaint uses the reviewed waist/boot landmarks.
        const [sx, sy, tx, ty] = config.underpaint.transform;
        const ux = Math.round((x - tx) / sx),
          uy = Math.round((y - ty) / sy);
        const u = (uy * width + ux) * 4;
        if (ux < 0 || uy < 0 || ux >= width || uy >= height || under[u + 3] < 250) continue;
        under.copy(pixels, q, u, u + 3);
        pixels[q + 3] = 255;
        pixels.copy(fills, q, q, q + 4);
        added++;
      }
    const sealedPixels = complete ? sealPaintCavities(pixels, width, height) : 0;
    let left = width,
      top = height,
      right = 0,
      bottom = 0;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        if (pixels[(y * width + x) * 4 + 3]) {
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
    if (!visible) throw Error(`Missing master part ${part.name}`);
    const rect = [left - 8, top - 8, right - left + 17, bottom - top + 17];
    if (rect[0] < 0 || rect[1] < 0 || right + 8 >= width || bottom + 8 >= height)
      throw Error(`Paint touches master edge: ${part.name} ${rect}`);
    const image = await sharp(pixels, { raw: { width, height, channels: 4 } })
      .extract({ left: rect[0], top: rect[1], width: rect[2], height: rect[3] })
      .png()
      .toBuffer();
    writeFileSync(`${dir}/${part.name}.png`, image);
    await sharp(fills, { raw: { width, height, channels: 4 } })
      .extract({ left: rect[0], top: rect[1], width: rect[2], height: rect[3] })
      .png()
      .toFile(`${dir}/${part.name}-underpaint.png`);
    const local = (point) => point.map((v, i) => v - rect[i]);
    parts.push({
      ...part,
      frame,
      rect,
      image,
      visible,
      added,
      sealedPixels,
      localJoints: part.joints
        ? { proximal: local(part.joints[0]), distal: local(part.joints[1]) }
        : null,
    });
  }
  writeFileSync(
    `${dir}/measurements.json`,
    JSON.stringify(
      parts.map((part) => {
        const measurement = { ...part };
        delete measurement.image;
        return measurement;
      }),
      null,
      2,
    ) + "\n",
  );
  return { parts, master, width, height, owner };
}
export const readMasterConfig = () =>
  JSON.parse(readFileSync("assets/source/guild/aria-master-v5.json", "utf8"));
