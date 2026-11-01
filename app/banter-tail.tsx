export function BanterTail({ waiting, notice }: { waiting: boolean; notice: string }) {
  return (
    <>
      {waiting && (
        <span className="banter-line" aria-label="会話はひと区切り">
          ……
        </span>
      )}
      {notice && (
        <span className="banter-line consumable-notice" role="status">
          {notice}
        </span>
      )}
    </>
  );
}
