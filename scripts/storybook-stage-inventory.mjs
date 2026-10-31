import { prologueStories } from "../lib/prologue-stories.ts";
import { chapterTwoStories } from "../lib/chapter-two-stories.ts";
import { chapterThreeStories } from "../lib/chapter-three-stories.ts";
import { chapterFourStories } from "../lib/chapter-four-stories.ts";
import { storyStageCue } from "../lib/story-stage.ts";

// Enumerate authored cues, including delayed movement, instead of guessing
// which assets a chapter needs from its opening line alone.
const chapters = [prologueStories, chapterTwoStories, chapterThreeStories, chapterFourStories];
const inventory = chapters.flatMap((stories, index) =>
  stories.map((story) => {
    const backgrounds = new Set();
    const actors = new Set();
    const props = new Set();
    let stagedLines = 0;
    story.lines.forEach((_, line) => {
      const cue = storyStageCue(story.id, line);
      if (!cue) return;
      stagedLines++;
      backgrounds.add(cue.background ?? "meeting-path");
      if (cue.merchant) actors.add("extra:merchant");
      for (const moment of [cue, ...(cue.sequence ?? [])]) {
        moment.actors.forEach((actor) => actors.add(actor.id));
        moment.items?.forEach((item) => props.add(item.art));
        moment.extras?.forEach((extra) => actors.add(`extra:${extra.id}`));
      }
    });
    return {
      chapter: index + 1,
      id: story.id,
      title: story.title,
      lines: story.lines.length,
      stagedLines,
      backgrounds: [...backgrounds].sort(),
      actors: [...actors].sort(),
      props: [...props].sort(),
    };
  }),
);
process.stdout.write(`${JSON.stringify(inventory, null, 2)}\n`);
