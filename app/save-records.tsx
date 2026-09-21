"use client";
import { FlaskConical, Plus, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { chapterTwoPresets } from "@/lib/chapter-two-presets";
import type { Game } from "./save-panel-types";

function DeleteProfileButton({
  profile,
  disabled,
  onDelete,
}: {
  profile: NonNullable<Game["profile"]>;
  disabled: boolean;
  onDelete: () => boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          className="outline save-record-delete"
          disabled={disabled}
          aria-label={`「${profile.name}」を削除`}
        >
          <Trash2 size={15} />
          削除
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="game-confirm">
        <AlertDialogHeader>
          <AlertDialogTitle>この記録を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            「{profile.name}
            」をこの端末から削除します。元に戻せません。残したい場合は、先にファイルへ保存してください。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>やめる</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onDelete}>
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function TestProfileButton({ game, onCreate }: { game: Game; onCreate: () => void }) {
  if (!game.testToolsEnabled) return null;
  return (
    <div className="chapter-test-start">
      <button
        className="outline"
        disabled={game.otherTab}
        onClick={() => {
          game.createProfile(true);
          onCreate();
        }}
      >
        <FlaskConical size={15} />
        テスト用を作る
      </button>
      <p>第2章から試す</p>
      <small>今の冒険を残して、別のテスト記録を作ります。どちらも2-1の出発前から始まります。</small>
      {chapterTwoPresets.map((preset) => (
        <button
          key={preset.id}
          className="outline"
          disabled={game.otherTab || !game.bundle || game.bundle.profiles.length >= 12}
          onClick={() => {
            game.createProfile(true, preset.id);
            onCreate();
          }}
        >
          <b>{preset.name}</b>
          <small>{preset.description}</small>
        </button>
      ))}
    </div>
  );
}

export function SaveCapacityNote({ count }: { count: number }) {
  return count < 12 ? null : (
    <p className="save-capacity-note" role="status">
      記録が12個あります。「記録」で不要なものを削除すると読み込めます。
    </p>
  );
}

function ProfileRecords({ game, bundle }: { game: Game; bundle: NonNullable<Game["bundle"]> }) {
  return (
    <div className="save-records" aria-label="記録を整理">
      {bundle.profiles.map((profile) => (
        <div className="save-record" key={profile.id}>
          <span>
            <b>
              {profile.test ? "🧪 " : ""}
              {profile.name}
            </b>
            <small>
              {profile.state.clears} 件達成{profile.id === bundle.active ? " · 遊んでいます" : ""}
            </small>
          </span>
          <DeleteProfileButton
            profile={profile}
            disabled={game.otherTab || bundle.profiles.length <= 1}
            onDelete={() => game.deleteProfile(profile.id)}
          />
        </div>
      ))}
    </div>
  );
}

export function RecordsSection({ game, onSelect }: { game: Game; onSelect: () => void }) {
  const bundle = game.bundle;
  if (!bundle) return null;
  return (
    <section className="save-section">
      <div className="save-section-heading">
        <h3>遊ぶ記録</h3>
        <span>{bundle.profiles.length} / 12</span>
      </div>
      <Select
        value={bundle.active}
        onValueChange={(id) => {
          game.switchProfile(id);
          onSelect();
        }}
        disabled={game.otherTab}
      >
        <SelectTrigger aria-label="遊ぶ記録を選ぶ" className="full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {bundle.profiles.map((profile) => (
            <SelectItem key={profile.id} value={profile.id}>
              {profile.test ? "🧪 " : ""}
              {profile.name} · {profile.state.clears} 件達成
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="save-buttons">
        <button
          className="outline"
          disabled={game.otherTab}
          onClick={() => {
            game.createProfile();
            onSelect();
          }}
        >
          <Plus size={15} />
          最初から遊ぶ
        </button>
        <TestProfileButton game={game} onCreate={onSelect} />
      </div>
      <small>今の記録は残ります。別の記録で冒険しても、獲得したものは混ざりません。</small>
      <ProfileRecords game={game} bundle={bundle} />
      {bundle.profiles.length <= 1 && <small>最後の1件は削除できません。</small>}
    </section>
  );
}
