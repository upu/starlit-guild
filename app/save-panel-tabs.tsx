"use client";
import type { RefObject } from "react";
import { Download, Upload, Volume2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { QuestProgressionSetting } from "./quest-progression-setting";
import { MusicSettings } from "./music-settings";
import { SaveCloudPanel } from "./save-cloud-panel";
import { RecordsSection, SaveCapacityNote } from "./save-records";
import { TestControls } from "./save-test-controls";
import type { Game, Music } from "./save-panel-types";

function FilePanel({ game, file }: { game: Game; file: RefObject<HTMLInputElement | null> }) {
  return (
    <section className="save-section">
      <h3>ファイルにも保管</h3>
      <p>
        ブラウザーのデータを消す前や、別の端末へ移すときに。読み込みは別の記録として追加します。
      </p>
      <div className="save-buttons">
        <button className="outline" onClick={game.download}>
          <Download size={15} />
          この記録を保存
        </button>
        <button className="outline" disabled={game.otherTab} onClick={() => file.current?.click()}>
          <Upload size={15} />
          ファイルを読み込む
        </button>
      </div>
      <SaveCapacityNote count={game.bundle?.profiles.length || 0} />
      <small>保存する記録：{game.profile?.name}。ファイルには、この記録の進行が入ります。</small>
    </section>
  );
}

function SettingsPanel({
  game,
  music,
  onClose,
}: {
  game: Game;
  music: Music;
  onClose: () => void;
}) {
  return (
    <>
      <QuestProgressionSetting
        checked={game.s.autoNextQuest === true}
        onChange={(value) => {
          game.dispatch({ type: "autoNextQuest", value });
        }}
        disabled={game.otherTab}
      />
      <MusicSettings music={music} disabled={game.otherTab} />
      <label className="switch-row">
        <span>
          <Volume2 size={15} /> 効果音
        </span>
        <Switch
          checked={game.bundle?.sound === true}
          onCheckedChange={game.toggleSound}
          disabled={game.otherTab}
          aria-label="効果音"
        />
      </label>
      <small>
        {game.bundle?.sound ? "手助けや報酬の効果音が鳴ります。" : "効果音はオフです。"}
      </small>
      <TestControls game={game} onAdjust={onClose} />
    </>
  );
}

export function SavePanelTabs({
  game,
  music,
  file,
  onClose,
}: {
  game: Game;
  music: Music;
  file: RefObject<HTMLInputElement | null>;
  onClose: () => void;
}) {
  return (
    <Tabs defaultValue="records">
      <TabsList className="save-pagination">
        <TabsTrigger value="records">記録</TabsTrigger>
        <TabsTrigger value="cloud">クラウド</TabsTrigger>
        <TabsTrigger value="files">ファイル</TabsTrigger>
        <TabsTrigger value="settings">設定</TabsTrigger>
      </TabsList>
      <TabsContent value="records">
        <RecordsSection game={game} onSelect={onClose} />
      </TabsContent>
      <TabsContent value="cloud">
        <SaveCloudPanel game={game} onRestore={onClose} />
      </TabsContent>
      <TabsContent value="files">
        <FilePanel game={game} file={file} />
      </TabsContent>
      <TabsContent value="settings">
        <SettingsPanel game={game} music={music} onClose={onClose} />
      </TabsContent>
    </Tabs>
  );
}
