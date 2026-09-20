"use client";
import Image from "next/image";
import Link from "next/link";
import "./start-screen.css";
import { SceneAtmosphere } from "./scene-atmosphere";
import { APP_VERSION } from "./app-version";

export function StartScreen({
  ready,
  error,
  onStart,
}: {
  ready: boolean;
  error: string;
  onStart: () => void;
}) {
  return (
    <main className="start-screen">
      <picture className="start-art">
        <source
          media="(orientation: portrait)"
          srcSet="/title/starlight-towers-portrait.webp"
          width={1024}
          height={1536}
        />
        {/* Keep the native picture fallback so portrait art direction is selected before hydration. */}
        <img
          src="/title/starlight-towers.webp"
          alt="星空の下、森と街道に星灯りの塔が点々と灯る風景"
          width={1536}
          height={1024}
          fetchPriority="high"
        />
      </picture>
      <SceneAtmosphere tone="night" />
      <h1 className="start-title">
        <Image
          className="start-logo"
          src="/title/starlit-guild-logo.webp"
          alt="星灯りの旅団 — STARLIT GUILD"
          width={1536}
          height={1024}
          priority
          unoptimized
        />
      </h1>
      <div className="start-entry">
        <button
          type="button"
          disabled={!ready && !error}
          aria-label={error ? "記録を確認する" : ready ? "冒険を始める" : "旅の支度中"}
          onClick={onStart}
        >
          {error ? "記録を確認する" : ready ? "- START -" : "- LOADING -"}
        </button>
        {error && <p role="alert">{error}</p>}
        <Link className="start-prototype" href="/battle-prototype">
          横スクロール戦闘を試す
        </Link>
        <span className="start-version">v{APP_VERSION}</span>
      </div>
    </main>
  );
}
