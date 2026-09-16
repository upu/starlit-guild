import { originalArt } from "@/lib/original-characters";
export function Sprite({
  index,
  size = 72,
  className = "",
}: {
  index: number;
  size?: number;
  className?: string;
}) {
  const art = originalArt(index);
  return (
    <span
      className={`sprite ${className}`}
      style={{
        width: size,
        height: size,
        ...(art
          ? {
              backgroundImage: `url(${art})`,
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundColor: "#172720",
              border: "1px solid #9e8655",
              borderRadius: "12%",
              boxSizing: "border-box" as const,
              imageRendering: "auto" as const,
            }
          : {
              backgroundPosition: `${String(((index % 4) * 100) / 3)}% ${String(Math.floor(index / 4) * 50)}%`,
            }),
      }}
      aria-hidden="true"
    />
  );
}
