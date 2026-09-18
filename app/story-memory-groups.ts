import { allQuests } from "@/lib/game";
import { storyStages } from "@/lib/prologue";
import type { Story } from "@/lib/stories";

export function memoryGroups(items: Story[]) {
  const questIds = [
    ...storyStages.map((stage) => stage.quest),
    ...new Set(items.flatMap((st) => (st.quest ? [st.quest] : []))),
  ];
  const journey = [...new Set(questIds)].flatMap((id) => {
    const entries = items
      .filter((st) => st.quest === id)
      .sort((a, b) => Number(a.chapter === "return") - Number(b.chapter === "return"));
    const stage = storyStages.find((stage) => stage.quest === id),
      quest = allQuests.find((q) => q.id === id);
    return entries.length
      ? [
          {
            id,
            title: (stage ? stage.number + " · " : "") + (quest?.name || entries[0].title),
            items: entries,
          },
        ]
      : [];
  });
  return journey;
}
