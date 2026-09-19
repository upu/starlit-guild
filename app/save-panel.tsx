"use client";
import { useRef, useState, type ChangeEvent } from "react";
import { Settings, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { errorMessage } from "@/lib/external-input";
import { SavePanelTabs } from "./save-panel-tabs";
import type { Game, Music } from "./save-panel-types";
export { TestControls } from "./save-test-controls";

function importHandler(game: Game, close: () => void) {
  return (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file)
      void game
        .importFile(file)
        .then(close)
        .catch((error: unknown) =>
          toast.error(errorMessage(error, "保存ファイルを読み込めませんでした。")),
        );
    event.target.value = "";
  };
}

export function SavePanel({ game, music }: { game: Game; music: Music }) {
  const [open, setOpen] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const close = () => {
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="save-status">
          <Settings size={20} />
          <span>{game.error ? "保存を確認" : game.ready ? "セーブ・設定" : "読み込み中…"}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="save-dialog">
        <DialogHeader>
          <DialogTitle>冒険のセーブと設定</DialogTitle>
          <DialogDescription>
            端末に自動保存。開いている間は約5分ごとにクラウドへバックアップします。
          </DialogDescription>
        </DialogHeader>
        {game.bundle ? (
          <SavePanelTabs game={game} music={music} file={file} onClose={close} />
        ) : (
          <button onClick={() => file.current?.click()}>
            <Upload size={15} />
            保存ファイルから復元
          </button>
        )}
        <input
          type="file"
          accept="application/json,.json"
          hidden
          ref={file}
          onChange={importHandler(game, close)}
        />
      </DialogContent>
    </Dialog>
  );
}
