import { AdventureStudy } from "../adventure";
import "../study.css";
export default function Page() {
  return (
    <main className="storybook-study">
      <h1>2-8 薬を待つ家々</h1>
      <p>三軒の玄関と井戸、作業台の間で、配達と往診の支度を進めます。</p>
      <AdventureStudy quest="waiting-households" />
    </main>
  );
}
