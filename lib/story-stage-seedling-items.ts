import { ground } from "./story-stage-later-shared.ts";

export const loadingBaskets = () => [
  { ...ground("basket", 38, 34, 10), id: "covered-seedlings" },
  { ...ground("packing-cloth", 38, 39, 9), id: "damp-cloth", support: "covered-seedlings" },
  { ...ground("basket", 69, 31, 10), id: "open-seedlings" },
  { ...ground("moss", 69, 36, 6), id: "open-moss", support: "open-seedlings" },
];
