import type { Enemy } from "./combat.ts";
import type { Run } from "./game-types.ts";

/** The windup uses the scheduled strike; impact requires an actual damage event. */
export function puppetAttackPose(
  enemy: Pick<Enemy, "id" | "hp" | "role" | "nextAt">,
  run: Run | null,
  now: number,
) {
  if (!run || enemy.hp <= 0 || !["golem", "sweeper"].includes(enemy.role ?? "")) return;
  const prefix = `${String(run.round)}-${String(run.node)}-`;
  const impact = run.events.findLast(
    (e) =>
      e.kind === "hurt" &&
      e.enemy === enemy.id &&
      e.id.startsWith(prefix) &&
      now >= e.at &&
      now - e.at < 220,
  );
  if (impact) return "strike" as const;
  const remaining = enemy.nextAt - now;
  if (remaining > 0 && remaining <= 1000) return "windup" as const;
}
