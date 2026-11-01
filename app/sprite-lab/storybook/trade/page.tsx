import { AdventureStudy } from "../adventure";
import "../study.css";
export default function Page() {
  return (
    <main className="storybook-study">
      <h1>村の荷車を運ぶ交易路</h1>
      <AdventureStudy quest="village-trade" />
    </main>
  );
}
