import { furnitureCatalog, type Furniture, type FurnitureKind } from "@/lib/home-room-layout";
type EditorProps = {
  items: Furniture[];
  selected?: string;
  select: (id: string) => void;
  add: (kind: FurnitureKind) => void;
  move: (dx: number, dy: number) => void;
  remove: () => void;
  save: () => void;
  cancel: () => void;
  reset: () => void;
  message: string;
};
export function HomeRoomEditor({
  items,
  selected,
  select,
  add,
  move,
  remove,
  save,
  cancel,
  reset,
  message,
}: EditorProps) {
  return (
    <div className="home-editor">
      <FurnitureCatalog add={add} />
      <FurnitureSelect items={items} selected={selected} select={select} />
      <div className="home-controls" aria-label="家具を1マス動かす">
        {(
          [
            [-1, 0, "←"],
            [0, -1, "↑"],
            [0, 1, "↓"],
            [1, 0, "→"],
          ] as const
        ).map(([dx, dy, label]) => (
          <button
            key={label}
            disabled={!selected}
            onClick={() => {
              move(dx, dy);
            }}
            aria-label={`${label}に1マス`}
          >
            {label}
          </button>
        ))}
        <button disabled={!selected} onClick={remove}>
          しまう
        </button>
        <button onClick={reset}>最初の配置</button>
      </div>
      <p role="status">{message || "家具を選び、置きたいマスをタップ。矢印でも動かせます。"}</p>
      <div className="home-controls">
        <button onClick={save}>この配置にする</button>
        <button onClick={cancel}>取り消す</button>
      </div>
    </div>
  );
}

function FurnitureCatalog({ add }: { add: (kind: FurnitureKind) => void }) {
  return (
    <div className="home-catalog" aria-label="置く家具">
      {Object.entries(furnitureCatalog)
        .filter(([kind]) => kind !== "plot")
        .map(([kind, item]) => (
          <button
            key={kind}
            onClick={() => {
              add(kind as FurnitureKind);
            }}
          >
            <span
              className="home-furniture-preview"
              style={{ backgroundImage: `url(/home-pixel/prop-${String(item.frame)}.webp)` }}
            />
            {item.name}
          </button>
        ))}
    </div>
  );
}

function FurnitureSelect({
  items,
  selected,
  select,
}: Pick<EditorProps, "items" | "selected" | "select">) {
  return (
    <label>
      動かす家具{" "}
      <select
        value={selected ?? ""}
        onChange={(event) => {
          select(event.target.value);
        }}
      >
        <option value="">家具を選ぶ</option>
        {items.map((item, i) => (
          <option key={item.id} value={item.id}>
            {furnitureCatalog[item.kind].name} {i + 1}
          </option>
        ))}
      </select>
    </label>
  );
}
