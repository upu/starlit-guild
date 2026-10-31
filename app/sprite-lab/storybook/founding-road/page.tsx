import { AdventureStudy } from "../adventure";
import "../study.css";

export default function Page() {
  return (
    <main className="storybook-study">
      <h1>4-10 同じ宛先へ</h1>
      <p>五人で返事の手紙と借り物を届けながら、リンデへ戻ります。</p>
      <AdventureStudy quest="starlit-guild-founding" />
    </main>
  );
}
