import { prepareMiniAnimation } from "./prepare-mini-animation.mjs";

await prepareMiniAnimation({
  id: "mira",
  version: 3,
  recordPath: "docs/art-generation/mira-mini-refresh-20261006.json",
  script: "scripts/prepare-mira-animation.mjs",
});
