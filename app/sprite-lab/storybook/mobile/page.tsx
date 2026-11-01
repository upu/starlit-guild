export default function MobileStudy() {
  return (
    <main style={{ overflow: "auto", padding: 12 }}>
      <p>390 × 844 CSS pxの画面を等倍で表示。実機の確認とは別です。</p>
      <div style={{ width: 390, height: 844, margin: "8px auto", position: "relative" }}>
        <iframe
          title="スマホ幅の絵本調見本"
          src="/sprite-lab/storybook"
          width="390"
          height="844"
          style={{
            display: "block",
            border: 0,
            outline: "1px solid #a58d58",
            maxWidth: "none",
          }}
        />
      </div>
    </main>
  );
}
