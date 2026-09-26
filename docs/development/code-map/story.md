# 台詞・読者・思い出

[作業別のコード案内](../code-map.md) に戻る。

- **編集元・主要関数**: [シーンの集約](../../../lib/stories.ts) の `stories` / `availableStories` → 対象章の本文。第三章は [接続](../../../lib/chapter-three-stories.ts) から [分割ファイル](../../../lib/chapter-three-opening-stories.ts) へ。第四章は [接続](../../../lib/chapter-four-stories.ts) から [幕間〜4-3の本文](../../../lib/chapter-four-stories-1.ts)・[4-4〜4-8の本文](../../../lib/chapter-four-stories-2.ts)・[4-9〜4-10の本文](../../../lib/chapter-four-stories-3.ts) と [道中会話](../../../lib/chapter-four-banter.ts) へ。[読者](../../../app/story-scenes.tsx) は `StoryReader`、[思い出の章選択と一覧](../../../app/story-library.tsx) は `StoryLibrary`、スチルは [storyArtAt](../../../lib/story-art.ts)。マップ下の掛け合いの送りと重複防止は [掛け合いの進行](../../../lib/banter-exchange.ts) の `nextBanter`。

- **仕様**: [シナリオの案内](../../story/README.md)、[人物一覧](../../characters/README.md)、対象章の実装資料。[ゲーム内台本](../../story/game-script/README.md)（`docs/story/game-script/`）は出力。
- **検証**: [台詞](../../../tests/stories.test.mjs)、[読者](../../../tests/story-reader.test.mjs)、[スチル](../../../tests/story-art.test.mjs)、[掛け合いの進行](../../../tests/banter-exchange.test.mjs)、[台本](../../../tests/export-script.test.mjs)。画面幅は [手動テスト](../development.md#ローカルの手動テスト) の `dialog-layout.browser.py`、動画は `story-video.browser.mjs`。本文変更後は `npm run script:export` / `npm run script:check`。
