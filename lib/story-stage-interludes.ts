import { walnutLunch } from "./story-stage-picnic.ts";
import { scene, duo, held, ground, type LaterStage } from "./story-stage-later-shared.ts";
const cloth = () => ground("picnic-cloth", 50, 12, 28);
export const interludeStages: Record<string, LaterStage> = {
  "interlude-promised-walnuts": scene(
    "hill-path",
    duo(),
    [
      {
        at: 0,
        actors: { aria: { seated: true }, leon: { seated: true } },
        items: [
          cloth(),
          ground("bread", 43, 17, 9),
          { ...ground("bread", 52, 17, 9), id: "medium" },
          { ...ground("bread", 60, 17, 9), id: "dark" },
        ],
      },
      { at: 7, actors: { aria: { x: 38 } } },
      {
        at: 8,
        items: [
          cloth(),
          held("bread", "leon"),
          held("bread", "aria", { id: "aria-bread" }),
          ground("tea", 56, 13, 10),
        ],
      },
      { at: 19, actors: { aria: { pose: "think" } } },
      { at: 30, actors: { aria: { reaction: "surprise" } } },
      { at: 35, items: [cloth(), ground("bread", 48, 17, 10), ground("tea", 56, 13, 10)] },
      { at: 38, items: [cloth(), held("bread", "aria"), ground("tea", 56, 13, 10)] },
      { at: 42, actors: { aria: { pose: "surprise" } } },
      {
        at: 49,
        actors: { leon: { pose: "offer" } },
        items: [cloth(), ground("bread", 48, 17, 10), ground("tea", 56, 13, 10)],
      },
      {
        at: 54,
        actors: { aria: { seated: false }, leon: { seated: false } },
        items: [held("cloth", "leon")],
      },
    ],
    { exit: ["aria", "leon"] },
  ),
  "interlude-walnut-lunch": walnutLunch,
};
