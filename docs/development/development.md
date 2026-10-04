# 開発と運用

現行ゲームの開発、検証、公開に関する横断的な注意をまとめる。機能固有の仕様は、それぞれの資料とソースコードを正とする。

## 開発コマンド

Node.js は [`package.json`](../../package.json) の `devEngines.runtime` の版を使う。GitHub Actions も同じ欄を読むため、資料には版の数字を書かない。版が合わないと `npm ci` / `npm install` が `EBADDEVENGINES` で止まる。Dependabot が `@types/node` のメジャー版を上げると `tests/node-version.test.mjs` が失敗するので、それを Node 本体を上げる合図とし、同じPRで `devEngines.runtime.version` を揃える。見送る版（LTSにならない奇数版など）は、そのPRに `@dependabot ignore this major version` とコメントして閉じる。

依存パッケージのインストールスクリプトは、npm 11 以降では `package.json` の `allowScripts` に載せたものだけが実行される。新しく警告が出たら `npm install-scripts ls` で内容を確認し、必要なものだけ `npm install-scripts approve <pkg> --no-allow-scripts-pin` で追加する。

```bash
npm run dev
npm run build
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run script:export
npm run script:check
npm run images:optimize
npm run images:check
npm run road-art:optimize
npm run road-art:check
npm run videos:optimize
npm run videos:check
node --test tests/*.test.mjs
npx tsc --noEmit
```

`npm run dev` はローカル開発、`npm run build` は公開用ビルド。テストは新旧シミュレーション、移行、セーブ形式などを含む。

開発サーバーはLANからの接続も受け付ける。PCでは `http://localhost:5173/`、同じWi-Fiのスマホでは `http://<PCのLAN内IPv4アドレス>:5173/` を開く。Windowsでは `ipconfig` のWi-Fi欄でIPv4アドレスを確認できる。PCのIPアドレスが変わった場合は接続先も変更する。

接続できない場合は、PCのファイアウォールでプライベートネットワークのNode.jsへの接続が許可されているか、Wi-Fiの端末間通信が制限されていないかを確認する。開発サーバーは信頼できるLANでのみ起動し、ルーターのポート開放は不要。PC自身だけに制限する場合は `npm run dev -- --hostname 127.0.0.1` を使う。

セーブは端末・ブラウザー・接続先アドレスごとに別になる。PCの続きで遊ぶ場合はセーブファイルの書き出し・読み込みを使う。LANのHTTPでも端末保存は利用できる。

`script:export` は実行時の会話・スチル表示位置・道中の掛け合いを章ごとのファイルへ遊ぶ順に書き出し、[ゲーム内台本の目次](../story/game-script/README.md) から章・ステージへ読めるようにする。幕間は解放される位置（`lib/interludes.ts` の `before`）に置く。各シーンには本文の編集元、必要なID接続元・スチル定義へのリンクを付ける。スチルは表示行の直前に画像も埋め込み、Markdownプレビューで確認できる。待機中や関係値別の共通会話は [共通の掛け合い](../story/game-script/banter.md) にまとめる。生成物は手で編集せず、会話やスチルを変更したら再生成する。`script:check` は全ファイルの鮮度を検査し、CIでも実行する。

dev / buildの開始時に、[背景PNGから用途別WebPを生成](../art/scenery-images.md)し、[横スクロール戦闘のPNG原本からロスレスWebPを生成](../gameplay/scrolling-battle.md)、[元動画から配信用MP4を生成](../art/story-videos.md)する。変更のない素材はスキップする。

## テスト機能の環境設定

Sitesの実行時環境変数に `ENABLE_TEST_TOOLS=true` を設定したサイトだけ、テスト用記録の作成と達成ステージ・レベル・所持金の調整を利用できる。未設定、空文字、`false`、`TRUE`、`1`、前後に空白のある値はすべて無効。サイトを閲覧できる全員に適用される設定なので、確認用サイトの閲覧範囲はSites側で管理する。

サーバーがページを開くたびに設定を読み、画面と操作処理の両方へ反映する。設定を変更したらSites側で実行環境への反映を完了し、ページを再読み込みする。開いたままの画面への即時切り替えは行わない。ビルド時の `VITE_*` / `NEXT_PUBLIC_*`、URLのクエリ、端末セーブの `test` フラグは有効化の設定に使わない。

