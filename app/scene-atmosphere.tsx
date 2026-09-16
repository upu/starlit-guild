import type { CSSProperties } from "react";

// Fixed positions keep the server and client render identical.
export function SceneAtmosphere({ tone = "forest" }: { tone?: "forest" | "night" | "hearth" }) {
  return (
    <div className={`scene-atmosphere atmosphere-${tone}`} aria-hidden="true">
      <div className="scene-light" />
      {Array.from({ length: 10 }, (_, i) => (
        <i
          key={i}
          style={
            {
              left: `${String(7 + ((i * 29) % 88))}%`,
              top: `${String(12 + ((i * 17) % 76))}%`,
              "--drift-delay": `${String(-i * 1.7)}s`,
              "--drift-duration": `${String(9 + (i % 4) * 3)}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
