import { prologueStories } from "@/lib/prologue-stories";
import { chapterFourStories } from "@/lib/chapter-four-stories";

export const studyScenes = [
  {
    id: "outdoor",
    label: "屋外・倉庫前",
    storyId: "town-deliveries-departure",
    art: "warehouse-v1",
    end: 15,
  },
  {
    id: "indoor",
    label: "屋内・事務室",
    storyId: "starlit-guild-founding-return",
    art: "office-v1",
    end: 67,
  },
];
export const studyStories = [...prologueStories, ...chapterFourStories];
