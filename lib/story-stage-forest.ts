import { moss as dishMoss, item, type ChapterStage } from "./story-stage-chapter-shared.ts";

const cloth = (actor: "aria" | "leon") =>
  item("cloth", "cloth", actor === "aria" ? 4 : -5, actor === "aria" ? 20 : 24, {
    actor,
    width: actor === "aria" ? 6 : 7,
  });

const moss: typeof dishMoss = (actor, glow) => ({
  ...dishMoss(actor, glow),
  art: "moss-jar",
  width: 5,
  bottom: 23,
});

export const forestStages: Record<string, ChapterStage> = {
  "forest-wetland-departure": {
    background: "meeting-path",
    exit: "together",
    beats: [
      { at: 0, aria: { carry: true }, items: [cloth("aria"), moss("aria", "dim")] },
      {
        at: 4,
        aria: { carry: false, x: 39, pose: "offer" },
        leon: { pose: "offer", carry: true },
        items: [moss("aria", "dim"), cloth("leon")],
      },
      {
        at: 7,
        leon: { pose: "offer", carry: true },
        items: [
          moss("aria", "dim"),
          item("dish", "dish", -5, 24, { actor: "leon", width: 7 }),
          item("supplies", "tools", 63, 13, { width: 12 }),
        ],
      },
      { at: 11, leon: { inspect: false, pose: "think" } },
      {
        at: 13,
        aria: { pose: "offer" },
        leon: { pose: "offer" },
        items: [moss("aria", "dim"), cloth("leon")],
      },
      {
        at: 16,
        aria: { x: 41, carry: true, left: false },
        leon: { x: 60, left: false, carry: false },
        items: [cloth("aria"), moss("aria", "dim")],
      },
    ],
  },
  "forest-wetland-return": {
    background: "forest-floor",
    beats: [
      {
        at: 0,
        aria: { x: 31, inspect: true },
        leon: { x: 52 },
        items: [
          item("sample", "moss", 38, 14, { width: 9 }),
          item("colony", "colony", 23, 14, { width: 9 }),
          item("forest", "dish", 46, 14, { width: 9 }),
        ],
      },
      { at: 3, leon: { inspect: true } },
      {
        at: 4,
        items: [
          item("sample", "moss", 38, 14, { width: 9 }),
          item("colony", "colony", 23, 14, { width: 9 }),
          item("forest", "moss", 46, 14, { width: 9 }),
        ],
      },
    ],
  },
};
