import { AdventureStudy } from "../adventure";
import "../study.css";
import "../lantern-road-portrait/portrait.css";

export default function Page() {
  return (
    <main className="storybook-study lantern-road-portrait">
      <h1>二日目の追跡・縦長表示</h1>
      <AdventureStudy quest="glowing-moss-trail-next-day" />
    </main>
  );
}
