// Generated: node scripts/build-guild-lab-affection.mjs
export const guildLabArt = {
  width: 1332,
  height: 1340,
  frames: [
    [25, 34, 297, 268],
    [360, 110, 189, 181],
    [730, 110, 162, 223],
    [1030, 110, 132, 217],
    [98, 404, 139, 202],
    [448, 399, 130, 214],
    [749, 393, 160, 215],
    [1118, 391, 123, 235],
    [111, 673, 120, 208],
    [424, 669, 183, 223],
    [786, 669, 135, 209],
    [1085, 675, 179, 213],
    [1089, 1000, 163, 118],
    [40, 1000, 107, 45],
    [20, 1200, 122, 77],
    [270, 1200, 122, 77],
    [270, 1295, 42, 25],
    [520, 1200, 122, 77],
    [520, 1295, 42, 21],
    [770, 1200, 122, 77],
    [770, 1295, 37, 20],
    [1020, 1200, 122, 77],
    [1020, 1295, 42, 27],
  ],
  armJoints: {
    "4": { proximal: [99, 41], distal: [46, 165] },
    "5": { proximal: [52, 27], distal: [74, 166], wrist: [65, 121] },
    "6": { proximal: [91, 52], distal: [48, 171] },
    "7": { proximal: [79, 42], distal: [47, 197], wrist: [53, 148] },
  },
  legJoints: {
    "8": { proximal: [60, 26], distal: [59, 188] },
    "9": { proximal: [61, 31], distal: [88, 200] },
    "10": { proximal: [68, 28], distal: [68, 190] },
    "11": { proximal: [63, 31], distal: [89, 198] },
  },
  head: {
    displayHeight: 90,
    neck: { earUnder: [107, 239], chinUnder: [198, 263], center: [152.5, 251] },
    mouth: { x: 178.55555555555554, y: 243.88888888888889, bounds: [175, 243, 9, 3], pixels: 9 },
    blink: {
      frame: 13,
      rect: [128, 184, 107, 45],
      roi: { x: 128, y: 184, width: 107, height: 45 },
      changedPixels: 2568,
    },
    expressions: {
      neutral: {
        patches: [
          {
            frame: 14,
            rect: [120, 159, 122, 77],
            roi: [120, 159, 122, 77],
            region: "eyes",
            changedPixels: 2289,
          },
        ],
        closedEyes: false,
      },
      smile: {
        patches: [
          {
            frame: 15,
            rect: [120, 159, 122, 77],
            roi: [120, 159, 122, 77],
            region: "eyes",
            changedPixels: 4083,
          },
          {
            frame: 16,
            rect: [161, 236, 42, 25],
            roi: [161, 233, 42, 28],
            region: "mouth",
            changedPixels: 333,
          },
        ],
        closedEyes: true,
      },
      surprised: {
        patches: [
          {
            frame: 17,
            rect: [120, 159, 122, 77],
            roi: [120, 159, 122, 77],
            region: "eyes",
            changedPixels: 2642,
          },
          {
            frame: 18,
            rect: [161, 240, 42, 21],
            roi: [161, 233, 42, 28],
            region: "mouth",
            changedPixels: 123,
          },
        ],
        closedEyes: false,
      },
      tired: {
        patches: [
          {
            frame: 19,
            rect: [120, 159, 122, 77],
            roi: [120, 159, 122, 77],
            region: "eyes",
            changedPixels: 3429,
          },
          {
            frame: 20,
            rect: [161, 241, 37, 20],
            roi: [161, 233, 42, 28],
            region: "mouth",
            changedPixels: 57,
          },
        ],
        closedEyes: false,
      },
      yawn: {
        patches: [
          {
            frame: 21,
            rect: [120, 159, 122, 77],
            roi: [120, 159, 122, 77],
            region: "eyes",
            changedPixels: 3294,
          },
          {
            frame: 22,
            rect: [161, 234, 42, 27],
            roi: [161, 233, 42, 28],
            region: "mouth",
            changedPixels: 246,
          },
        ],
        closedEyes: false,
      },
    },
  },
  armSeams: {
    "5": { proximal: [52, 27], maxY: 42, fadeStartY: 9, edgeRadius: 5, changedPixels: 755 },
    "7": { proximal: [79, 42], maxY: 57, fadeStartY: 24, edgeRadius: 5, changedPixels: 962 },
  },
  torso: { neck: { collarBounds: [53, 120], center: [86.5, 15], scanRows: [0, 30], pixels: 928 } },
  asset: "/guild/leon-parts-v3.webp",
} as const;
