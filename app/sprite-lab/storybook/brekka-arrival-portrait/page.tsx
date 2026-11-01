import { AdventureStudy } from "../adventure";
import "../study.css";
import "../lantern-road-portrait/portrait.css";

export default function Page() {
  return (
    <main className="storybook-study lantern-road-portrait">
      <h1>ブレッカの往診・縦長表示</h1>
      <AdventureStudy quest="brekka-arrival" />
    </main>
  );
}
