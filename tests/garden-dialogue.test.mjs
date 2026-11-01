import test from "node:test";
import assert from "node:assert/strict";
import * as chapterFour from "../lib/chapter-four-banter.ts";
import * as battleBanter from "../lib/chapter-four-battle-banter.ts";
import { compileSourceModule, evaluateSourceModule } from "./helpers/source-module.mjs";

test("garden cues follow the visible line and keep the first smoke target after events roll off", () => {
  let stored;
  const react = {
    useState() {
      return [
        stored,
        (update) => {
          stored = typeof update === "function" ? update(stored) : update;
        },
      ];
    },
    useCallback(callback) {
      return callback;
    },
  };
  const { useGardenDialogue } = evaluateSourceModule(
    compileSourceModule("../app/use-garden-dialogue.ts", import.meta.url),
    {
      react,
      "@/lib/chapter-four-banter": chapterFour,
      "@/lib/chapter-four-battle-banter": battleBanter,
    },
  );
  const model = {
    squad: { id: "party" },
    run: {
      quest: "lico-records",
      started: 12,
      events: [{ kind: "move", text: "リコのしびれ煙で一時的に麻痺", target: "leon" }],
    },
  };
  let cue = useGardenDialogue(model);
  cue.onLine({ speaker: "mira", text: "無理に動かさないで。私が支えるわ。" });
  cue = useGardenDialogue(model);
  assert.equal(cue.records.cue, "support");
  assert.equal(cue.records.patient, "leon");
  model.run.events = [];
  cue = useGardenDialogue(model);
  cue.onLine({ speaker: "finn", text: "動ける方で栓を閉めよう。こっちの瓶もかい？" });
  cue = useGardenDialogue(model);
  assert.equal(cue.records.cue, "bottle");
  assert.equal(cue.records.patient, "leon");
  model.run.started = 13;
  cue = useGardenDialogue(model);
  assert.equal(cue.records.cue, "other");
  assert.equal(cue.records.patient, undefined);
});
