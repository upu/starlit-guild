export function LineReview({
  line,
  end,
  change,
  ready,
}: {
  line: number;
  end: number;
  change: (line: number) => void;
  ready: (value: boolean) => void;
}) {
  return (
    <label>
      確認する会話
      <select
        aria-label="確認する会話"
        value={line}
        onChange={(event) => {
          change(Number(event.target.value));
          ready(false);
        }}
      >
        {Array.from({ length: end }, (_, index) => (
          <option key={index} value={index}>
            {index + 1} / {end}
          </option>
        ))}
      </select>
    </label>
  );
}
