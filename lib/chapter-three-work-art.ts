// Matches the three jobs in each chapter-three route; transport keeps the shared cart.
const frames: Partial<Record<string, readonly string[]>> = {
  "berne-road": ["cargo", "battle", "signpost"],
  "berne-house-calls": ["cargo", "parcels", "stonework"],
  "missing-keystone": ["stonework", "records", "stonework"],
  "riverside-manor": ["cargo", "cargo", "records"],
  "matching-lantern-stone": ["cargo", "records", "records"],
  "manor-survey": ["cargo", "parcels", "signpost"],
  "garden-reception": ["cargo", "signpost", "parcels"],
  "berne-restoration": ["stonework", "stonework", "stonework"],
};
export const chapterThreeWorkFrame = (quest: string, node: number) => frames[quest]?.[node % 3];
