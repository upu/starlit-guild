function ReplacementSelect({ value, select }: { value: string; select: (id: string) => void }) {
  return (
    <label>
      交代役{" "}
      <select
        value={value}
        onChange={(event) => {
          select(event.target.value);
        }}
      >
        <option value="aria">アリア</option>
        <option value="mira">ミラ</option>
        <option value="finn">フィン</option>
      </select>
    </label>
  );
}

export function LindeStudyControls({
  rapid,
  courier,
  selectCourier,
  replacement,
  selectReplacement,
  downLeon,
  toggle,
  reset,
}: {
  rapid: boolean;
  courier: string;
  selectCourier: (id: string) => void;
  replacement: string;
  selectReplacement: (id: string) => void;
  downLeon: () => void;
  toggle: () => void;
  reset: (nearEnd: boolean) => void;
}) {
  return (
    <div className="night-phone-study-controls" aria-label="見本の操作">
      <span>一時データ</span>
      <label>
        行動できる仲間{" "}
        <select
          value={courier}
          onChange={(event) => {
            selectCourier(event.target.value);
          }}
        >
          <option value="all">全員</option>
          <option value="aria">アリアのみ</option>
          <option value="leon">レオンのみ</option>
          <option value="mira">ミラのみ</option>
          <option value="finn">フィンのみ</option>
        </select>
      </label>
      <ReplacementSelect value={replacement} select={selectReplacement} />
      <button onClick={downLeon}>交代を再現</button>
      <button onClick={toggle}>{rapid ? "連続手助けを止める" : "連続手助けで確認"}</button>
      <button
        onClick={() => {
          reset(false);
        }}
      >
        最初から
      </button>
      <button
        onClick={() => {
          reset(true);
        }}
      >
        帰着の手前から
      </button>
    </div>
  );
}
