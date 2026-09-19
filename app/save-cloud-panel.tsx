"use client";
import { useState } from "react";
import { CloudCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { Game } from "./save-panel-types";

function CloudCopies({ game, onRestore }: { game: Game; onRestore: () => void }) {
  if (game.copies.length === 0) return <p>バックアップがまだありません。</p>;
  return game.copies.flatMap((copy) =>
    copy.bundle.profiles.map((profile) => (
      <button
        className="outline"
        key={copy.bundle.deviceId + profile.id}
        disabled={game.otherTab}
        onClick={() => {
          try {
            game.restoreCopy(profile);
            onRestore();
          } catch (error) {
            toast.error((error as Error).message);
          }
        }}
      >
        <span>
          {profile.name}
          <small>
            {profile.state.clears} 件 · {new Date(copy.at).toLocaleString("ja-JP")}
          </small>
        </span>
        <span>復元</span>
      </button>
    )),
  );
}

export function SaveCloudPanel({ game, onRestore }: { game: Game; onRestore: () => void }) {
  const [showCloud, setShowCloud] = useState(false);
  return (
    <section className="save-section">
      <h3>バックアップ</h3>
      <p>
        端末への保存：{game.saved ? new Date(game.saved).toLocaleTimeString("ja-JP") : "準備中"}
        <br />
        クラウド：
        {game.bundle?.cloudAt
          ? new Date(game.bundle.cloudAt).toLocaleString("ja-JP")
          : "次の自動バックアップを待っています"}
      </p>
      {game.cloudError && <p role="status">{game.cloudError}</p>}
      <div className="save-buttons">
        <button onClick={() => void game.backup()} disabled={game.cloudBusy || game.otherTab}>
          <CloudCheck size={15} />
          {game.cloudBusy ? "バックアップ中…" : "今すぐバックアップ"}
        </button>
        <button
          className="outline"
          onClick={() => {
            setShowCloud(!showCloud);
            void game.refreshCopies();
          }}
        >
          <RefreshCw size={15} />
          クラウドから復元
        </button>
      </div>
      {showCloud && (
        <div className="cloud-copies">
          <CloudCopies game={game} onRestore={onRestore} />
        </div>
      )}
      <small>
        バックアップはサイトを開いているあなたの認証情報に紐づきます。ゲーム側の追加ログインはありません。閉じている間のクラウド保存は行いません。
      </small>
    </section>
  );
}
