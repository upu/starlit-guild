import { AdventureStudy } from "../adventure";
import "../study.css";

export default function Page() {
  return (
    <main className="storybook-study">
      <h1>4-6 塔のそばの苔床</h1>
      <p>苔床と水路を調べる冒険の表示確認です。</p>
      <AdventureStudy quest="brekka-moss-beds" />
    </main>
  );
}
