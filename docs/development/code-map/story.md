# 台詞・読者・思い出

第二章のプティ戦は [戦況別の掛け合い](../../../lib/pumpety-battle-banter.ts) を `chapterTwoBanter` から呼ぶ。[プティ戦の検査](../../../tests/pumpety-presentation.test.mjs) で通常進行中の会話・追撃動作・覆面の表情・会話の保持を確認する。

[作業別のコード案内](../code-map.md) に戻る。

舞台付き会話の最新台詞・履歴切り替えと、最後のタップ後の出発は `app/story-scenes.tsx` の `useReaderState` / `useStageExit`、動作完了は `app/story-stage-motion.ts` を参照する。操作の仕様は [会話と出発](../../art/story-stage.md#会話と出発の操作)。

1-3の取引先の人・手前の台・残りの荷は `app/story-stage-props.tsx`。小箱の置き場所と補間は `lib/story-stage-props.ts`、台詞を送ったときの位置保持と共同運搬への追従は `app/story-stage-box-motion.ts`。取引先の台詞別ポーズは `lib/story-stage-town.ts` に置く。

会話中の着座・運搬・専用動作の選択は `lib/story-stage-pose.ts`、手前を回る移動は `lib/story-stage-travel.ts`、NPCの歩行と持ち物の追従は `app/story-stage-extra-motion.ts`。台詞内の複数動作は `StageMoment` と `buildLaterStage` で組み立て、4-9の籠運びは `lib/story-stage-transplant.ts` に定義する。専用ポーズの登録は `scripts/story-stage-review-art.mjs`、縮尺・迂回・時系列の検査は `tests/story-stage-review.test.mjs`、手元高さ・支持物の重なり・受け渡しは `tests/story-stage-attachments.test.mjs` を参照する。

旅団の日常は `lib/guild-stories.ts`、解放は `lib/guild-base.ts`、在室と未読の選択は `lib/guild-presence.ts`。`app/guild-chat.tsx` が共通の `Banter` で自動再生し、`app/use-banter-completion.ts` が最後の台詞の表示時間と一時停止を扱う。既読は `story.read`、思い出での再読は `StoryReader` を共用する。生成台本は `docs/story/game-script/guild.md`。`tests/guild.test.mjs` / `tests/story-reader.test.mjs` / `tests/guild.browser.mjs` で解放・在室・既読・停止・再読・表情を確認する。

- **編集元・主要関数**: [シーンの集約](../../../lib/stories.ts) の `stories` / `availableStories` → 対象章の本文。第三章は [接続](../../../lib/chapter-three-stories.ts) から [分割ファイル](../../../lib/chapter-three-opening-stories.ts) へ。第四章は [接続](../../../lib/chapter-four-stories.ts) から [幕間〜4-3の本文](../../../lib/chapter-four-stories-1.ts)・[4-4〜4-6の本文](../../../lib/chapter-four-stories-2.ts)・[4-7〜4-8の本文](../../../lib/chapter-four-conflict-stories.ts)・[4-9〜4-10の本文](../../../lib/chapter-four-stories-3.ts) と [道中会話](../../../lib/chapter-four-banter.ts) へ。[読者](../../../app/story-scenes.tsx) は `StoryReader`、[思い出の章選択と一覧](../../../app/story-library.tsx) は `StoryLibrary`、スチルは [storyArtAt](../../../lib/story-art.ts)。マップ下の掛け合いの送りと重複防止は [掛け合いの進行](../../../lib/banter-exchange.ts) の `nextBanter`。

- **仕様**: [シナリオの案内](../../story/README.md)、[人物一覧](../../characters/README.md)、対象章の実装資料。[ゲーム内台本](../../story/game-script/README.md)（`docs/story/game-script/`）は出力。
- **会話中のミニキャラ**: [台詞別の演出](../../../lib/story-stage.ts) → [会話の直上の舞台](../../../app/story-stage.tsx)・[動作の再生](../../../app/story-stage-motion.ts)・[表示](../../../app/story-stage.css)。1-1出発話と、`lib/story-stage-evening.ts` に定義した1-2出発・達成話と、`lib/story-stage-town.ts` の1-3出発・達成話を対象にする。共通の演出型は `lib/story-stage-cues.ts`。1-4〜1-9は `lib/story-stage-chapter.ts` から塔・夜道・森・水路の各定義へ進む。小物の追従は `app/story-stage-item-motion.ts`、NPCと道具は `app/story-stage-chapter-props.tsx`。第二章〜第四章の58場面（幕間2場面を含む）は `lib/story-stage-later.ts` から各舞台の定義へ進む。第一章〜第四章の76場面で最新台詞・履歴を共用し、1-1達成話と途中で現れる既存の一枚絵は静止画を保つ。ホームの歩行・冒険の作業・会話用の表情ポーズを使い、スチルが表示される場合はスチルを優先する。[背景と荷車の素材](../../art/story-stage.md)は [配信生成](../../../scripts/build-story-stage-art.mjs) で用意する。[動作検査](../../../tests/story-stage.test.mjs)・[読者](../../../tests/story-reader.test.mjs)と、手動テストの `story-stage.browser.mjs` / `story-evening.browser.mjs` / `story-chapter.browser.mjs` / `story-later.browser.mjs` で台詞同期・早送り・画面幅・再読を確認する。
- **設定資料の地図**: [fiction-atlas](../../../.agents/skills/fiction-atlas/SKILL.md) → [地図データ](../../story/atlas/atlas.json) と [シナリオ作業の確認・更新](../../story/atlas/README.md#シナリオ作業での確認と更新)。生成器・データ検査は同スキルの `scripts/atlas.py`、検証は `scripts/test_atlas.py`。表示用HTMLとSVGは `docs/story/atlas/view/` に出力する。
- **検証**: [台詞](../../../tests/stories.test.mjs)、[読者](../../../tests/story-reader.test.mjs)、[スチル](../../../tests/story-art.test.mjs)、[掛け合いの進行](../../../tests/banter-exchange.test.mjs)、[台本](../../../tests/export-script.test.mjs)。画面幅は [手動テスト](../development.md#ローカルの手動テスト) の `dialog-layout.browser.py`、動画は `story-video.browser.mjs`。本文変更後は `npm run script:export` / `npm run script:check`。
