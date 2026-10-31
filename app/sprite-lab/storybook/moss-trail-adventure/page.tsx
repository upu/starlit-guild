import { AdventureStudy } from "../adventure";
import "../study.css";

export default function Page() {
  return (
    <main className="storybook-study">
      <h1>荷車を追う道</h1>
      <AdventureStudy quest="glowing-moss-trail" />
    </main>
  );
}
