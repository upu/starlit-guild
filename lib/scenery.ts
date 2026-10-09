type SceneryUse = "thumbnail" | "background";
// Keep the destination cards and their playable map on the same illustration.
export function questScenery(
  quest?: { id: string; background?: string },
  use: SceneryUse = "background",
) {
  return scenerySource(quest).replace("-background.webp", `-${use}.webp`);
}
function scenerySource(quest?: { id: string; background?: string }) {
  return quest?.background || "/scenery/forest-background.webp";
}
