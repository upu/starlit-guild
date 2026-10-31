import { AdventureStudy } from "../adventure";
import "../study.css";

export default function Page() {
  return (
    <main className="storybook-study">
      <h1>3-5 同じ灯りを探して</h1>
      <p>石工の資材置き場で候補を選びます。</p>
      <AdventureStudy quest="matching-lantern-stone" />
    </main>
  );
}
