import { AdventureStudy } from "../adventure";
import "../study.css";
export default function HomewardStudyPage() {
  return (
    <main className="storybook-study">
      <h1>帰り道の手荷物</h1>
      <AdventureStudy quest="medicine-road-home" />
    </main>
  );
}
