export function masonAppearance(
  pose: { type: "walk" | "replace" | "lift" | "carry"; frame: number; facing: 1 | -1 } | undefined,
  phase: number,
  completed: boolean,
  time: number,
  reduced: boolean,
  assets: { mason: string; masonReplace: string; masonLift: string; masonCarry: string },
) {
  const poses = {
    replace: assets.masonReplace,
    lift: assets.masonLift,
    carry: assets.masonCarry,
    walk: assets.mason,
  };
  const frame =
    pose?.frame ?? (phase === 1 && !completed ? 5 + (reduced ? 0 : Math.floor(time / 650) % 3) : 0);
  return {
    asset: pose ? poses[pose.type] : assets.mason,
    cell: 128,
    rows: pose && pose.type !== "walk" ? 1 : 2,
    frame,
    square: { foot: 120, height: 104 },
  };
}
