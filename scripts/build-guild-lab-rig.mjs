// Completed-master generation is the only current entry point.
const character = process.argv[2] ?? "leon";
if (character === "leon") await import("./build-guild-lab-leon.mjs");
else if (character === "aria") await import("./build-guild-lab-aria.mjs");
else throw Error(`Unknown guild lab character: ${character}`);
