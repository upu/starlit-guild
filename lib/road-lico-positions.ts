import type { TravellerId } from "./road-view.ts";

/** Fixed points on the same garden painting used by the preceding conversation. */
export function recordsPoint(
  id: TravellerId | "reflector" | "samples",
  portrait: boolean,
): [number, number] {
  const wide: Record<TravellerId | "reflector" | "samples", [number, number]> = {
    aria: [550, 530],
    leon: [880, 780],
    mira: [525, 750],
    finn: [734, 840],
    lico: [950, 610],
    reflector: [690, 500],
    samples: [1054, 720],
  };
  const tall: typeof wide = {
    aria: [385, 690],
    leon: [587, 760],
    mira: [315, 790],
    finn: [490, 790],
    lico: [635, 645],
    reflector: [460, 580],
    samples: [703, 725],
  };
  return (portrait ? tall : wide)[id];
}
