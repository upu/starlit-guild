# 用語集

同じものが資料・ゲーム内表示・コードで違う名前になっている箇所をまとめる。資料とコードを行き来するときの対応表として使う。

数値・条件の正はコードと各担当資料にある。ここは名前の対応だけを持ち、設定や仕様の本文は書かない。

## 章の呼び名

ゲーム内も資料も「章」で統一する。「部」は使わない。

| 呼び名 | コード | 物語の資料 | 実装の資料 |
| --- | --- | --- | --- |
| 第一章 | `lib/prologue.ts`（`prologueStages`） | [第一章プロット](story/story-part-1.md) | [第一章のゲーム実装](gameplay/prologue-gameplay.md) |
| 第二章 | `lib/chapter-two.ts`（`chapterTwoStages`） | [第二章計画](story/story-part-2.md) | [第二章のゲーム実装](gameplay/chapter-two-gameplay.md) |
| 第三章 | `lib/chapter-three.ts`（`chapterThreeStages`） | [第三章計画](story/story-part-3.md) | [第三章のゲーム実装](gameplay/chapter-three-gameplay.md) |

第一章から第三章を合わせたものが `storyStages`（`lib/prologue.ts`）。ステージの解放順・次の行先はこの並びで決まる。

## ステージとクエストID

「ステージ」は資料と画面での進行の単位、「クエスト」はその行先の実装上の単位で、1対1に対応する。ステージ番号と表示名は資料とゲーム内で同じものを使い、別名を作らない。保存に残るのはクエストIDのほう。

