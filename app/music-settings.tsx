"use client";
import { Music2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { musicTitles } from "@/lib/music";
import type { useGameMusic } from "./use-game-music";

export function MusicSettings({
  music,
  disabled,
}: {
  music: ReturnType<typeof useGameMusic>;
  disabled: boolean;
}) {
  return (
    <section className="music-settings">
      <label className="switch-row">
        <span>
          <Music2 size={15} /> BGM
        </span>
        <Switch
          checked={music.preferences.enabled}
          disabled={disabled}
          onCheckedChange={music.setEnabled}
          aria-label="BGM"
        />
      </label>
      <div className="music-volume">
        <span id="music-volume-label">BGMの音量</span>
        <output>{music.preferences.volume}%</output>
      </div>
      <Slider
        aria-label="BGMの音量"
        min={0}
        max={100}
        step={5}
        value={[music.preferences.volume]}
        onValueChange={([value]) => {
          music.setVolume(value);
        }}
        disabled={disabled || !music.preferences.enabled}
      />
      <small>
        {music.preferences.enabled ? musicTitles[music.scene] : "BGMはオフです"}
        <br />
        拠点と探索で曲が変わります。音量はこの端末に保存します。
      </small>
      {music.error && <p role="status">{music.error}</p>}
    </section>
  );
}
