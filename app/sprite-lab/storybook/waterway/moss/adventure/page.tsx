import { AdventureStudy } from "../../../adventure";
import Link from "next/link";
import "../../../study.css";
export default function Page() {
  return (
    <main className="storybook-study">
      <h1>1-9 点検口と苔の運び出し</h1>
      <p>管理人による点検口の開閉、二籠の回収と荷車への積み込みを実際の進行で確認します。</p>
      <AdventureStudy quest="tower-moss-removal" />
      <p>
        <Link href="/sprite-lab/storybook/moss-removal-phone">冒険から帰還会話まで確認する</Link>
      </p>
    </main>
  );
}
