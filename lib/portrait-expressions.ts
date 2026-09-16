// Row-major cells in each character's 4 x 2 expression sheet.
export const portraitExpressions = [
  "neutral",
  "smile",
  "surprised",
  "worried",
  "serious",
  "shy",
  "tired",
  "mischievous",
] as const;
export type PortraitExpression = (typeof portraitExpressions)[number];

const portraitCharacters: Partial<Record<number, string>> = {
  0: "aria",
  1: "leon",
  2: "mira",
  13: "pumpety",
};

export function expressionPortrait(index: number, expression: PortraitExpression = "neutral") {
  const character = portraitCharacters[index];
  if (!character) return null;
  const cell = Math.max(0, portraitExpressions.indexOf(expression));
  // The artwork itself is a close-up: show one whole cell without an extra crop.
  return {
    src: `/portraits/${character}-expressions.webp`,
    size: "400% 200%",
    position: `${String(((cell % 4) / 3) * 100)}% ${String(Math.floor(cell / 4) * 100)}%`,
  };
}
