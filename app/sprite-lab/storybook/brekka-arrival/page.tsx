import { AdventureStudy } from "../adventure";
import "../study.css";

export default function Page() {
  return (
    <main className="storybook-study">
      <h1>ブレッカの往診と仕入れ</h1>
      <AdventureStudy quest="brekka-arrival" />
    </main>
  );
}
