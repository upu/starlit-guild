import { MossContactStudy } from "./study";
import "../../study.css";
import "../waterway.css";

export default function Page() {
  return (
    <main className="storybook-study">
      <h1>1-9 木べらと点検口の接点</h1>
      <p>石の縁から薄く剥がす動きと、籠を受ける位置を調整しています。</p>
      <MossContactStudy />
    </main>
  );
}
