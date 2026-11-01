"use client";
import { useState } from "react";
import { AdventureStudy } from "../adventure";
import "../study.css";

export default function ForestStudyPage() {
  const [quest, setQuest] = useState("forest-wetland");
  return (
    <main className="storybook-study">
      <h1>林道の冒険</h1>
      <label>
        確認する場所{" "}
        <select
          value={quest}
          onChange={(e) => {
            setQuest(e.target.value);
          }}
        >
          <option value="forest-wetland">1-6 湿った木陰</option>
          <option value="moonlit-herbs">2-2 月光の薬草</option>
        </select>
      </label>
      <AdventureStudy key={quest} quest={quest} />
    </main>
  );
}
