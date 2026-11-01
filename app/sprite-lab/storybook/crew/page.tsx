import { AdventureStudy } from "../adventure";
import "../study.css";

export default function Page() {
  return (
    <main className="storybook-study">
      <h1>五人の冒険見本</h1>
      <AdventureStudy quest="moss-transplant" fullParty />
    </main>
  );
}
