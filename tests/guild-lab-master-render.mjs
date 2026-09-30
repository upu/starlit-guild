import sharp from "sharp";
import { labCharacters } from "../lib/guild-lab-characters.ts";
import { labLimbArtwork } from "../lib/guild-lab-limbs.ts";
import { labIdleArm, labWalkingArm } from "../lib/guild-lab-arms.ts";
import { labJoint, labLegTarget, labPose } from "../lib/guild-lab-model.ts";

const rotate = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
// CPU reference of Phaser's hierarchy, using the delivered atlas and actual rig.
export async function renderMasterPose(
  mode = "idle",
  time = 0,
  skirtPose = { rotation: 0, width: 1, height: 1 },
) {
  const { art, rig } = labCharacters.aria,
    master = art.master;
  const { width, height } = await sharp(master.image).metadata();
  const layers = [];
  const drawing = (cfg, rotation = 0) => {
    const frame = cfg.frame ?? 0,
      [, , w, h] = art.frames[frame];
    layers.push({
      frame,
      layer: cfg.layer,
      point: (x, y) => {
        const [dx, dy] = rotate(
          ((x - w * (cfg.originX ?? 0.5)) * cfg.height) / h,
          ((y - h * (cfg.originY ?? 0.5)) * cfg.height) / h,
          rotation,
        );
        return [cfg.x + dx, cfg.y + dy];
      },
    });
  };
  drawing(rig.torso);
  drawing(rig.scarf);
  drawing(rig.cape);
  drawing({ ...rig.head, height: art.head.displayHeight, originY: 1 });
  for (const hair of rig.hairLocks) drawing(hair);
  const [, , sw, sh] = art.frames[rig.skirt.frame],
    s = rig.skirt.height / sh;
  layers.push({
    frame: rig.skirt.frame,
    layer: rig.skirt.layer,
    point: (x, y) => {
      const [dx, dy] = rotate(
        (x - sw * rig.skirt.originX) * s * skirtPose.width,
        (y - sh * rig.skirt.originY) * s * skirtPose.height,
        skirtPose.rotation,
      );
      return [rig.skirt.x + dx, rig.skirt.y + dy];
    },
  });
  const pose = labPose(time, mode, false, 1, 0, rig, art);
  for (const [limbs, arms] of [
    [rig.legs, false],
    [rig.arms, true],
  ])
    for (const [i, limb] of limbs.entries()) {
      const a = arms
        ? mode === "walk"
          ? labWalkingArm(time, i, false, rig)
          : labIdleArm(i, rig)
        : labJoint(
            labLegTarget(time, i / 2, mode, pose.bob, rig),
            ...limb.lengths,
            mode === "idle" ? limb.idleBend : limb.bend,
          );
      for (const segment of [0, 1]) {
        const frame = limb.frames[segment],
          [, , w, h] = art.frames[frame],
          d = labLimbArtwork(frame, limb.lengths[segment], art);
        const [ex, ey] = segment ? rotate(0, limb.lengths[0], a.upper) : [0, 0];
        const order = limb.front === "upper" ? (segment ? 0 : 1) : segment;
        layers.push({
          frame,
          layer:
            arms && i === 1 && segment === 1 ? rig.cup.restingHandLayer : limb.layer + order * 0.01,
          point: (x, y) => {
            const [px, py] = rotate(
              (x - w * d.originX) * d.scale,
              (y - h * d.originY) * d.scale,
              d.rotation + a.upper + (segment ? a.lower : 0),
            );
            return [limb.joint.x + ex + px, limb.joint.y + ey + py];
          },
        });
      }
    }
  const pixels = Buffer.alloc(width * height * 4),
    owner = new Int16Array(width * height).fill(-1),
    counts = {};
  for (const layer of layers.sort((a, b) => a.layer - b.layer)) {
    const [left, top, w, h] = art.frames[layer.frame];
    const data = await sharp(`public${art.asset}`)
      .extract({ left, top, width: w, height: h })
      .raw()
      .toBuffer();
    counts[layer.frame] = 0;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const p = (y * w + x) * 4,
          a = data[p + 3];
        if (a < 180) continue;
        const world = layer.point(x, y),
          xx = Math.round(world[0] / master.scale + master.origin[0]),
          yy = Math.round(world[1] / master.scale + master.origin[1]);
        if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
        const q = (yy * width + xx) * 4;
        data.copy(pixels, q, p, p + 4);
        owner[yy * width + xx] = layer.frame;
        counts[layer.frame]++;
      }
  }
  return { pixels, owner, counts, width, height, layers };
}
