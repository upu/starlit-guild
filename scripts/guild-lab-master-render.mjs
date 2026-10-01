import sharp from "sharp";
import { labSingleLeg } from "../lib/guild-lab-single-legs.ts";
import { labCharacters } from "../lib/guild-lab-characters.ts";
import { labLimbArtwork } from "../lib/guild-lab-limbs.ts";
import { LabArmMotion } from "../lib/guild-lab-arms.ts";
import {
  labJoint,
  labHip,
  labLegTarget,
  labPose,
  labTeaCup,
  labUpperPoint,
} from "../lib/guild-lab-model.ts";
import { labBentArm } from "../lib/guild-lab-bent-arms.ts";
import { leonLabStance } from "../lib/guild-lab-leon-stance.ts";
import { labAnkle } from "../lib/guild-lab-ankles.ts";

const frameCache = new Map();
const rotate = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
// CPU reference of Phaser's hierarchy, using the delivered atlas and actual rig.
export async function renderMasterPose(
  mode = "idle",
  time = 0,
  skirtPose = { rotation: 0, width: 1, height: 1 },
  options = {},
) {
  const { art, rig } = labCharacters[options.character ?? "aria"],
    master = art.master ?? leonLabStance;
  const { width, height } = "width" in master ? master : await sharp(master.image).metadata();
  const pose = labPose(
    time,
    mode,
    false,
    1,
    0,
    rig,
    art,
    options.animate && options.character !== "leon" && mode === "tea" ? 1200 : 0,
  );
  const feeling = { look: 0, jump: 0, squash: 0, stretch: 0, ...options.feeling };
  pose.head += feeling.look;
  const cup = labTeaCup(pose.sip, pose.head, rig, art);
  if (mode === "tea") pose.hand = cup.hand;
  const layers = [];
  const shoe = (i, ankle) => {
    const cfg = rig.feet[i],
      [, , w, h] = art.frames[cfg.frame],
      s = cfg.height / h;
    const rotation = labAnkle(time, i, mode).angle - (mode === "walk" ? cfg.paintedSlope : 0);
    layers.push({
      frame: cfg.frame,
      layer: cfg.layer,
      point: (x, y) => {
        const [dx, dy] = rotate((x - w * cfg.originX) * s, (y - h * cfg.originY) * s, rotation);
        return [ankle[0] + dx, ankle[1] + dy];
      },
    });
  };
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
  drawing(rig.cape, mode === "walk" || options.animate ? pose.cape : 0);
  drawing(
    { ...rig.head, height: art.head.displayHeight, originY: 1 },
    mode === "walk" || options.animate ? pose.head : 0,
  );
  for (const hair of rig.hairLocks ?? [])
    drawing(
      hair,
      mode === "walk" || options.animate ? Math.sin(time / 640 + hair.phase) * hair.sway : 0,
    );
  if (rig.skirt) {
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
    drawing(rig.skirtBack, skirtPose.rotation);
  }
  for (const [limbs, arms] of [
    [rig.legs, false],
    [rig.arms, true],
  ])
    for (const [i, limb] of limbs.entries()) {
      const joint = arms ? limb.joint : labHip(i, mode, rig);
      if (!arms && rig.legStyle === "single" && mode !== "tea") {
        const cfg = rig.singleLegs[i],
          leg = labSingleLeg(time, i, mode, pose.bob, false, rig),
          frame = leg.bent ? cfg.bentFrame : cfg.frame,
          d = labLimbArtwork(frame, cfg.length, art),
          [, , w, h] = art.frames[frame];
        layers.push({
          frame,
          layer: cfg.layer,
          point: (x, y) => {
            const [sx, sy] = rotate(
              (x - w * d.originX) * d.scale,
              (y - h * d.originY) * d.scale,
              d.rotation,
            );
            const [dx, dy] = rotate(sx, sy * leg.scaleY, leg.rotation);
            return [cfg.x + dx, cfg.y + leg.lift + dy];
          },
        });
        shoe(i, [
          cfg.x - Math.sin(leg.rotation) * cfg.length * leg.scaleY,
          cfg.y + leg.lift + Math.cos(leg.rotation) * cfg.length * leg.scaleY,
        ]);
        continue;
      }
      const target = i ? pose.hand : pose.farHand;
      const a = arms
        ? new LabArmMotion(rig).sample(
            time,
            mode,
            i,
            target,
            Boolean(feeling.jump || feeling.squash),
            false,
            feeling.stretch,
          )
        : labJoint(
            labLegTarget(time, i / 2, mode, pose.bob, rig),
            ...limb.lengths,
            mode === "idle" ? limb.idleBend : limb.bend,
          );
      const bent = arms ? labBentArm(art, i, a.upper, a.lower, limb.lengths, a.scale ?? 1) : null;
      if (!arms)
        shoe(i, [
          joint.x -
            Math.sin(a.upper) * limb.lengths[0] -
            Math.sin(a.upper + a.lower) * limb.lengths[1],
          joint.y +
            Math.cos(a.upper) * limb.lengths[0] +
            Math.cos(a.upper + a.lower) * limb.lengths[1],
        ]);
      if (bent) {
        const v = bent.variant;
        const scale =
          ((limb.lengths[0] + limb.lengths[1]) * bent.scale) /
          Math.hypot(v.end[0] - v.root[0], v.end[1] - v.root[1]);
        const point = (x, y) => {
          const [dx, dy] = rotate((x - v.root[0]) * scale, (y - v.root[1]) * scale, bent.rotation);
          const world = labUpperPoint(
            { x: limb.joint.x + dx, y: limb.joint.y + dy },
            pose.lean,
            rig,
          );
          return [world.x, world.y];
        };
        layers.push({ frame: v.frame, layer: limb.layer, point });
        if ((i === 1 && mode === "tea") || "forearmLayer" in limb)
          layers.push({
            frame: v.forearmFrame,
            layer: i === 1 && mode === "tea" ? rig.cup.handLayer : limb.forearmLayer,
            point,
          });
        continue;
      }
      for (const segment of [0, 1]) {
        const frame = limb.frames[segment],
          [, , w, h] = art.frames[frame],
          d = labLimbArtwork(frame, limb.lengths[segment], art);
        const [ex, ey] = segment ? rotate(0, limb.lengths[0], a.upper) : [0, 0];
        const order = limb.front === "upper" ? (segment ? 0 : 1) : segment;
        layers.push({
          frame,
          layer:
            arms && segment === 1 && "forearmLayer" in limb
              ? limb.forearmLayer
              : arms && i === 1 && segment === 1
                ? rig.cup.restingHandLayer
                : limb.layer + order * 0.01,
          point: (x, y) => {
            const [px, py] = rotate(
              (x - w * d.originX) * d.scale,
              (y - h * d.originY) * d.scale,
              d.rotation + a.upper + (segment ? a.lower : 0),
            );
            const scale = a.scale ?? 1;
            const point = {
              x: joint.x + (ex + px) * scale,
              y: joint.y + (ey + py) * scale,
            };
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
    const placed = layer.point;
    layer.point = (x, y) => {
      const p = placed(x, y);
      return [
        p[0] * (1 + feeling.squash * 0.06),
        p[1] * (1 - feeling.squash * 0.08 + feeling.stretch * 0.035) + pose.bob - feeling.jump,
      ];
    };
    const [left, top, w, h] = art.frames[layer.frame];
    const cacheKey = art.asset + ":" + layer.frame;
    if (!frameCache.has(cacheKey)) {
      let pixels = await sharp("public" + art.asset)
        .extract({ left, top, width: w, height: h })
        .raw()
        .toBuffer();
      frameCache.set(cacheKey, pixels);
    }
    let data = frameCache.get(cacheKey);

    if (options.tintParts) {
      data = Buffer.from(data);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = (layer.frame * 71 + 60) % 255;
        data[i + 1] = (layer.frame * 113 + 100) % 255;
        data[i + 2] = (layer.frame * 149 + 150) % 255;
      }
    }
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
    layer.sourceAt = (world) => {
      const dx = world.x / master.scale + master.origin[0] - ox,
        dy = world.y / master.scale + master.origin[1] - oy;
      const x = Math.round((dx * by - dy * bx) / det),
        y = Math.round((dy * ax - dx * ay) / det);
      return [x, y];
    };
    layer.sample = (world) => {
      const [x, y] = layer.sourceAt(world);
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
