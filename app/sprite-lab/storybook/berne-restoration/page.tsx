import { AdventureStudy } from "../adventure";
import "../study.css";

export default function Page() {
  return (
    <main className="storybook-study">
      <h1>3-9 戻る灯り、増える同行者</h1>
      <p>塔の石組みを直す場面の表示確認用の見本です。</p>
      <AdventureStudy quest="berne-restoration" />
    </main>
  );
}
