import type { TravellerId } from "./road-view.ts";
import type { WaterwayPose } from "./road-waterway-contacts.ts";

/** Reuse the registered low resting poses, without adding props or changing body scale. */
export function roadInjuryPose(id: TravellerId): WaterwayPose | undefined {
  const poses: Partial<Record<TravellerId, WaterwayPose>> = {
    aria: { asset: "/storybook-study/aria-work-v1.webp", frame: 3 },
    leon: { asset: "/storybook-study/leon-work-v1.webp", frame: 3 },
    mira: { asset: "/storybook-study/mira-handheld-v1.webp", frame: 1, rows: 2 },
    finn: { asset: "/storybook-study/finn-handheld-balanced-v2.webp", frame: 1, rows: 2 },
  };
  return poses[id];
}
export const roadHeroOpacity = (hp: number, painted = false) => (painted || hp > 0 ? 1 : 0.35);
