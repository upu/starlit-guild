import { materialColours } from "./guild-lab-material-audit.mjs";

/** Material seams measured on the completed master, not on an atlas cell. */
export function leonMaterialOwner(frame, x, y, rgb) {
  const blue = materialColours.blue(...rgb),
    red =
      rgb[0] > rgb[1] * 1.6 &&
      rgb[0] > rgb[2] * 1.5 &&
      Math.abs(rgb[1] - rgb[2]) < 9 &&
      rgb[0] - Math.max(rgb[1], rgb[2]) > 45;
  if (
    red &&
    y > (frame === 0 ? 648 : 610) &&
    y < 950 &&
    [0, 1, 4, 6].includes(frame) &&
    (frame !== 0 || x > 480)
  )
    return y < 790 && x > 360 ? 1 : 3;
  if (red && frame === 2 && y < 790 && y > 635) return 1;
  if (frame === 0 && y > 635 && blue) return 2;
  if ([5, 7].includes(frame) && blue) return 2;
  if ([4, 6].includes(frame) && blue) {
    // Blue under the shoulder armour belongs to the sleeve; coat panels do not.
    const sleeve = frame === 6 ? y >= 755 && y < 865 && x < 458 : y < 858 && x >= 674;
    if (!sleeve) return 2;
  }
  if (frame === 1 && !red) {
    if (blue) return x < 470 && y > 750 ? 6 : 2;
    if (x < 505 && y > 675) return 6; // silver shoulder armour
    if (x > 685 && y > 756) return 4;
    if (x >= 505 && y < 720 && rgb[0] > 160 && rgb[1] > 145 && rgb[2] > 120) return 2;
  }
  if (
    frame === 2 &&
    x < 502 &&
    y > 700 &&
    y < 790 &&
    Math.max(...rgb) - Math.min(...rgb) < 35 &&
    rgb[0] > 90
  )
    return 6;
  if (frame === 0 && y > 635 && x < 480 && rgb[0] > 150 && rgb[1] > 135 && rgb[2] > 110) return 6;
  if (frame === 10 && x > 465 && y < 1115 && y < 1075 + (x - 465) * 0.39) return 2;
  if (frame === 10 && x < 410 && y < 1160) return 3;
  if (frame === 10 && x > 550 && y < 1190) return 2;
  if (frame === 8 && x > 677 && y < 1180) return 2;
  if ([9, 11].includes(frame) && y < 1242) return frame === 11 ? 10 : 8;
  // The coat's ivory piping bordering a glove is cloth, not leather.
  if (frame === 7 && x > 450 && y > 959 && rgb[0] > 150 && rgb[1] > 135 && rgb[2] > 110) return 2;
  if (frame === 5 && x < 705 && y > 980 && rgb[0] > 150 && rgb[1] > 135 && rgb[2] > 110) return 2;
  return frame;
}

export function roundedLimb(x, y, joints, radius) {
  const [a, b] = joints,
    dx = b[0] - a[0],
    dy = b[1] - a[1],
    len = Math.hypot(dx, dy);
  const t = ((x - a[0]) * dx + (y - a[1]) * dy) / (len * len);
  const k = Math.max(0, Math.min(1, t));
  return Math.hypot(x - a[0] - dx * k, y - a[1] - dy * k) <= radius;
}
