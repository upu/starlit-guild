import { AdventureStudy } from "../adventure";
import "../study.css";
export default function Page() {
  return (
    <main className="storybook-study">
      <h1>3-1 隣の席の聞き上手</h1>
      <p>四人で往診の荷物を守り、ベルネの門へ向かいます。</p>
      <AdventureStudy quest="berne-road" />
    </main>
  );
}
