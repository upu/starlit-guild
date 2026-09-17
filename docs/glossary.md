# 用語集

同じものが資料・ゲーム内表示・コードで違う名前になっている箇所をまとめる。資料とコードを行き来するときの対応表として使う。

数値・条件の正はコードと各担当資料にある。ここは名前の対応だけを持ち、設定や仕様の本文は書かない。

## 章の呼び名

| ゲーム内表示 | 資料での呼び名 | コード | 物語の資料 | 実装の資料 |
| --- | --- | --- | --- | --- |
| 第一部 | 第一章 | `lib/prologue.ts`（`prologueStages`） | [第一部プロット](story-part-1.md) | [第一章のゲーム実装](prologue-gameplay.md) |
| （表示なし） | 第二章 | `lib/chapter-two.ts`（`chapterTwoStages`） | [第二章計画](story-part-2.md) | [第二章のゲーム実装](chapter-two-gameplay.md) |

第一章と第二章を合わせたものが `storyStages`（`lib/prologue.ts`）。ステージの解放順・次の行先はこの並びで決まる。

## ステージとクエストID

「ステージ」は資料と画面での進行の単位、「クエスト」はその行先の実装上の単位で、1対1に対応する。保存に残るのはクエストIDのほう。

| ステージ | 表示名 | クエストID | 定数 | 地域 |
| --- | --- | --- | --- | --- |
| 1-1 交易路（昼） | 街への交易 | `village-trade` | `TRADE_QUEST` | 街へ続く交易路 |
| 1-2 交易路（夕） | 夕暮れの帰り道 | `evening-trade-road` | `RETURN_QUEST` | 村へ戻る交易路 |
| 1-3 街の仕事 | 街の配達仕事 | `town-deliveries` | `TOWN_QUEST` | 街の倉庫と商店 |
| 1-4 塔への道 | 丘の塔へ寄り道 | `tower-road` | `TOWER_QUEST` | 畑と林を抜ける丘の道 |
| 1-5 帰り道（夜） | 苔灯と帰る夜道 | `moss-night-road` | `NIGHT_QUEST` | 村々へ続く夜の交易路 |
| 1-6 森の湿地 | 森の苔を探して | `forest-wetland` | `WETLAND_QUEST` | 木陰に水の残る森の湿地 |
| 1-7 古い水路 | 古い水路をたどって | `old-waterway` | `WATERWAY_QUEST` | 塔の裏手の湿った斜面 |
| 1-8 水路の修理 | 水の通り道を戻す仕事 | `tower-restoration` | `RESTORATION_QUEST` | 塔の古い排水路 |
| 1-9 増えすぎた苔 | もう一度、あの灯りを | `tower-moss-removal` | `MOSS_QUEST` | 水の引いた塔の足元 |
| 2-1 お昼を持って、あの坂へ | お昼を持って、あの坂へ | `hilltop-picnic` | `PICNIC_QUEST` | 昼の丘へ続く坂道 |
| 2-2 月をためる草 | 月をためる草 | `moonlit-herbs` | `MOON_HERB_QUEST` | 月光の差し込む林 |
| 2-3 配達の支度 | 配達の支度 | `medicine-packing` | `DELIVERY_PREP_QUEST` | 街の店先と仕事場 |
| 2-4 山道の入口 | 山道の入口 | `mountain-entrance` | `MOUNTAIN_QUEST` | 山向こうへ続く道 |
| 2-5 くるくる道標 | くるくる道標 | `spinning-signpost` | `SIGNPOST_QUEST` | 道標のある分かれ道 |
| 2-6 もう一人の山賊 | もう一人の山賊 | `begging-golem` | `GOLEM_QUEST` | 古い作業場の手前 |
| 2-7 お菓子の通せんぼ | お菓子の通せんぼ | `sweet-blockade` | `BLOCKADE_QUEST` | 街道脇の古い作業場 |
| 2-8 薬を待つ家々 | 薬を待つ家々 | `waiting-households` | `HOUSE_CALLS_QUEST` | 山向こうの集落 |
| 2-9 帰りの薬箱 | 帰りの薬箱 | `medicine-road-home` | `MEDICINE_RETURN_QUEST` | 通行の戻った山道 |

第一章はステージ名と表示名が別で、第二章は同じにしている。第一章の「1-1 交易路（昼）」のようなラベルはクエスト一覧と次の行先の案内に出る。

## シーンID

物語のシーンIDはクエストIDから決まる。

| 種類 | ID | 出るところ |
| --- | --- | --- |
| 出発前 | `<クエストID>-departure` | 「出発」を押したあと、冒険が始まる前 |
| 達成後 | `<クエストID>-return` | 15地点を走り終えたあと |

例：`village-trade-departure` / `village-trade-return`。スチルの対応は `lib/story-art.ts` がシーンIDをキーに持ち、場面と表示行は [スチル制作記録](story-art.md)、採用画像は [スチル一覧](story-art-gallery.md) にある。

## キャラクターID

人物の名前・別名・IDは [キャラクター一覧](characters/README.md) が正本。ここには写さない。個別資料は `docs/characters/<キャラID>.md`。

## よく出る言葉

| 言葉 | 意味 | コード上の名前 |
| --- | --- | --- |
| 物語モード | 現在の遊び方。章立てのステージを順に進む | `state.prologue === true`（`inPrologue`） |
| 従来モード | 章立てにする前の試作。[削除済み](gameplay.md#従来モードの扱い) | （なし） |
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
