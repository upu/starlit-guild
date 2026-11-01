import test from "node:test";
import assert from "node:assert/strict";
import * as jsxRuntime from "react/jsx-runtime";
import { compileSourceModule, evaluateSourceModule } from "./helpers/source-module.mjs";

test("return conversation opens only after the completed visual sequence without editing the save", () => {
  let open = false;
  const story = { id: "starlit-guild-founding-return", lines: [{ text: "倉庫の大家" }] };
  const forest = { id: "forest-wetland-return", lines: [{ text: "木の根の脇" }] };
  const reader = () => null;
  const reviewModule = evaluateSourceModule(
    compileSourceModule("../app/sprite-lab/storybook/founding-return-review.tsx", import.meta.url),
    {
      "react/jsx-runtime": jsxRuntime,
      react: {
        useState: () => [
          open,
          (value) => {
            open = value;
          },
        ],
        useRef: () => ({ current: null }),
        useEffect: () => {},
      },
      "@/lib/stories": { stories: [story, forest] },
      "../../story-scenes": { StoryReader: reader },
      "./adventure-status": { StudyStatus: () => null },
      "./founding-return-review.css": {},
    },
  );
  const quest = "starlit-guild-founding";
  const state = { done: { [quest]: 1 }, squads: [{ run: null }] };
  const props = { quest, state, painted: true, finished: true };
  const before = JSON.stringify(state);
  assert.equal(reviewModule.FoundingReturnPreview({ ...props, finished: false }), null);
  assert.equal(reviewModule.FoundingReturnPreview({ ...props, painted: false }), null);
  assert.equal(reviewModule.FoundingReturnPreview({ ...props, quest: "linde-requests" }), null);
  assert.equal(
    reviewModule.FoundingReturnPreview({ ...props, state: { ...state, squads: [{ run: {} }] } }),
    null,
  );
  const closed = reviewModule.FoundingReturnPreview(props);
  closed.props.children[0].props.onClick();
  const opened = reviewModule.FoundingReturnPreview(props);
  const storyReader = opened.props.children[1].props.children;
  assert.equal(storyReader.type, reader);
  assert.equal(storyReader.props.story, story);
  assert.equal(storyReader.props.onRead(), true);
  storyReader.props.onClose();
  assert.equal(open, false);
  assert.equal(JSON.stringify(state), before);

  const forestState = { done: { "forest-wetland": 1 }, squads: [{ run: null }] };
  const forestProps = {
    quest: "forest-wetland",
    state: forestState,
    painted: true,
    finished: false,
  };
  const forestBefore = JSON.stringify(forestState);
  assert.equal(
    reviewModule.FoundingReturnPreview({ ...forestProps, state: { ...forestState, done: {} } }),
    null,
  );
  assert.equal(
    reviewModule.FoundingReturnPreview({
      ...forestProps,
      state: { ...forestState, squads: [{ run: {} }] },
    }),
    null,
  );
  reviewModule.FoundingReturnPreview(forestProps).props.children[0].props.onClick();
  assert.equal(
    reviewModule.FoundingReturnPreview(forestProps).props.children[1].props.children.props.story,
    forest,
  );
  assert.equal(JSON.stringify(forestState), forestBefore);
});
