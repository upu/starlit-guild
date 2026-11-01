import { AdventureStudy } from "../adventure";
import "../study.css";
export default function Page() {
  return (
    <main className="storybook-study">
      <h1>2-6 もう一人の山賊</h1>
      <p>後ろへ寄せた荷物を守り、大小の人形と戦う本編の表示です。</p>
      <AdventureStudy quest="begging-golem" />
    </main>
  );
}
