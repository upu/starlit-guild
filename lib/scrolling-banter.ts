import { idleBanter } from "./idle-banter.ts";

// Reuse established exchanges. The chat clock never gates combat or movement.
export function roadChat(time: number, members: readonly string[] = ["aria", "leon"]) {
  const cycle = Math.floor(time / 30000);
  return Array.from(
    { length: Math.min(6, cycle + 1) },
    (_, index) => Math.max(0, cycle - 5) + index,
  )
    .flatMap((batch) =>
      idleBanter(batch * 30000, members).map((line, index) => ({
        ...line,
        id: `${String(batch)}-${String(index)}`,
        at: batch * 30000 + index * 4800,
      })),
    )
    .filter((line) => line.at <= time);
}
