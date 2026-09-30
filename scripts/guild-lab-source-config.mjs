export const guildLabSourceConfig = {
  leon: {
    parts: "assets/source/guild/leon-parts-v2.png",
    blink: "assets/source/guild/leon-head-blink-v2.png",
    costume: "assets/source/guild/leon-costume-v4.png",
    farPalm: "assets/source/guild/leon-far-palm-v4.png",
    headExpression: (name) => `assets/source/guild/leon-head-${name}-v3.png`,
    baseAtlas: "public/guild/leon-parts-v2.webp",
    atlas: "public/guild/leon-parts-v3.webp",
    art: "lib/guild-lab-art.ts",
    rig: {
      eyeRegion: { atlasX: 153, atlasY: 218, width: 107, height: 45 },
      mouthRegion: { x0: 195, x1: 222, y0: 271, y1: 285 },
      neck: { earUnder: [107, 239], chinUnder: [198, 263] },
      armJoints: {
        4: { proximal: [99, 41], distal: [46, 165] },
        5: { proximal: [47, 39], distal: [79, 181], wrist: [71, 142] },
        6: { proximal: [91, 52], distal: [48, 171] },
        7: { proximal: [43, 42], distal: [75, 197], wrist: [69, 148] },
      },
      legJoints: {
        8: { proximal: [60, 26], distal: [59, 188] },
        9: { proximal: [61, 31], distal: [88, 200] },
        10: { proximal: [68, 28], distal: [68, 190] },
        11: { proximal: [63, 31], distal: [89, 198] },
      },
      headHeight: 90,
    },
    affection: {
      farForearmJoints: { proximal: [52, 27], distal: [74, 166], wrist: [65, 121] },
      costumeFrames: [
        [2, 0, 0.375],
        [1, 0.375, 0.7],
        [3, 0.7, 1],
      ],
      frameX: { 1: 360, 2: 730, 3: 1030 },
      faceRegions: { eyes: [120, 159, 122, 77], mouth: [161, 233, 42, 28] },
      atlasHeight: 1340,
    },
  },
  aria: {
    master: "assets/source/guild/aria-master-v5.json",
    head: "assets/source/guild/aria-master-v5-parts/head.png",
    headExpression: (name) => `assets/source/guild/aria-head-${name}-v5.png`,
    atlas: "public/guild/aria-parts-v1.webp",
    art: "lib/guild-lab-aria-art.ts",
  },
};
