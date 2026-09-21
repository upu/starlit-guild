# 開発と運用

現行ゲームの開発、検証、公開に関する横断的な注意をまとめる。機能固有の仕様は、それぞれの資料とソースコードを正とする。

## 開発コマンド

Node.js 22.13.0 以上。

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

`script:export` は実行時の会話・スチル表示位置・道中の掛け合いをステージごとのファイルへ書き出し、[生成台本の目次](../generated/script.md) から読めるようにする。スチルは表示行の直前に画像も埋め込み、Markdownプレビューで確認できる。待機中や関係値別の共通会話は [共通の掛け合い](../generated/banter.md) にまとめる。生成物は手で編集せず、会話やスチルを変更したら再生成する。`script:check` は全ファイルの鮮度を検査し、CIでも実行する。

dev / buildの開始時に、[背景PNGから用途別WebPを生成](../art/scenery-images.md)し、[横スクロール戦闘のPNG原本からロスレスWebPを生成](../gameplay/scrolling-battle.md)、[元動画から配信用MP4を生成](../art/story-videos.md)する。変更のない素材はスキップする。

## テスト機能の環境設定

Sitesの実行時環境変数に `ENABLE_TEST_TOOLS=true` を設定したサイトだけ、テスト用記録の作成と達成ステージ・レベル・所持金の調整を利用できる。未設定、空文字、`false`、`TRUE`、`1`、前後に空白のある値はすべて無効。サイトを閲覧できる全員に適用される設定なので、確認用サイトの閲覧範囲はSites側で管理する。

サーバーがページを開くたびに設定を読み、画面と操作処理の両方へ反映する。設定を変更したらSites側で実行環境への反映を完了し、ページを再読み込みする。開いたままの画面への即時切り替えは行わない。ビルド時の `VITE_*` / `NEXT_PUBLIC_*`、URLのクエリ、端末セーブの `test` フラグは有効化の設定に使わない。

第三章の会話試読 `/story-preview/chapter-three` も同じ設定で有効になる。無効時は直接アクセスも404となる。試読はセーブを読み書きせず、記録画面のテスト欄から開ける。会話の実装範囲は[第三章の会話先行実装](../gameplay/chapter-three-gameplay.md)を参照する。

ローカルも初期状態では無効。必要な場合だけ `.env.example` を `.env` へコピーして `ENABLE_TEST_TOOLS=true` にし、開発サーバーを起動し直す。ローカルの `.env` とSitesの環境変数は別設定であり、ローカルでの有効化を公開先へ持ち込まない。

無効化しても既存の通常・テスト記録、ファイル読み込み、クラウド復元は保持する。復元したテスト記録でも数値調整はできない。この設定はゲームが提供するテスト機能の切り替えであり、端末保存やセーブファイルの直接改造を防ぐ仕組みではない。

