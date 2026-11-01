import { AdventureStudy } from "../adventure";
import "../study.css";

export default function Page() {
  return (
    <main className="storybook-study">
      <h1>3-8 間違った荷物を戻す夜</h1>
      <p>荷車と石を守りながら橋へ向かいます。試作中で、本編にはまだ反映していません。</p>
      <AdventureStudy quest="keystone-night-road" />
    </main>
  );
}
