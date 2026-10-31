import { AdventureStudy } from "../adventure";
import "../study.css";

export default function Page() {
  return (
    <main className="storybook-study">
      <h1>丘の塔へ向かう道</h1>
      <AdventureStudy quest="tower-road" />
    </main>
  );
}
