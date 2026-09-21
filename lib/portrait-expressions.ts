// Each character declares the expressions present in its row-major atlas.
export const portraitExpressions = [
  "neutral",
  "smile",
  "surprised",
  "worried",
  "serious",
  "shy",
  "tired",
  "mischievous",
  "thoughtful",
] as const;
export type PortraitExpression = (typeof portraitExpressions)[number];

const standardAtlas = { columns: 4, rows: 2, expressions: portraitExpressions.slice(0, 8) };
export const portraitAtlases = {
  aria: standardAtlas,
  leon: standardAtlas,
  mira: standardAtlas,
  pumpety: standardAtlas,
  finn: { columns: 3, rows: 3, expressions: portraitExpressions },
} as const;
export type PortraitCharacter = keyof typeof portraitAtlases;

const portraitCharacters: Partial<Record<number, PortraitCharacter>> = {
  0: "aria",
  1: "leon",
  2: "mira",
  13: "pumpety",
};

export function expressionPortrait(
  index: number | PortraitCharacter,
  expression: PortraitExpression = "neutral",
) {
  const character = typeof index === "number" ? portraitCharacters[index] : index;
  if (!character) return null;
  const atlas = portraitAtlases[character];
  // An expression absent from this character's atlas falls back to neutral.
  const cell = Math.max(0, atlas.expressions.indexOf(expression));
  // The artwork itself is a close-up: show one whole cell without an extra crop.
  return {
    src: `/portraits/${character}-expressions.webp`,
    size: `${String(atlas.columns * 100)}% ${String(atlas.rows * 100)}%`,
    position: `${String(((cell % atlas.columns) / (atlas.columns - 1)) * 100)}% ${String((Math.floor(cell / atlas.columns) / (atlas.rows - 1)) * 100)}%`,
  };
}
