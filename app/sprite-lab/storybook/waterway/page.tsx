import { WaterwayLayoutStudy } from "./study";
import "../study.css";
import "./waterway.css";

export default function Page() {
  return (
    <main className="storybook-study">
      <h1>水路の足場と点検口</h1>
      <p>冒険へ組み込む前の配置確認。人物は本編と同じ寸法で表示します。</p>
      <WaterwayLayoutStudy />
    </main>
  );
}