テスト機能のHTTP検証は[手動テスト](#ローカルの手動テスト)を参照する。

## PRごとのゲームバージョン

ゲームの表示バージョンは `package.json` の `x.y.z` を正本とし、スタート画面にも同じ値を表示する。PRではテンプレートのバージョン判定を必ずどちらか一方だけ選ぶ。

- ゲーム本体の動作・表示・音・遊べる内容・セーブ仕様が変わる場合は `game-change` とし、`npm run version:patch` で `z` を1つ上げる。実装済みの会話やシナリオ、実際に表示・再生される素材の変更も含む。
- リファクタリング、テスト、開発設定、設定資料、シナリオ検討など、プレイヤーが触れるゲーム本体が変わらない場合は `no-game-change` とし、バージョンを変えない。

GitHub ActionsはPR本文の選択と、PRの `package.json` / `package-lock.json` を `main` と比較する。`game-change` は `main` のパッチ版ちょうど +1、`no-game-change` は同値でなければ失敗する。先行PRのマージで `main` のバージョンが変わった場合は、最新の `main` を取り込んでから判定とパッチ版を確認する。

判定はPR本文から読むため、作業中に判定が変わったときは**本文を直してから**版を合わせる。失敗したジョブの再実行は元のイベントの本文を読み直すだけで、直した本文は反映されない。本文の編集自体が新しい検査を動かすので、編集後の実行結果を見る。

GitHubの番号変更とSitesの公開は別作業。公開依頼がない変更ではSitesへ配信しない。

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

整形はPrettier（`.prettierrc.json`、印字幅100）で行い、`npm run format` で全体を整える。`components/ui` と `hooks/use-mobile.ts` はshadcnから取り込んだままの形を保つため対象外で、`docs/`、`public/`、`assets/`、`drizzle/` も整形しない（`.prettierignore`）。コードを圧縮した1行書きには戻さず、関数長・ファイル長の上限が実際の行数で働くようにする。整形導入時に上限を超えていたファイルは `eslint.config.mjs` の一時的な除外一覧にあり、分割が済んだものから一覧を外す。

LintはYAMORUと同じ型情報付きのstrictルールと、複雑度・関数長・ファイル長の上限をerrorとして扱う。`lint`と`lint:fix`はいずれもwarningが1件でも残ると失敗する。`lint:fix`の適用後は差分とテストを確認する。

Pull Requestと`main`へのpushでは、GitHub Actionsが`npm run format:check`、`npm run lint`、`npx tsc --noEmit`、生成素材の検査（`images:check` / `videos:check`）、`node --test tests/*.test.mjs` の全ユニットテストを実行する。PRのバージョン判定は `pr-version.yml` が `tests/pr-version.test.mjs` と `scripts/check-pr-version.mjs` で検証する。ブラウザーテストとビルド後のHTTP検証はCIに含めず、手動で実行する。

## 実装の分担

冒険の描画はPhaserを使う。キャラクター、会話、設定などはReact側で扱い、進行・保存の判定を描画ループへ重複実装しない。

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

以下の5本は `node --test tests/*.test.mjs` の対象外。GitHub Actionsの定期実行・push時実行・必須checkには追加せず、関連する画面やAPIを変更したとき、または必要になったときにローカルで実行する。リポジトリのルートで `npm run install:ci`（または通常の依存関係のインストール）と `npm run build` を済ませてから、必要な行だけ実行する。ビルドとテストはSitesやユーザーのセーブを使わない。

| テスト | 実行条件・コマンド | 確認内容・出力 |
| --- | --- | --- |
| `tests/quest-picker.browser.mjs` | Node版PlaywrightとChromium。`node tests/quest-picker.browser.mjs` | 行先選択・設定・画面幅。`work/quest-picker-browser/` にスクリーンショットと結果JSON |
| `tests/story-video.browser.mjs` | Node版PlaywrightとChromium。`node tests/story-video.browser.mjs` | 再生・一時停止・再視聴・縮小画面・失敗時の代替表示。`work/story-video-browser/` にスクリーンショット |
| `tests/dialog-layout.browser.py` | Python版PlaywrightとChromiumまたはWebKit。`python tests/dialog-layout.browser.py --engine chromium`（必要なら `--engine webkit` も） | 生成CSSによる各画面幅・回転・安全領域の配置。成功時はケース数を表示。失敗時は測定値を出力 |
| `tests/test-tools.integration.mjs` | ビルド済み。`node tests/test-tools.integration.mjs` | 一時的なローカルWorkerで `ENABLE_TEST_TOOLS` の切り替えをHTTP検証。外部サイト・端末セーブは使用しない |
| `tests/api-backup.integration.mjs` | ビルドとローカルD1の初期化後、別ターミナルで `npm start`。起動時に表示されたURLを `TEST_ROOT` に指定して `node tests/api-backup.integration.mjs` | ローカルのバックアップAPIで往復・隔離・不正入力を検証。`npm start` の既定は `http://127.0.0.1:8787`（テスト側の既定5173とは異なる） |

Node版Playwrightは通常の依存関係には含まれない。必要なときだけ `npm install --no-save --package-lock=false playwright` と `npx playwright install chromium` で用意する。既に別の場所へ入れた場合は `PLAYWRIGHT_MODULE` にパッケージの絶対パス、`CHROME_PATH` にChromiumの実行ファイルを指定できる。Python版は別途 `python -m pip install playwright` と `python -m playwright install chromium webkit` が必要。Pythonテストは生成CSSと `components/ui/dialog.tsx` の実際のクラスを組み合わせた独立fixtureでWebKitも検査する。Node版2本の実コンポーネント検査とは異なるため、単に言語を揃える目的では移植せず維持する。ブラウザー幅の検査は実機確認の代わりにはならない。

バックアップAPIだけは、**`npm start` の前に**同じローカル状態（`.wrangler/state`）のD1へ `drizzle/0000_organic_secret_warriors.sql`、`0001_abandoned_enchantress.sql`、`0002_complete_firelord.sql` を番号順に適用する。例（各コマンドを順に実行）:

```bash
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute site-creator-d1 --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_organic_secret_warriors.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute site-creator-d1 --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_abandoned_enchantress.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute site-creator-d1 --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_complete_firelord.sql
npm start
```

別ターミナルから `TEST_ROOT=http://127.0.0.1:8787 node tests/api-backup.integration.mjs` を実行する（PowerShellでは `$env:TEST_ROOT='http://127.0.0.1:8787'; node tests/api-backup.integration.mjs`）。既存のローカルD1へ同じSQLを重複適用しない（新しい検証用状態で始める場合だけ初期化する）。公開先のD1には適用しない。`work/` と `.wrangler/` はGit管理対象外なので、失敗時のログ・スクリーンショットはローカルで確認し、必要なものだけ共有する。

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

公開先は `config/site-targets.json` のプレビューと本番。`.openai/hosting.json` は既存本番の識別子を保持する。`starlit-implement` はゲームバージョンを上げた変更なら指定がなければマージ後のプレビュー反映まで含む。据え置きなら明示的な反映依頼がない限り省略してよい。本番はスキル実行時の明示指定に加え、同じソースの確認と配備準備を終えた後の最終承認を得て更新する。PRのマージ承認とは分ける。

Gitの `origin` はGitHubの非公開リポジトリ、`sites` はSites専用リポジトリ。GitHubへのpushだけではゲームは更新されない。

公開先の検査、サイトごとの配信用コミット、第一章の確認表、環境設定と結果の記録方法は [サイトの確認と公開](site-release.md) を参照する。ローカルのみ・PR作成まで・配備しない指定を優先し、調査・相談だけでは配備しない。

公開作業では、作業中の別タスクや未確定差分を確認し、無関係な変更を失わせない。セーブデータやローカル作業ファイルはGitへ含めない。

エージェント共通の公開ルールは [エージェント共通ルール](../agent-rules.md) を参照する。Codex の操作手順は [`AGENTS.md`](../../AGENTS.md) と `.agents/skills/starlit-publish/SKILL.md` に置く。

## データベース

Drizzleの適用済みマイグレーションは変更せず、変更は新しいマイグレーションとして追加する。

バックアップ用テーブルと旧形式の扱いは [セーブシステム](../gameplay/save-system.md) を参照する。
