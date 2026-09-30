import sharp from "sharp";
import { labCharacters } from "../lib/guild-lab-characters.ts";
import { labLimbArtwork } from "../lib/guild-lab-limbs.ts";
import { labIdleArm, labWalkingArm } from "../lib/guild-lab-arms.ts";
import { labJoint, labLegTarget, labPose, labUpperPoint } from "../lib/guild-lab-model.ts";

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
  const pose = labPose(time, mode, false, 1, 0, rig, art);
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
        const point = labUpperPoint({ x: cfg.x + dx, y: cfg.y + dy }, pose.lean, rig);
        return [point.x, point.y];
      },
    });
  };
  drawing(rig.torso);
  drawing(rig.scarf);
  drawing(rig.cape, mode === "walk" ? pose.cape : 0);
  drawing(
    { ...rig.head, height: art.head.displayHeight, originY: 1 },
    mode === "walk" ? pose.head : 0,
  );
  for (const hair of rig.hairLocks)
    drawing(hair, mode === "walk" ? Math.sin(time / 640 + hair.phase) * hair.sway : 0);
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
      const point = labUpperPoint({ x: rig.skirt.x + dx, y: rig.skirt.y + dy }, pose.lean, rig);
      return [point.x, point.y];
    },
  });
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
            const point = { x: limb.joint.x + ex + px, y: limb.joint.y + ey + py };
            const world = arms ? labUpperPoint(point, pose.lean, rig) : point;
            return [world.x, world.y];
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
    layer.data = data;
    layer.width = w;
    layer.height = h;
    const origin = layer.point(0, 0),
      xx = layer.point(1, 0),
      yy = layer.point(0, 1);
    const ax = (xx[0] - origin[0]) / master.scale,
      ay = (xx[1] - origin[1]) / master.scale,
      bx = (yy[0] - origin[0]) / master.scale,
      by = (yy[1] - origin[1]) / master.scale;
    const ox = origin[0] / master.scale + master.origin[0],
      oy = origin[1] / master.scale + master.origin[1],
      det = ax * by - ay * bx;
    const corners = [
      [0, 0],
      [w, 0],
      [0, h],
      [w, h],
    ].map(([x, y]) => [ox + x * ax + y * bx, oy + x * ay + y * by]);
    const minX = Math.max(0, Math.floor(Math.min(...corners.map((p) => p[0])))),
      maxX = Math.min(width, Math.ceil(Math.max(...corners.map((p) => p[0]))));
    const minY = Math.max(0, Math.floor(Math.min(...corners.map((p) => p[1])))),
      maxY = Math.min(height, Math.ceil(Math.max(...corners.map((p) => p[1]))));
    layer.sample = (world) => {
      const dx = world.x / master.scale + master.origin[0] - ox,
        dy = world.y / master.scale + master.origin[1] - oy;
      const x = Math.round((dx * by - dy * bx) / det),
        y = Math.round((dy * ax - dx * ay) / det);
      return x < 0 || y < 0 || x >= w || y >= h
        ? [0, 0, 0, 0]
        : [...data.subarray((y * w + x) * 4, (y * w + x) * 4 + 4)];
    };
    counts[layer.frame] = 0;
    for (let y = minY; y < maxY; y++)
      for (let x = minX; x < maxX; x++) {
        const dx = x - ox,
          dy = y - oy,
          sx = Math.round((dx * by - dy * bx) / det),
          sy = Math.round((dy * ax - dx * ay) / det);
        if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
        const p = (sy * w + sx) * 4;
        if (data[p + 3] < 180) continue;
        const q = (y * width + x) * 4;
        data.copy(pixels, q, p, p + 4);
        owner[y * width + x] = layer.frame;
        counts[layer.frame]++;
      }
  }
  return { pixels, owner, counts, width, height, layers };
}
