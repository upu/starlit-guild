import { copyFile } from "node:fs/promises";

// Preserve the common painted camera and the inspection cover's registration.
for (const phase of ["blocked", "cleared", "open"])
  await copyFile(
    `assets/source/storybook/drain-workyard-${phase}-v1.png`,
    `public/storybook-study/drain-workyard-${phase}-v1.png`,
  );
console.log("Three waterway workyard states copied without resizing.");
