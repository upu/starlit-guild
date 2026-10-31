"use client";
import { useState } from "react";
import { ContactStudy } from "./contacts";
import { StagingProps } from "./staging-props";

const poses = [
  "立つ",
  "歩行A（調整中）",
  "歩行B（調整中）",
  "歩行C（調整中）",
  "歩行D（調整中）",
  "持つ構え",
  "座る",
  "屈む",
  "会話・聞く",
  "会話・考える",
  "会話・説明する",
  "会話・笑う",
  "荷物・支える",
  "荷物・戸惑う",
  "荷物・笑う",
  "荷物・台へ戻す",
];
export function CharacterStudy() {
  const [frame, setFrame] = useState(0);
  const [room, setRoom] = useState(false);
  const [reference, setReference] = useState(false);
  return (
    <section>
      <p>人物の初稿。歩行の左右の足運びと、手元は調整中です。</p>
      <div className="storybook-study-controls">
        <label>
          姿勢{" "}
          <select
            value={frame}
            onChange={(e) => {
              setFrame(Number(e.target.value));
            }}
          >
            {poses.map((pose, i) => (
              <option key={pose} value={i}>
                {pose}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={room}
            onChange={(e) => {
              setRoom(e.target.checked);
            }}
          />
          屋内で比較
        </label>
        <label>
          <input
            type="checkbox"
            checked={reference}
            onChange={(e) => {
              setReference(e.target.checked);
            }}
          />
          立ち姿を重ねて比較
        </label>
      </div>
      <CharacterScene room={room} frame={frame} reference={reference} />
      <p>
        同じ縮尺で姿勢を比較します。屋外には新しい取引先・台・箱を配置しています。屋内の座り姿には椅子を合わせています。手元と座面の接点は調整中です。
      </p>
      {reference && <p>薄い立ち姿が比較基準です。足元と縮尺を固定して重ねています。</p>}
      <ContactStudy />
    </section>
  );
}

function CharacterPose({
  id,
  frame,
  reference,
  seatedChair,
}: {
  id: "aria" | "leon";
  frame: number;
  reference: boolean;
  seatedChair: boolean;
}) {
  return (
    <div className="storybook-character" data-character={id}>
      {seatedChair && <i className="storybook-seat-chair" role="img" aria-label="木の椅子" />}
      {reference && frame !== 0 && (
        <span
          className="storybook-standing-reference"
          aria-hidden="true"
          style={{
            backgroundImage: `url(/storybook-study/${id}-poses-v1.webp)`,
            backgroundPosition: "0% 0%",
          }}
        />
      )}
      <span
        style={{
          backgroundImage: `url(/storybook-study/${id}-${frame >= 12 ? "carry" : frame >= 8 ? "conversation" : "poses"}-v1.webp)`,
          backgroundSize: frame >= 8 ? "400% 100%" : "400% 200%",
          backgroundPosition: `${String(((frame % 4) * 100) / 3)}% ${String(frame >= 8 ? 0 : Math.floor(frame / 4) * 100)}%`,
        }}
      />
      <b>{id === "aria" ? "アリア" : "レオン"}</b>
    </div>
  );
}

function CharacterScene({
  room,
  frame,
  reference,
}: {
  room: boolean;
  frame: number;
  reference: boolean;
}) {
  return (
    <div
      className="storybook-character-scene"
      data-composed={!room}
      style={{ backgroundImage: `url(/storybook-study/${room ? "office" : "warehouse"}-v1.png)` }}
    >
      {!room && <StagingProps frame={frame} />}
      {(["aria", "leon"] as const).map((id) => (
        <CharacterPose
          key={id}
          id={id}
          frame={frame}
          reference={reference}
          seatedChair={room && frame === 6}
        />
      ))}
    </div>
  );
}
