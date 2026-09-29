import {
  finnFrames,
  miraFrames,
  roadFrame,
  roadSheet,
  packingFrames,
  roadWalkSheet,
  walkBounds,
  licoMotionFrames,
} from "./phaser/road-art";
import type { TravellerId } from "@/lib/road-view";

const ids: readonly string[] = ["aria", "leon", "mira", "finn", "lico"];
export function isGuildFigure(id: string): id is TravellerId {
  return ids.includes(id);
}
function walkPose(id: TravellerId, step: number) {
  if (id === "lico")
    return { asset: roadWalkSheet(id), rect: licoMotionFrames[step], width: 1225, height: 1284 };
  if (id === "finn")
    return { asset: roadWalkSheet(id), rect: finnFrames[step], width: 1254, height: 1254 };
  const [left, top, right, bottom] = walkBounds[id][step];
  return {
    asset: roadWalkSheet(id),
    rect: [step * 627 + left, top, right - left, bottom - top],
    width: 1254,
    height: 1254,
  };
}
function pose(id: TravellerId, working: boolean, step: number, walking: boolean) {
  if (walking) return walkPose(id, step);
  if (working && id !== "lico" && id !== "finn")
    return {
      asset: "/animations/road/packing-v1.webp",
      rect: packingFrames[id][step],
      width: 1295,
      height: 1214,
    };
  if (id === "lico")
    return { asset: roadSheet(id), rect: [0, 0, 339, 512], width: 339, height: 512 };
  if (id === "finn" || id === "mira")
    return {
      asset: roadSheet(id),
      rect: (id === "finn" ? finnFrames : miraFrames)[working ? 14 + step : 8],
      width: 1254,
      height: 1254,
    };
  const frame = roadFrame(id, 8);
  return {
    asset: roadSheet(id),
    rect: [frame.left, frame.top, frame.width, frame.height],
    width: 1448,
    height: 1086,
  };
}
/** Reuse the adventure atlas and its crop bounds; keep simulation out of the illustration. */
export function GuildFigure({
  id,
  working = false,
  facing = false,
  walking = false,
}: {
  id: TravellerId;
  working?: boolean;
  facing?: boolean;
  walking?: boolean;
}) {
  return (
    <span
      className={`guild-figure${working ? " is-working" : ""}${facing ? " faces-left" : ""}${walking ? " is-walking" : ""}`}
      aria-hidden="true"
      data-hero={id}
    >
      {[0, 1].map((step) => {
        const frame = pose(id, working, step, walking);
        return (
          <svg
            key={step}
            className={`guild-pose guild-pose-${String(step)}`}
            viewBox={frame.rect.join(" ")}
          >
            <image href={frame.asset} width={frame.width} height={frame.height} />
          </svg>
        );
      })}
    </span>
  );
}
