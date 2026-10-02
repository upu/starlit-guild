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
    [reduced, setReduced] = useState(false);
  const { host, status, message, retry } = useHomeRoom(
    {
      site: props.site,
      members: props.members,
      furniture: editor.items,
      growth: props.growth ?? {},
      mode: props.mode ?? "auto",
      paused,
      reduced,
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
      <div className="home-stage">
        <div className="home-canvas" ref={host} aria-hidden="true" />
        {status !== "ready" && (
          <div className="home-loading" role="status">
            {status === "error" ? <button onClick={retry}>景色を読み直す</button> : "部屋を支度中…"}
          </div>
        )}
      </div>
      <RoomControls
        paused={paused}
        setPaused={setPaused}
        reduced={reduced}
        setReduced={setReduced}
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

function RoomControls({
  paused,
  setPaused,
  reduced,
  setReduced,
  edit,
}: {
  paused: boolean;
  setPaused: (value: boolean) => void;
  reduced: boolean;
  setReduced: (value: boolean) => void;
  edit?: () => void;
}) {
  return (
    <div className="home-controls">
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
