"use client";
import { useState } from "react";
import { stories } from "@/lib/stories";
import { StoryReader } from "../../../story-scenes";
import "./reader.css";

export default function ReaderReview() {
  const [id, setId] = useState("town-deliveries-departure");
  const [replay, setReplay] = useState(0);
  const [startPage, setStartPage] = useState(0);
  const story = stories.find((item) => item.id === id) ?? stories[0];
  return (
    <main className="storybook-reader-review">
      <label>
        確認するシーン{" "}
        <select
          value={id}
          onChange={(event) => {
            setId(event.target.value);
            setStartPage(0);
          }}
        >
          {stories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}（{item.id}）
            </option>
          ))}
        </select>
      </label>
      <button
        onClick={() => {
          setReplay(replay + 1);
        }}
      >
        最初から再生
      </button>
      <ReviewStart
        lines={story.lines}
        value={startPage}
        change={(page) => {
          setStartPage(page);
          setReplay(replay + 1);
        }}
      />
      <div className="phone-dialog">
        <StoryReader
          key={`${id}-${String(replay)}`}
          story={story}
          ready
          reviewStartPage={startPage}
          onRead={() => true}
          onClose={() => {
            setReplay(replay + 1);
          }}
        />
      </div>
    </main>
  );
}
function ReviewStart({
  lines,
  value,
  change,
}: {
  lines: { text: string }[];
  value: number;
  change: (page: number) => void;
}) {
  return (
    <label>
      再生開始の会話
      <select
        value={value}
        onChange={(event) => {
          change(Number(event.target.value));
        }}
      >
        {lines.map((line, index) => (
          <option key={index} value={index}>
            {index + 1}：{line.text.slice(0, 32)}
          </option>
        ))}
      </select>
    </label>
  );
}
