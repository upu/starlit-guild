import type { StageActor, StageMoment, StoryStageCue } from "../story-stage-cues.ts";

const withFinn = (step: StageMoment, inspect: boolean): StageMoment => ({
  ...step,
  actors: step.actors.map((actor) =>
    actor.id === "finn" ? { ...actor, inspect, carry: inspect ? false : actor.carry } : actor,
  ),
});
const heldChair = (step: Pick<StageMoment, "items">) =>
  step.items.find((item) => item.art === "chair" && item.actor === "finn");

function sitSteps(step: StageMoment, sitter: StageActor): StageMoment[] {
  const phase = (after: number, seatTransition?: "lower" | "settle", seated = false) => ({
    ...step,
    after,
    actors: step.actors.map((actor) =>
      actor.id === sitter.id ? { ...actor, seated, seatTransition } : actor,
    ),
  });
  return [
    phase(step.after),
    phase(step.after + 350, "lower"),
    phase(step.after + 550, "settle"),
    phase(step.after + 750, undefined, true),
  ];
}

function riseSteps(step: StageMoment, previous: StageMoment): StageMoment[] {
  return (["settle", "lower"] as const).map((seatTransition, index) => ({
    ...step,
    after: step.after + index * 200,
    actors: step.actors.map((actor) =>
      actor.id === "mira"
        ? {
            ...(previous.actors.find((value) => value.id === "mira") ?? actor),
            seated: false,
            seatTransition,
          }
        : actor,
    ),
  }));
}

function chairSteps(step: StageMoment, previous: StageMoment) {
  if (heldChair(step) && !heldChair(previous))
    return {
      delay: 250,
      steps: [
        { ...withFinn(step, true), items: previous.items },
        { ...step, after: step.after + 250 },
      ],
    };
  if (!heldChair(step) && heldChair(previous))
    return {
      delay: 200,
      steps: [withFinn(step, true), { ...withFinn(step, false), after: step.after + 200 }],
    };
  return { delay: 0, steps: [step] };
}

/** Leave time for reaching, releasing and lowering into each newly placed chair. */
export function restTeaTransitions(cue: StoryStageCue): StoryStageCue {
  if (!cue.sequence?.some((step) => step.after === 16500)) return cue;
  let delay = 0;
  let previous: StageMoment = {
    after: 0,
    actors: cue.actors,
    items: cue.items ?? [],
    extras: cue.extras,
  };
  const sequence: StageMoment[] = [
    {
      ...previous,
      after: 900,
      actors: previous.actors.map((actor) =>
        actor.id === "leon"
          ? { ...actor, bottom: 32, via: undefined, inspect: true, carry: false }
          : actor,
      ),
    },
  ];
  for (const original of cue.sequence) {
    const step = { ...original, after: original.after + delay };
    const sitter = step.actors.find(
      (actor) => actor.seated && !previous.actors.find((before) => before.id === actor.id)?.seated,
    );
    const miraRises =
      !step.actors.find((actor) => actor.id === "mira")?.seated &&
      previous.actors.find((actor) => actor.id === "mira")?.seated;
    if (miraRises) {
      sequence.push(...riseSteps(step, previous));
      step.after += 400;
      delay += 400;
    }
    const chairs = chairSteps(step, previous);
    sequence.push(...(sitter ? sitSteps(step, sitter) : chairs.steps));
    delay += sitter ? 750 : chairs.delay;
    previous = original;
  }
  return { ...cue, finishBeforeAdvance: true, sequence };
}
