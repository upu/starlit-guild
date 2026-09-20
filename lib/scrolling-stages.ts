export type RoadStageId = "forest" | "trio" | "worksite";
export type RoadStop = { kind: "battle" | "gather" | "boss"; x: number; count: number; hp: number };
export const roadStages = {
  forest: {
    name: "ふたりの森",
    description: "少数の敵と、道中の採取",
    trio: false,
    work: 14000,
    waves: 1,
    ambushers: 1,
  },
  trio: {
    name: "三人の街道",
    description: "ミラが回復を担当 · 敵は最大4体",
    trio: true,
    work: 18000,
    waves: 1,
    ambushers: 2,
  },
  worksite: {
    name: "薬草の群生地",
    description: "三人で採取 · ときどき前後から敵",
    trio: true,
    work: 32000,
    waves: 2,
    ambushers: 2,
  },
} as const;
export function roadStops(stage: RoadStageId): RoadStop[] {
  if (stage === "worksite")
    return [180, 410, 680].map((x) => ({ kind: "gather", x, count: 0, hp: 0 }));
  return [
    { kind: "battle", x: 210, count: stage === "trio" ? 3 : 1, hp: 65 },
    { kind: "gather", x: 330, count: 0, hp: 0 },
    { kind: "battle", x: 520, count: stage === "trio" ? 4 : 2, hp: 85 },
    { kind: "gather", x: 660, count: 0, hp: 0 },
    { kind: "boss", x: 840, count: 1, hp: 300 },
  ];
}
