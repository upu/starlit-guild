import { copyFile } from "node:fs/promises";
await copyFile(
  "assets/source/storybook/forest-dusk-lane-loop-v1.png",
  "public/storybook-study/forest-dusk-lane-loop-v1.png",
);
console.log("Dusk trading ground copied without changing its painted pixels.");