| 番号 | 表示名 | クエストID | 定数 | 地域 | 出発 / 達成シーンID | 担当資料 |
| --- | --- | --- | --- | --- | --- | --- |
| 1-1 | 街への交易 | `village-trade` | `TRADE_QUEST` | 街へ続く交易路 | `village-trade-departure` / `village-trade-return` | [物語](story/story-part-1.md) / [実装](gameplay/prologue-gameplay.md) |
| 1-2 | 夕暮れの帰り道 | `evening-trade-road` | `RETURN_QUEST` | 村へ戻る交易路 | `evening-trade-road-departure` / `evening-trade-road-return` | [物語](story/story-part-1.md) / [実装](gameplay/prologue-gameplay.md) |
| 1-3 | 街の配達仕事 | `town-deliveries` | `TOWN_QUEST` | 街の倉庫と商店 | `town-deliveries-departure` / `town-deliveries-return` | [物語](story/story-part-1.md) / [実装](gameplay/prologue-gameplay.md) |
| 1-4 | 丘の塔まで足を伸ばす | `tower-road` | `TOWER_QUEST` | 畑と林を抜ける丘の道 | `tower-road-departure` / `tower-road-return` | [物語](story/story-part-1.md) / [実装](gameplay/prologue-gameplay.md) |
| 1-5 | 苔灯と帰る夜道 | `moss-night-road` | `NIGHT_QUEST` | 村々へ続く夜の交易路 | `moss-night-road-departure` / `moss-night-road-return` | [物語](story/story-part-1.md) / [実装](gameplay/prologue-gameplay.md) |
| 1-6 | 森の苔を探して | `forest-wetland` | `WETLAND_QUEST` | 木陰に水の残る森の湿地 | `forest-wetland-departure` / `forest-wetland-return` | [物語](story/story-part-1.md) / [実装](gameplay/prologue-gameplay.md) |
| 1-7 | 古い水路をたどって | `old-waterway` | `WATERWAY_QUEST` | 塔の裏手の湿った斜面 | `old-waterway-departure` / `old-waterway-return` | [物語](story/story-part-1.md) / [実装](gameplay/prologue-gameplay.md) |
| 1-8 | 水の通り道を戻す仕事 | `tower-restoration` | `RESTORATION_QUEST` | 塔の古い排水路 | `tower-restoration-departure` / `tower-restoration-return` | [物語](story/story-part-1.md) / [実装](gameplay/prologue-gameplay.md) |
| 1-9 | もう一度、あの灯りを | `tower-moss-removal` | `MOSS_QUEST` | 水の引いた塔の足元 | `tower-moss-removal-departure` / `tower-moss-removal-return` | [物語](story/story-part-1.md) / [実装](gameplay/prologue-gameplay.md) |
| 2-1 | お昼を持って、あの坂へ | `hilltop-picnic` | `PICNIC_QUEST` | 昼の丘へ続く坂道 | `hilltop-picnic-departure` / `hilltop-picnic-return` | [物語](story/story-part-2.md) / [実装](gameplay/chapter-two-gameplay.md) |
| 2-2 | 月をためる草 | `moonlit-herbs` | `MOON_HERB_QUEST` | 月光の差し込む林 | `moonlit-herbs-departure` / `moonlit-herbs-return` | [物語](story/story-part-2.md) / [実装](gameplay/chapter-two-gameplay.md) |
| 2-3 | 配達の支度 | `medicine-packing` | `DELIVERY_PREP_QUEST` | 街の店先と仕事場 | `medicine-packing-departure` / `medicine-packing-return` | [物語](story/story-part-2.md) / [実装](gameplay/chapter-two-gameplay.md) |
| 2-4 | 山道の入口 | `mountain-entrance` | `MOUNTAIN_QUEST` | 山向こうへ続く道 | `mountain-entrance-departure` / `mountain-entrance-return` | [物語](story/story-part-2.md) / [実装](gameplay/chapter-two-gameplay.md) |
| 2-5 | くるくる道標 | `spinning-signpost` | `SIGNPOST_QUEST` | 道標のある分かれ道 | `spinning-signpost-departure` / `spinning-signpost-return` | [物語](story/story-part-2.md) / [実装](gameplay/chapter-two-gameplay.md) |
| 2-6 | もう一人の山賊 | `begging-golem` | `GOLEM_QUEST` | 古い作業場の手前 | `begging-golem-departure` / `begging-golem-return` | [物語](story/story-part-2.md) / [実装](gameplay/chapter-two-gameplay.md) |
| 2-7 | お菓子の通せんぼ | `sweet-blockade` | `BLOCKADE_QUEST` | 街道脇の古い作業場 | `sweet-blockade-departure` / `sweet-blockade-return` | [物語](story/story-part-2.md) / [実装](gameplay/chapter-two-gameplay.md) |
| 2-8 | 薬を待つ家々 | `waiting-households` | `HOUSE_CALLS_QUEST` | 山向こうの集落 | `waiting-households-departure` / `waiting-households-return` | [物語](story/story-part-2.md) / [実装](gameplay/chapter-two-gameplay.md) |
| 2-9 | 帰りの薬箱 | `medicine-road-home` | `MEDICINE_RETURN_QUEST` | 通行の戻った山道 | `medicine-road-home-departure` / `medicine-road-home-return` | [物語](story/story-part-2.md) / [実装](gameplay/chapter-two-gameplay.md) |
| 3-1 | 隣の席の聞き上手 | `berne-road` | `BERNE_QUEST` | ベルネへの街道 | `berne-road-departure` / `berne-road-return` | [物語](story/story-part-3.md) / [実装](gameplay/chapter-three-gameplay.md) |
| 3-2 | 石を敷いた街 | `berne-house-calls` | `BERNE_CALLS_QUEST` | ベルネの石畳と往診先 | `berne-house-calls-departure` / `berne-house-calls-return` | [物語](story/story-part-3.md) / [実装](gameplay/chapter-three-gameplay.md) |
| 3-3 | 抜けた石の行き先 | `missing-keystone` | `STONE_TRACE_QUEST` | 塔へ続く古い石組み | `missing-keystone-departure` / `missing-keystone-return` | [物語](story/story-part-3.md) / [実装](gameplay/chapter-three-gameplay.md) |
| 3-4 | 庭を照らす買い物 | `riverside-manor` | `MANOR_QUEST` | 川向こうの屋敷 | `riverside-manor-departure` / `riverside-manor-return` | [物語](story/story-part-3.md) / [実装](gameplay/chapter-three-gameplay.md) |
| 3-5 | 同じ灯りを探して | `matching-lantern-stone` | `REPLACEMENT_QUEST` | 石工の資材置き場 | `matching-lantern-stone-departure` / `matching-lantern-stone-return` | [物語](story/story-part-3.md) / [実装](gameplay/chapter-three-gameplay.md) |
| 3-6 | 四人で下見 | `manor-survey` | `REHEARSAL_QUEST` | 屋敷の庭と作業通路 | `manor-survey-departure` / `manor-survey-return` | [物語](story/story-part-3.md) / [実装](gameplay/chapter-three-gameplay.md) |
| 3-7 | 灯りのお披露目 | `garden-reception` | `RECEPTION_QUEST` | 客を迎える屋敷の庭 | `garden-reception-departure` / `garden-reception-return` | [物語](story/story-part-3.md) / [実装](gameplay/chapter-three-gameplay.md) |
| 3-8 | 間違った荷物を戻す夜 | `keystone-night-road` | `STONE_RETURN_QUEST` | 橋へ続く夜の街道 | `keystone-night-road-departure` / `keystone-night-road-return` | [物語](story/story-part-3.md) / [実装](gameplay/chapter-three-gameplay.md) |
| 3-9 | 戻る灯り、増える同行者 | `berne-restoration` | `BERNE_RESTORATION_QUEST` | ベルネの塔の足元 | `berne-restoration-departure` / `berne-restoration-return` | [物語](story/story-part-3.md) / [実装](gameplay/chapter-three-gameplay.md) |

クエスト一覧のカードは小見出しに番号、太字に表示名を出す。ヒントは「番号 表示名 · 物語の題」の形（例：`1-4 丘の塔まで足を伸ばす · 少し見に行こう`）。物語の題（`stage.title`）はその回の読み物の見出しで、行先の名前ではない。

## シーンID

物語のシーンIDはクエストIDから決まる。

| 種類 | ID | 出るところ |
| --- | --- | --- |
| 出発前 | `<クエストID>-departure` | 「出発」を押したあと、冒険が始まる前 |
| 達成後 | `<クエストID>-return` | 15地点を走り終えたあと |