`npm run dev` はテスト機能を標準で有効にする。`vite.config.ts` の開発サーバー用設定として管理するため、新しいチェックアウトでも追加設定なしで有効になる。通常モードを確認するときは `.env.example` を `.env` へコピーし、`ENABLE_TEST_TOOLS=false` にして開発サーバーを起動し直す。公開用ビルドにはこの開発用の既定値を含めず、Sitesでは実行時環境変数の設定に従う。

無効化しても既存の通常・テスト記録、ファイル読み込み、クラウド復元は保持する。復元したテスト記録でも数値調整はできない。この設定はゲームが提供するテスト機能の切り替えであり、端末保存やセーブファイルの直接改造を防ぐ仕組みではない。

テスト機能のHTTP検証は[手動テスト](#ローカルの手動テスト)を参照する。

## PRごとのゲームバージョン

ゲームの表示バージョンは `package.json` の `x.y.z` を正本とし、スタート画面にも同じ値を表示する。PRではテンプレートのバージョン判定を必ずどちらか一方だけ選ぶ。

- ゲーム本体の動作・表示・音・遊べる内容・セーブ仕様が変わる場合は `game-change` とし、`npm run version:patch` で `z` を1つ上げる。実装済みの会話やシナリオ、実際に表示・再生される素材の変更も含む。
- リファクタリング、テスト、開発設定、設定資料、シナリオ検討など、プレイヤーが触れるゲーム本体が変わらない場合は `no-game-change` とし、バージョンを変えない。

GitHub ActionsはPR本文の選択と、PRの `package.json` / `package-lock.json` を `main` と比較する。Dependabotが依存パッケージまたはGitHub Actionsの定義だけを変更したPRは、本文に判定欄がなければ `no-game-change` として扱う。それ以外のPRは本文での選択が必要。`game-change` は `main` のパッチ版ちょうど +1、`no-game-change` は同値でなければ失敗する。先行PRのマージで `main` のバージョンが変わった場合は、最新の `main` を取り込んでから判定とパッチ版を確認する。

通常PRの判定は本文から読むため、作業中に判定が変わったときは**本文を直してから**版を合わせる。失敗したジョブの再実行は元のイベントの本文を読み直すだけで、直した本文は反映されない。本文の編集自体が新しい検査を動かすので、編集後の実行結果を見る。Dependabotの定期更新と同時PR数は [設定ファイル](../../.github/dependabot.yml) で管理し、更新PRは自動マージしない。

バージョン更新やPRマージ自体ではSitesへ自動配備されない。マージ後に反映を続ける条件は [共通ルールの公開先](../agent-rules.md#公開先) に従う。

### マイナー版を上げる契機

`x.y` は開発中の章を表す。前の章を本番へ公開し終え、次の章の開発を始めるPRで `y` を1つ上げ、`z` を0へ戻す。第一章の公開後に `0.1.22` から `0.2.0` へ上げた前例と同じ扱いで、`0.2.x` は第二章の開発期間を指す。

- 契機は「前の章の本番公開の完了」と「次の章の開発開始」が揃ったときだけ。章の実装完了やプレビュー反映だけでは上げない。
- そのPRはテンプレートの `minor-release` を選ぶ。`game-change` / `no-game-change` の判定はそれとは別に、そのPR自体の内容で選ぶ。版だけを進める資料・計画のPRは `no-game-change` + `minor-release` になる。
- 版を上げる操作は `npm run version:minor`。`minor-release` を選ばずにマイナー版を変えるとCIが失敗する。
- メジャー版を上げる規則は未設定。必要になったPRで、この節と `scripts/check-pr-version.mjs` を合わせて更新する。

### 変更履歴

バージョンを上げたPRは [`CHANGELOG.md`](../../CHANGELOG.md) へその版の1行を足す。PRタイトルと番号をそのまま転記し、版の順に並べる。`no-game-change` でバージョンが変わらないPRは記載しない。

`scripts/check-pr-version.mjs` は、`main` と版が変わるPRで、その版の番号が `CHANGELOG.md` に現れなければ失敗する。ファイルを触っただけでは通らない。不具合の個別履歴や検討の経緯はここへ積まず、IssueとGit履歴へ残す。

### コード品質

整形はPrettier（[設定](../../.prettierrc.json)、印字幅100）で行い、`npm run format` で全体を整える。取り込み済みUI・生成物・Markdownなどの除外範囲は [.prettierignore](../../.prettierignore) を正とする。コードを圧縮した1行書きには戻さず、関数長・ファイル長の上限が実際の行数で働くようにする。

Lintは型情報付きのstrictルールと、複雑度・関数長・ファイル長の上限をerrorとして扱う。具体的な制限と除外は [eslint.config.mjs](../../eslint.config.mjs) を正とする。`components/ui` と `hooks/use-mobile.ts` は取り込み元の形を維持するため一部ルールの対象外であり、分割待ちの一時的な除外ではない。`lint`と`lint:fix`はいずれもwarningが1件でも残ると失敗する。`lint:fix`の適用後は差分とテストを確認する。

Pull Requestと`main`へのpushでは、整形・lint・型・生成素材と台本の鮮度・全ユニットテストを検査する。実行コマンドの正本は [lint.yml](../../.github/workflows/lint.yml)、PRのバージョン判定は [pr-version.yml](../../.github/workflows/pr-version.yml)。ブラウザーテストとビルド後のHTTP検証はCIに含めず、[手動テスト](#ローカルの手動テスト)として実行する。

## 実装の分担

冒険と旅団の描画はPhaserを使う。キャラクター、会話、設定などはReact側で扱い、進行・保存の判定を描画ループへ重複実装しない。

- [Phaser冒険画面](phaser-adventure.md) — 描画構成と検証範囲
- [ゲームプレイ仕様](../gameplay/gameplay.md) — プレイヤーから見える現行挙動
- [セーブシステム](../gameplay/save-system.md) — 保存、復元、互換性
- [音楽と効果音](../art/audio.md) — BGMと効果音

## スマホUI

画面ごとの入口と操作は [ゲームプレイ仕様](../gameplay/gameplay.md#起動と画面) にまとめる。通常画面では縦スクロールを抑え、長い設定やログはダイアログ内、収まらない説明はカード内、高さのない画面では内容部分をスクロールする。

主要なタップ領域は44px以上を基本とする。下部ナビは画面下端まで配置し、iPhoneのホームインジケータに必要な余白を重複して確保しない。

ホーム画面から起動したiOSでは、動的ビューポート単位だけに頼らず、実際のウィンドウの高さも考慮する。端末の「動きを減らす」設定では強い動きを省く。

## 案内と進行UI

上部のヒントは、既存のv4記録から現在の案内を導出する。案内のためだけに追加の進行フラグや報酬を保存しない。

初達成、レベルアップ、ステージ解放、ミラの加入、区間報酬の通知で自動周回を止めない。

## 検証

### ローカルの手動テスト

以下の手動テストは `node --test tests/*.test.mjs` の対象外。変更した機能に合う行だけローカルで実行する。PR前の共通検証は [コード品質](#コード品質) に従う。CIの `npm run manual-tests:check` はこの一覧と実在ファイルの一致だけを検査し、ブラウザーテストや章の通し試走を実行しない。リポジトリのルートで `npm run install:ci`（または通常の依存関係のインストール）を済ませる。

<!-- manual-test-inventory:start -->
| テスト・対象 | 依存と準備 | PowerShellでの実行 | 結果の確認先 |
| --- | --- | --- | --- |
| `tests/guild.browser.mjs` 旅団のPhaser描画・椅子での飲茶と歩行・栽培地切替・動きを減らす設定・高解像度・商品棚と作業台メニュー・植え付け・固定順の下部バー・現地の担当アイコン・作業台の動作・成長表示・留守中の復帰・在室条件による自動会話と停止・表情 | Node版Playwright + Chromium。別ターミナルで `npm run dev`。独立したテスト記録で確認 | `node tests/guild.browser.mjs` | `work/guild-browser/` の画像・`results.json` |
| `tests/home-room.browser.mjs` ドット絵調の5人・茶席・作業・菜園・家具配置・静止・再試行 | Node版Playwright + Chromium。テスト機能ONの開発サーバー | `$env:TEST_ROOT='http://localhost:5173'; node tests/home-room.browser.mjs` | `work/pixel-home/` の320/390/844/1000px画像、歩行コマ一覧、寸法記録。スマホ実機とは別 |
| `tests/quest-picker.browser.mjs` 行先選択・設定・画面幅 | Node版Playwright + Chromium。`npm run build`。テスト自身が部品を組み立てて一時サーバーを起動 | `node tests/quest-picker.browser.mjs` | `work/quest-picker-browser/` の画像・`results.json` |
| `tests/story-video.browser.mjs` 再生・停止・再視聴・代替表示 | Node版Playwright + Chromium。`npm run build`。テスト自身の部品fixtureと一時サーバー | `node tests/story-video.browser.mjs` | `work/story-video-browser/` の画像、終了表示 |
| `tests/character-panel.browser.mjs` 人物画面・装備候補・スキル・消耗品の購入/登録/通知・画面幅 | Node版Playwright + Chromium。`npm run build`。テスト自身の部品fixtureと一時サーバー | `node tests/character-panel.browser.mjs` | `work/character-browser/` の画像、終了表示 |
| `tests/dialog-layout.browser.py` 会話・ダイアログの画面幅、回転、安全領域 | Python版Playwright + ChromiumまたはWebKit。`npm run build`。生成CSSを使う独立fixture。外部サーバー不要 | `python tests/dialog-layout.browser.py --engine chromium`（WebKitは `--engine webkit`） | 成功時のケース数、失敗時の測定値を標準出力 |
| `tests/chapter-road.browser.mjs` 道中演出・Canvas・再読み込み・画像失敗 | Node版Playwright + Chromium。別ターミナルで `npm run dev`。起動済みゲームに接続、ビルド不要 | `node tests/chapter-road.browser.mjs` | `work/chapter-road-browser/` の画像・`results.json` |
| `tests/chapter-three.browser.mjs` 第三章の幕間→出発・各ステージ・ショップ | Node版Playwright + Chromium。別ターミナルで `npm run dev`。起動済みゲームに接続、ビルド不要 | `node tests/chapter-three.browser.mjs` | `work/chapter-three-browser/` の画像・`result.json` |
| `tests/chapter-four.browser.mjs` 第四章の幕間・初回出発・リコとメリルの対立・五人表示 | Node版Playwright + Chromium。別ターミナルで `npm run dev`。独立したテスト記録で確認 | `node tests/chapter-four.browser.mjs` | `work/chapter-four-browser/` の画像・`result.json` |
| `tests/chapter-runs.balance.mjs` 第一章〜第四章の通し試走・章間の状態継続 | Nodeのみ。準備不要。約45秒 | `node --test tests/chapter-runs.balance.mjs` | 標準出力の5件のPASS表示 |
| `tests/test-tools.integration.mjs` テスト機能の環境変数切り替え | Nodeのみ。`npm run build`。テスト自身が一時ローカルWorkerを起動 | `node tests/test-tools.integration.mjs` | 標準出力の7条件のPASS表示 |
| `tests/api-backup.integration.mjs` バックアップAPIの往復・隔離・不正入力 | Nodeのみ。`npm run build` → ローカルD1初期化 → 別ターミナルで `npm start` | `$env:TEST_ROOT='http://127.0.0.1:8787'; node tests/api-backup.integration.mjs` | 標準出力のPASS表示、ローカルD1（`.wrangler/state`） |
| `tests/road-worksites.browser.mjs` 全章の作業地点画像19種類 | Node版Playwright + Chromium。別ターミナルで `npm run dev`。独立したテスト記録で確認 | `node tests/road-worksites.browser.mjs` | `work/worksite-browser/` の画像・`result.json` |
| `tests/home-walk-study.browser.mjs` 共通歩行見本の再生・停止・コマ送り・小表示・5人の同期比較 | Node版Playwright + Chromium。テスト機能ONの開発サーバー | `node tests/home-walk-study.browser.mjs` | `work/pixel-home/walk-study/` の見本一覧・5人の比較・画面画像 |
| `tests/home-tea-study.browser.mjs` お茶と会話の共通見本・片手の飲茶・座位・再生停止・姿勢送り・減らす設定 | Node版Playwright + Chromium。テスト機能ONの開発サーバー | `node tests/home-tea-study.browser.mjs` | `work/pixel-home/tea-study/` の4姿勢と320/390/844/1000px画像。スマホ実機とは別 |
| `tests/home-work-study.browser.mjs` 作業台の共通見本・5人の実素材・左右の手・4姿勢・再生停止・補間・減らす設定 | Node版Playwright + Chromium。テスト機能ONの開発サーバー | `node tests/home-work-study.browser.mjs` | `work/pixel-home/work-study/` の左右4姿勢・5人の作業台・事務机との比較・320/390/844/1000px画像。スマホ実機とは別 |
| `tests/home-garden-study.browser.mjs` 菜園の共通見本・5人の水やり・左右4姿勢・再生停止・減らす設定 | Node版Playwright + Chromium。テスト機能ONの開発サーバー | `node tests/home-garden-study.browser.mjs` | `work/pixel-home/garden-study/` の左右4姿勢・5人の水やりと菜園・320/390/844/1000px画像。保存への書込なし。スマホ実機とは別 |
<!-- manual-test-inventory:end -->

Node版Playwrightは通常の依存関係には含まれない。必要なときだけ `npm install --no-save --package-lock=false playwright` と `npx playwright install chromium` で用意する。既に別の場所へ入れた場合はPowerShellで `$env:PLAYWRIGHT_MODULE='C:\絶対パス\node_modules\playwright'`、`$env:CHROME_PATH='C:\絶対パス\chrome.exe'` を指定できる。Python版は別途 `python -m pip install playwright` と `python -m playwright install chromium webkit` が必要で、`--executable` でブラウザー実行ファイルを指定できる。Pythonテストは生成CSSと `components/ui/dialog.tsx` のクラスを組み合わせた独立fixtureで、`--css` はビルドできない場合の独立fixture専用。部品fixtureの3本もゲーム全体へ接続するテストではない。

道中演出と第三章の2本は起動中のゲームへ接続する。`TEST_ROOT` の既定は `http://localhost:5173`。開発サーバーの実際のポートが違う場合は、実行前に `$env:TEST_ROOT='http://localhost:<実際のポート>'` を設定する。道中演出の対象を絞るなら `$env:TEST_SCENES='cargo,touch'` のように指定できる。どちらも隔離したブラウザーと合成セーブを使い、利用者のセーブは変更しない。公開サイトには向けない。

バックアップAPIだけは、**`npm start` の前に**同じローカル状態（`.wrangler/state`）のD1へ `drizzle/0000_organic_secret_warriors.sql`、`0001_abandoned_enchantress.sql`、`0002_complete_firelord.sql` を番号順に適用する。例（各コマンドを順に実行）:

```bash
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute site-creator-d1 --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_organic_secret_warriors.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute site-creator-d1 --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_abandoned_enchantress.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute site-creator-d1 --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_complete_firelord.sql
npm start
```

`npm start` の起動URLを確認し、別ターミナルから表の `TEST_ROOT` をそのURLに合わせて実行する。`npm start` の既定は `http://127.0.0.1:8787` で、テスト側の既定5173とは異なる。既存のローカルD1へ同じSQLを重複適用しない（新しい検証用状態で始める場合だけ初期化する）。公開先のD1には適用しない。`work/` と `.wrangler/` はGit管理対象外なので、失敗時のログ・スクリーンショットはローカルで確認し、必要なものだけ共有する。ブラウザー幅の検査はスマホ実機確認の代わりにはならない。

自動テストに加え、次は実機確認が必要な項目として扱う。

- iPhone / Androidでのインストールとホーム画面起動
- 文字拡大時のレイアウト
- 画面ロック、バックグラウンド、通信断からの復帰
- 長時間使用時の発熱と描画負荷
- BGMの聴感、ループ境界、長時間再生

不具合の個別履歴はREADMEへ追記せず、IssueやGit履歴へ残す。回帰が重要な不具合は再発防止テストを追加する。

## Issue運用

継続開発は、不具合・機能ごとにIssueを1件、作業タスクも1つの目的に絞る。Issueには目的、完成条件、セーブ互換性、確認結果を記載する。

仕様が恒常的なものなら、READMEへ積まず、担当する `docs/` とソースへ反映する。

## 公開

反映の要否・宛先・依頼による制限は [共通ルールの公開先](../agent-rules.md#公開先) に従う。本番配備の最終承認はPRマージ承認と分ける。

Gitの `origin` はGitHubの非公開リポジトリ、`sites` はSites専用リポジトリ。GitHubへのpushだけではゲームは更新されない。

公開先の検査、サイトごとの配信用コミット、第一章の確認表、環境設定と結果の記録方法は [サイトの確認と公開](site-release.md) を参照する。Codex の操作手順は [Codex の作業手順](codex.md) から [starlit-publish](../../.agents/skills/starlit-publish/SKILL.md) へ進む。

## データベース

Drizzleの適用済みマイグレーションは変更せず、変更は新しいマイグレーションとして追加する。

バックアップ用テーブルと旧形式の扱いは [セーブシステム](../gameplay/save-system.md) を参照する。
