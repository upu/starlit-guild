import { AdventureStudy } from "../adventure";
import "../study.css";

export default function Page() {
  return (
    <main className="storybook-study">
      <h1>二日目の追跡</h1>
      <AdventureStudy quest="glowing-moss-trail-next-day" />
    </main>
  );
}