例：`village-trade-departure` / `village-trade-return`。スチルの対応は `lib/story-art.ts` がシーンIDをキーに持ち、場面と表示行は [スチル制作記録](art/story-art.md)、採用画像は [スチル一覧](art/story-art-gallery.md) にある。

## 第三章の先行会話

先行会話の仮IDは保存には使用しない。本編でのIDは上のステージ表へ統合した。[生成台本](generated/chapter-three.md)は幕間を含む読み順で確認できる。

## 幕間

「私が用意するお昼」のシーンIDは `interlude-walnut-lunch`、種類は `interlude`。2-9読了で解放し、読了すると3-1が開く。冒険・報酬・クエストIDは持たず、既読は通常の `story.read` に保存する。思い出では2-9と3-1の間に並ぶ。

## 従来モードの旧クエストID

以下は削除済みの試作で使ったIDの記録で、現在の `allQuests` には含まれない。旧通常依頼9件の出典は [削除前の `lib/game-v1.ts`](https://github.com/upu/starlit-guild/blob/69c76b9/lib/game-v1.ts)、来客依頼2件の出典は [削除前の `lib/game.ts`](https://github.com/upu/starlit-guild/blob/69c76b9/lib/game.ts)、加入専用依頼7件の出典は [削除前の `lib/recruitment.ts`](https://github.com/upu/starlit-guild/blob/69c76b9/lib/recruitment.ts)。遊び方と会話は [従来モードの記録](archive/legacy-mode.md)、旧加入条件は [仲間加入](archive/recruitment.md) を参照する。

| 旧クエストID | 表示名 | 区分 |
| --- | --- | --- |
| `herbs` | 月しずく草の採取 | 通常依頼 |
| `cart` | パン屋の荷馬車 | 通常依頼 |
| `slime` | 畑を荒らすスライム | 通常依頼 |
| `crystal` | 青晶石の採掘 | 通常依頼 |
| `pilgrim` | 星見の巡礼団 | 通常依頼 |
| `wolf` | 霧狼の群れ | 通常依頼 |
| `blossom` | 千年樹の花 | 通常依頼 |
| `royal` | 王女の秘密の旅 | 通常依頼 |
| `dragon` | 古塔の星喰い竜 | 通常依頼 |
| `midnight-snack` | その耳はおやつじゃない | 来客依頼 |
| `puppet-midnight` | 消灯、人形たちの時間 | 来客依頼 |
| `join-mira` | 夜明けを待つ往診 | 加入専用依頼 |
| `join-chacha` | 天使は岩を持ち上げる | 加入専用依頼 |
| `join-finn` | 小箱を持ち主のもとへ | 加入専用依頼 |
| `join-garr` | 最後のひとりが渡るまで | 加入専用依頼 |
| `join-luna` | 消えた星座の観測所 | 加入専用依頼 |
| `join-poppy` | 枯れない庭の作り方 | 加入専用依頼 |
| `join-noel` | まだ名前のない旅の歌 | 加入専用依頼 |

## キャラクターID

人物の名前・別名・IDは [キャラクター一覧](characters/README.md) が正本。ここには写さない。個別資料は `docs/characters/<キャラID>.md`。

## よく出る言葉

| 言葉 | 意味 | コード上の名前 |
| --- | --- | --- |
| 物語モード | 現在の遊び方。章立てのステージを順に進む | `state.prologue === true`（`inPrologue`） |
| 従来モード | 章立てにする前の試作。[削除済み](gameplay/gameplay.md#従来モードの扱い) | （なし） |
| 記録 | プレイヤーのセーブ1件。画面では「冒険の記録」 | `Profile` / `State` |
| 隊 | 冒険に出るメンバーのまとまり。現在は1つだけ | `Squad` |
| 地点 | 1周15回ある移動・戦闘・採取の単位 | `run.node` |
| 区間 | 3地点ごとの報酬のまとまり | `reward()` の `portions` |
| 周回 | 同じクエストを続けて走ること | `run.round` / `squad.repeat` |
| 絆 | ペアで区間を進むと育つ値。連携技と会話が変わる | `state.friendship` / `bondLevel` |
| 技 | レベルとコインで習得し、枠にセットする強化 | `state.techniques` |
| 掛け合い | 冒険中にタップで読める短いやり取り | `journeyBanter` |
| 思い出 | 読んだ物語とスチルの一覧画面 | `availableStories` / `storyProgress` |

## 置き場の対応

| 扱うもの | ファイル |
| --- | --- |
| 章のステージ定義、解放条件、次の行先 | `lib/prologue.ts`、`lib/chapter-two.ts` |
| クエストの数値、進行、報酬、行動 | `lib/game.ts` |
| 物語の本文と掛け合い | `lib/prologue-stories.ts`、`lib/chapter-two-stories.ts`、`lib/stories.ts` |
| スチルの対応と表示行 | `lib/story-art.ts` |
| 保存形式と検証 | `lib/save-format.ts` |
| 仲間の基本データと絆 | `lib/roster.ts` |

この表と実装の対応は `tests/glossary.test.mjs` が確認する。ステージを増やすときは、コードと同じ順・同じIDでこの表にも1行足す。
