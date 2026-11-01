import { AdventureStudy } from "../adventure";
import "../study.css";
export default function Page() {
  return (
    <main className="storybook-study">
      <h1>苔灯を携える夜道</h1>
      <AdventureStudy quest="moss-night-road" />
    </main>
  );
}
