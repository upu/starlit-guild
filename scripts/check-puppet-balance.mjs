import { isolated, measure } from "./check-chapter-two-balance.mjs";
// Same equipment and measurement contract as the chapter-wide comparison.
console.table(
  [15, 19, 30].flatMap((level) =>
    ["spinning-signpost", "begging-golem", "sweet-blockade"].map(
      (quest) => measure(isolated(quest, level), quest).record,
    ),
  ),
);
