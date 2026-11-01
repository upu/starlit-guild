import type { StageActor, StageExtra, StageItem, StoryStageCue } from "@/lib/story-stage-cues";
import { miraLeavesChair } from "./seat-handover.ts";
import { finnSitsDown, riseBeforeWalking } from "./seat-transitions.ts";
import { storeResearchSample } from "./sample-storage.ts";
import { paintedPaperHands } from "./paper-cue.ts";

function paperWrist(item: StageItem, notes: boolean) {
  if (item.actor !== "leon" || !item.wrist) return item.wristOffset;
  return notes ? { x: 0.6, bottom: 0.7 } : { x: -0.4, bottom: 1.5 };
}

const heldResearchSample = (item: StageItem) =>
  item.actor === "lico" && item.wrist && item.art === "sample-dish";

function studyItem(item: StageItem, line?: number): StageItem {
  // The painted researcher is shorter than the former sprite. Attach the
  // pack to her back, below the shoulders, instead of beside her head.
  if (item.id === "lico-sample-bag") return { ...item, x: -2.5, bottom: 20, width: 4.5 };
  const adjusted = heldNotes(item);
  // During the group conversation the sheet belongs in the open part of the
  // desk, clear of Finn's seated silhouette. Later Leon uses the near corner.
  return line !== undefined && line < 60 && item.id === "ledger" && item.support === "table"
    ? { ...adjusted, x: 45 }
    : adjusted;
}

function paperWidth(item: StageItem) {
  if (item.art === "folded-paper") return 2.6;
  return item.id === "leon-notes" ? 4.8 : 6;
}

function heldNotes(item: StageItem): StageItem {
  // The writing desk's top is above the former low table's contact plane.
  if (item.support === "table") item = { ...item, bottom: item.bottom + 2 };
  if (heldResearchSample(item)) return { ...item, support: "table" };
  // Painted seat strips contain the person only, unlike the original atlas.
  // Keep the separate chair visible while its occupant is seated.
  if (item.art === "chair")
    return { ...item, seatFor: undefined, width: 8.5, x: item.x + (item.left ? 1.5 : -1.5) };
  if (!["ledger", "leon-notes"].includes(item.id) || !["paper", "folded-paper"].includes(item.art))
    return item;
  // The seated study's lower hand is above the old atlas wrist. Keep sheets
  // small enough to compare side by side without covering his face or boots.
  const notes = item.id === "leon-notes";
  return {
    ...item,
    width: paperWidth(item),
    ...(item.support === "table" ? { x: notes ? 60 : 63 } : {}),
    wristOffset: paperWrist(item, notes),
  };
}

export function indoorStudyCue(cue: StoryStageCue, line?: number): StoryStageCue {
  const adjusted = {
    ...cue,
    actors: cue.actors.map((actor) =>
      researchActor(clearResearchAisle(actor, line), cue.cell ?? 24),
    ),
    items: cue.items?.map((item) => clerkItem(studyItem(item, line), cue.extras)),
    extras: cue.extras?.map((extra) => paintedClerk(extra, cue.cell ?? 24)),
    sequence: cue.sequence?.map((moment) => ({
      ...moment,
      actors: moment.actors.map((actor) =>
        researchActor(clearResearchAisle(actor, line), cue.cell ?? 24),
      ),
      items: moment.items.map((item) => clerkItem(studyItem(item, line), moment.extras)),
      extras: moment.extras?.map((extra) => paintedClerk(extra, cue.cell ?? 24)),
    })),
  };
  if (line === 21) return storeResearchSample(adjusted);
  if (line === 35) return paintedPaperHands(adjusted);
  if (line === 60) return paperPlacement(adjusted);
  if (line === 42) return riseBeforeWalking(miraSitDown(adjusted), "finn");
  if (line === 16) return riseBeforeWalking(adjusted, "finn");
  if (line === 22) return finnSitsDown(adjusted);
  if (line === 64) return riseBeforeWalking(adjusted, "leon");
  return line === 50 ? miraLeavesChair(adjusted) : adjusted;
}

