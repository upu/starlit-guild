import { AdventureStudy } from "../adventure";
import "../study.css";
import "./portrait.css";

export default function Page() {
  return (
    <main className="storybook-study lantern-road-portrait">
      <h1>村はずれへの道・縦長表示</h1>
      <AdventureStudy quest="lantern-detour" />
    </main>
  );
}
