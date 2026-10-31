export function StagingProps({ frame }: { frame: number }) {
  const merchantFrame = frame === 7 ? 2 : 1;
  return (
    <>
      <div className="storybook-staging-merchant" aria-label="取引先の人">
        <span style={{ backgroundPosition: `${String((merchantFrame * 100) / 3)}% 0%` }} />
      </div>
      <div className="storybook-staging-table" aria-label="荷造り台" />
      <div className="storybook-staging-stock" aria-label="布を掛けた箱">
        <span />
        <span />
      </div>
      <div className="storybook-staging-box" data-held={frame === 5} aria-label="配達する箱" />
    </>
  );
}