function researchActor(actor: StageActor, cell: number): StageActor {
  if (actor.id !== "lico" || !["reach", "write"].includes(actor.mossStudy ?? "")) return actor;
  return {
    ...actor,
    x: actor.x - (10 * cell) / 128,
    bottom: (actor.bottom ?? 14) + 2 + (3 * cell * 1.5) / 128,
    wristPoints: { 73: [81, 83] },
    reachOver: "table",
  };
}

function clearResearchAisle(actor: StageActor, line?: number): StageActor {
  // Aria steps aside after placing the samples. Keep Lico's route to the
  // near corner clear without moving the table, sample or reaching hand.
  if (actor.id === "mira" && line === 21) return { ...actor, nameAbove: true };
  if (actor.id !== "aria") return actor;
  if (actor.x === 78 && actor.bottom === -15) return { ...actor, x: 92 };
  // The return path passes near the lower edge; keep its label inside the stage
  // above Aria's head, while retaining the walking lane below Mira's feet.
  return actor.x === 19 && actor.lane === -25
    ? { ...actor, nameAbove: true, nameOffset: 0 }
    : actor;
}

function clerkItem(item: StageItem, extras?: StageExtra[]): StageItem {
  return item.extra === "merchant" &&
    extras?.some((extra) => extra.id === "merchant" && extra.service === "place")
    ? { ...item, support: "table" }
    : item;
}

function paintedClerk(extra: StageExtra, cell: number): StageExtra {
  return extra.id === "merchant"
    ? {
        ...extra,
        wristPoints: { 12: [33, 68], 13: [29, 91], 14: [29, 56] },
        ...(extra.service === "place"
          ? {
              x: extra.x + (5 * cell) / 128,
              bottom: (extra.bottom ?? 23) + 2 - (8 * cell * 1.5) / 128,
              handOver: {
                item: "table",
                rect: [19, 73, 27, 25] as [number, number, number, number],
              },
            }
          : {}),
      }
    : extra;
}

function miraSitDown(cue: StoryStageCue): StoryStageCue {
  const steps = cue.sequence;
  const arrival = steps?.[0];
  if (!arrival || arrival.after !== 650) return cue;
  const phase = (seatTransition?: "lower" | "settle") =>
    arrival.actors.map((actor) =>
      actor.id === "mira" ? { ...actor, seated: false, seatTransition } : actor,
    );
  return {
    ...cue,
    sequence: [
      { ...arrival, actors: phase() },
      { ...arrival, after: 1400, actors: phase("lower") },
      { ...arrival, after: 1600, actors: phase("settle") },
      { ...arrival, after: 1800 },
      ...steps.slice(1),
    ],
  };
}

function paperPlacement(cue: StoryStageCue): StoryStageCue {
  const steps = cue.sequence;
  if (!steps || steps.length !== 3) return cue;
  const reach = steps[0].actors.map((actor) =>
    actor.id === "leon"
      ? { ...actor, pose: "offer" as const, seatedPaper: "reach" as const }
      : actor,
  );
  const release = reach.map((actor) =>
    actor.id === "leon" ? { ...actor, seatedPaper: "release" as const } : actor,
  );
  const atHand = (items: StageItem[]) =>
    items.map((item) =>
      item.actor === "leon" && item.wrist ? { ...item, wristOffset: { x: 2, bottom: 3.3 } } : item,
    );
  return {
    ...cue,
    sequence: [
      steps[0],
      { ...steps[0], after: 1400, actors: reach, items: atHand(steps[0].items) },
      { ...steps[1], after: 2200, actors: reach, items: atHand(steps[1].items) },
      { ...steps[2], after: 3100, actors: release },
      { ...steps[2], after: 3900 },
    ],
  };
}
