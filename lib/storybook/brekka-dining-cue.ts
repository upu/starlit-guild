import type { StoryStageCue, StageMoment } from "../story-stage-cues.ts";
import { brekkaDiner, brekkaServer, seatBottom } from "./brekka-dining-actors.ts";
import { brekkaDiningItem } from "./brekka-dining-items.ts";
export function brekkaDiningStudyCue(cue: StoryStageCue, rise = false): StoryStageCue {
  const adjust = (s: Pick<StoryStageCue, "actors" | "items" | "extras">) => ({
    actors: s.actors.map(brekkaDiner),
    items: [
      ...(s.items ?? []).map((i) =>
        brekkaDiningItem(i, s.extras?.some((e) => e.x === 81) ?? false),
      ),
      { id: "worker-chair", art: "chair" as const, x: 4.5, bottom: 22, width: 8.5 },
    ],
    extras: s.extras?.map((e) => brekkaServer(e, s.items ?? [])),
  });
  const sequence = cue.sequence?.map((s) => ({ ...s, ...adjust(s) }));
  const start = adjust(cue);
  cue = {
    ...cue,
    initial: { aria: 56, leon: 63.4, mira: 36, finn: 84 },
    initialBottom: { aria: 30, leon: 30, mira: 24, finn: 23 },
  };
  if (rise) {
    const phases: StageMoment[] = ["settle", "lower", undefined].map((phase, i) => ({
      ...start,
      after: 200 + i * 200,
      actors: start.actors.map((a) => ({
        ...a,
        seated: false,
        bottom: seatBottom[a.id] ?? a.bottom,
        seatTransition: phase as "settle" | "lower" | undefined,
      })),
    }));
    return {
      ...cue,
      ...start,
      finishBeforeAdvance: true,
      sequence: [...phases, ...(sequence ?? [])],
    };
  }
  return {
    ...cue,
    ...start,
    sequence,
    finishBeforeAdvance: !!sequence?.length || cue.actors.some((a) => !!a.via?.length),
  };
}
