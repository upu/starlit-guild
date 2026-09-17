import type { AdventureFrame } from "./adventure-presentation.ts";

// Each sheet: walk 0–3, attack 4–7, idle 8–9, hurt 10–11.
type HeroSheet = {
  asset: string;
  columns: number;
  rows: number;
  ready: boolean;
  frames?: readonly (readonly [number, number, number, number])[];
};
export const heroSheets: Partial<Record<string, HeroSheet>> = {
  aria: { asset: "/animations/aria-v1.png", columns: 4, rows: 3, ready: true },
  leon: { asset: "/animations/leon-v1.png", columns: 4, rows: 3, ready: true },
  // Native artwork has irregular gutters. Read each whole pose and anchor its feet,
  // rather than cutting feet and the casting staff at an assumed equal-cell border.
  mira: {
    asset: "/animations/mira-v1.png",
    columns: 4,
    rows: 3,
    ready: true,
    frames: [
      [28, 32, 330, 342],
      [389, 32, 331, 344],
      [751, 32, 331, 342],
      [1114, 32, 328, 344],
      [30, 397, 323, 326],
      [374, 398, 378, 325],
      [746, 408, 394, 315],
      [1125, 396, 317, 328],
      [36, 746, 320, 327],
      [399, 749, 320, 324],
      [750, 755, 312, 318],
      [1120, 751, 319, 322],
    ],
  },
};

export function heroAnimation(
  member: AdventureFrame["members"][number],
  frame: AdventureFrame,
  now: number,
  reduced = false,
) {
  const sheet = heroSheets[member.id];
  if (!sheet) return null;
  const pose = (index: number) => ({ asset: sheet.asset, frame: String(index) });
  if (reduced || frame.phase === "rest") return pose(8);
  const hurt = frame.events
    .filter(
      (e) =>
        e.kind === "hurt" &&
        (e.target === member.id || (!e.target && (!e.hero || e.hero === member.id))) &&
        now >= e.at &&
        now - e.at < 320,
    )
    .at(-1);
  if (hurt) return pose(10 + Math.min(1, Math.floor((now - hurt.at) / 160)));
  const hit = member.hit,
    age = hit ? now - hit.at : Infinity;
  if (hit && hit.kind !== "gather" && age >= 0 && age < 650)
    return pose(4 + Math.min(3, Math.floor(age / 162.5)));
  if (member.walking) return pose(Math.floor(now / 150) % 4);
  // The second idle drawing closes the eyes; keep it a brief blink, not a long nap.
  return pose(now % 3600 >= 3450 ? 9 : 8);
}
