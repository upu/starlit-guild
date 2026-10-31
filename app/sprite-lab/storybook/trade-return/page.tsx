import { AdventureStudy } from "../adventure";
import "../study.css";
export default function Page() {
  return (
    <main className="storybook-study">
      <h1>帰りの品を運ぶ夕道</h1>
      <AdventureStudy quest="evening-trade-road" />
    </main>
  );
}
