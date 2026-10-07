import { adventureHeroAsset, adventureHeroIds } from "./adventure-hero-art.ts";
import type { AdventureFrame } from "./adventure-presentation.ts";

// Shared home walk 0–7, idle/blink 8–9, attack 10–13, gather 14–15, hurt 16–17, transport 18–23.
type HeroSheet = {
  asset: string;
  columns: number;
  rows: number;
  ready: boolean;
  frames?: readonly (readonly [number, number, number, number])[];
};
export const heroSheets: Partial<Record<string, HeroSheet>> = Object.fromEntries(
  adventureHeroIds.map((id) => [
    id,
    { asset: adventureHeroAsset(id), columns: 4, rows: 6, ready: true },
  ]),
);

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
  if (hurt) return pose(16 + Math.min(1, Math.floor((now - hurt.at) / 160)));
  const hit = member.hit,
    age = hit ? now - hit.at : Infinity;
  if (hit && hit.kind !== "gather" && age >= 0 && age < 650)
    return pose(10 + Math.min(3, Math.floor(age / 162.5)));
  if (member.walking) return pose(Math.floor(now / 90) % 8);
  // The second idle drawing closes the eyes; keep it a brief blink, not a long nap.
  return pose(now % 3600 >= 3450 ? 9 : 8);
}
