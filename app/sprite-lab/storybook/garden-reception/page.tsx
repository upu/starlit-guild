import { AdventureStudy } from "../adventure";
import "../study.css";

export default function Page() {
  return (
    <main className="storybook-study">
      <h1>3-7 灯りのお披露目</h1>
      <p>荷車を押して展示台へ向かいます。</p>
      <AdventureStudy quest="garden-reception" />
    </main>
  );
}
