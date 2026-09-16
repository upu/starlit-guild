type SceneryUse = "thumbnail" | "detail" | "background";
// Keep the destination cards and their playable map on the same illustration.
export function questScenery(
  quest?: { id: string; background?: string },
  use: SceneryUse = "background",
) {
  return scenerySource(quest).replace("-background.webp", `-${use}.webp`);
}
function scenerySource(quest?: { id: string; background?: string }) {
  if (quest?.background) return quest.background;
  if (quest?.id === "crystal") return "/scenery/cave-background.webp";
  if (quest?.id === "dragon") return "/scenery/ruins-background.webp";
  return ["pilgrim", "wolf", "royal"].includes(quest?.id || "")
    ? "/scenery/valley-background.webp"
    : "/scenery/forest-background.webp";
}
