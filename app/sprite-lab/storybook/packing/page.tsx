import { AdventureStudy } from "../adventure";
import "../study.css";
export default function Page() {
  return (
    <main className="storybook-study">
      <h1>2-3 配達の支度</h1>
      <p>瓶と蜜を別々に包み、荷札を確かめて袋へ収め、最後に蓋を閉じる動きを確認します。</p>
      <AdventureStudy quest="medicine-packing" />
    </main>
  );
}
