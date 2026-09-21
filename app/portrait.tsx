import { originalArt } from "@/lib/original-characters";
import {
  expressionPortrait,
  type PortraitCharacter,
  type PortraitExpression,
} from "@/lib/portrait-expressions";

const faces: Record<number, string> = { 0: "/portraits/aria.png", 1: "/portraits/leon.png" };
const dialogueCells: Partial<Record<number, number>> = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  12: 8,
  13: 9,
  14: 10,
};
// Existing characters retain their own artwork, framed around the face in the UI.
const centers: Partial<Record<number, [number, number]>> = {
  2: [0.51, 0.3],
  3: [0.61, 0.3],
  4: [0.41, 0.29],
  5: [0.53, 0.4],
  6: [0.56, 0.29],
  7: [0.57, 0.28],
  12: [0.52, 0.2],
  13: [0.53, 0.25],
  14: [0.52, 0.2],
};

function expressionFace(
  portrait: NonNullable<ReturnType<typeof expressionPortrait>>,
  size: number,
) {
  return (
    <span
      className="face-portrait"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${portrait.src})`,
        backgroundSize: portrait.size,
        backgroundPosition: portrait.position,
      }}
    />
  );
}

function dialogueFace(cell: number, size: number) {
  return (
    <span
      className="face-portrait"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        backgroundImage:
          "image-set(url(/portraits/dialogue-atlas.png) 1x, url(/portraits/dialogue-atlas@2x.png) 2x)",
        backgroundSize: "400% 300%",
        backgroundPosition: `${String(((cell % 4) / 3) * 100)}% ${String((Math.floor(cell / 4) / 2) * 100)}%`,
      }}
    />
  );
}

export function Portrait({
  index,
  size = 56,
  expression = "neutral",
}: {
  index: number | PortraitCharacter;
  size?: number;
  expression?: PortraitExpression;
}) {
  const portrait = expressionPortrait(index, expression);
  if (portrait) return expressionFace(portrait, size);
  if (typeof index !== "number") return null;
  const cell = dialogueCells[index];
  if (cell !== undefined) return dialogueFace(cell, size);
  return legacyFace(index, size);
}

function legacyFace(index: number, size: number) {
  const face = faces[index],
    original = originalArt(index);
  const [cx, cy] = centers[index] || [0.5, 0.3],
    crop = original ? 0.42 : 0.54;
  const cols = original ? 1 : 4,
    rows = original ? 1 : 3;
  const x = ((original ? 0 : index % 4) + cx - crop / 2) / cols,
    y = ((original ? 0 : Math.floor(index / 4)) + Math.max(0, cy - crop / 2)) / rows;
  return (
    <span
      className="face-portrait"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${face || original || "/sprites.png"})`,
        backgroundSize: face
          ? "cover"
          : `${String((cols / crop) * 100)}% ${String((rows / crop) * 100)}%`,
        backgroundPosition: face
          ? "center"
          : `${String((x / (1 - crop / cols)) * 100)}% ${String((y / (1 - crop / rows)) * 100)}%`,
      }}
    />
  );
}
