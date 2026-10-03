"use client";
import { useState } from "react";
import type { Furniture, RoomSite } from "@/lib/home-room-layout";
import type { ResidentId } from "@/lib/home-actor";
import type { RoomActivity } from "@/lib/home-room-life";
import { useFurniture } from "./use-home-furniture";
import { useHomeRoom } from "./use-home-room";
import { HomeRoomEditor } from "./home-room-editor";
import "./home-room.css";
export type HomeRoomProps = {
  site: RoomSite;
  members: ResidentId[];
  layout?: Furniture[];
  growth?: Record<string, number>;
  mode?: RoomActivity;
  onLayout?: (items: Furniture[]) => boolean | undefined;
  onUse?: (id: string) => void;
  working?: ResidentId;
};
export function HomeRoom(props: HomeRoomProps) {
  const editor = useFurniture(props);
  const [paused, setPaused] = useState(false),
    [reduced, setReduced] = useState(false),
    [zoomed, setZoomed] = useState(false);
  const { host, status, message, retry } = useHomeRoom(
    {
      site: props.site,
      members: props.members,
      furniture: editor.items,
      growth: props.growth ?? {},
      mode: props.mode ?? "auto",
      paused,
      reduced,
      zoomed,
      editing: editor.draft !== null,
      selected: editor.selected,
      adding: editor.adding,
      working: props.working,
    },
    {
      select: editor.select,
      place: editor.place,
      use: (id) => {
        props.onUse?.(id);
      },
    },
  );
  return (
    <section className="home-room" aria-label="小さな旅団ホーム" data-status={status}>
      <HomeStage host={host} status={status} retry={retry} zoomed={zoomed} />
      <RoomControls
        paused={paused}
        setPaused={setPaused}
        reduced={reduced}
        setReduced={setReduced}
        zoomed={zoomed}
        setZoomed={setZoomed}
        edit={props.onLayout && props.site === "home" && !editor.draft ? editor.edit : undefined}
      />
      {editor.draft ? (
        <HomeRoomEditor {...editor} />
      ) : (
        <p className="home-caption" aria-live="polite">
          {props.members.length ? message : "仲間の帰りを待つ、静かな部屋。"}
        </p>
      )}
    </section>
  );
}

function HomeStage({
  host,
  status,
  retry,
  zoomed,
}: {
  host: React.RefObject<HTMLDivElement | null>;
  status: string;
  retry: () => void;
  zoomed: boolean;
}) {
  return (
    <div
      className={`home-stage${zoomed ? " is-zoomed" : ""}`}
      tabIndex={zoomed ? 0 : undefined}
      aria-label={zoomed ? "拡大した部屋。スワイプか矢印キーで移動、Homeキーで中央へ" : "部屋全体"}
    >
      <div className="home-canvas" ref={host} aria-hidden="true" />
      {status !== "ready" && (
        <div className="home-loading" role="status">
          {status === "error" ? <button onClick={retry}>景色を読み直す</button> : "部屋を支度中…"}
        </div>
      )}
    </div>
  );
}

function RoomControls({
  paused,
  setPaused,
  reduced,
  setReduced,
  zoomed,
  setZoomed,
  edit,
}: {
  paused: boolean;
  setPaused: (value: boolean) => void;
  reduced: boolean;
  setReduced: (value: boolean) => void;
  zoomed: boolean;
  setZoomed: (value: boolean) => void;
  edit?: () => void;
}) {
  return (
    <div className="home-controls">
      <button
        aria-pressed={zoomed}
        onClick={() => {
          setZoomed(!zoomed);
        }}
      >
        {zoomed ? "部屋全体" : "拡大する"}
      </button>
      {edit && <button onClick={edit}>家具を置く・動かす</button>}
      <button
        aria-pressed={paused}
        onClick={() => {
          setPaused(!paused);
        }}
      >
        {paused ? "動きを再開" : "一時停止"}
      </button>
      <button
        aria-pressed={reduced}
        onClick={() => {
          setReduced(!reduced);
        }}
      >
        動きを減らす
      </button>
    </div>
  );
}
