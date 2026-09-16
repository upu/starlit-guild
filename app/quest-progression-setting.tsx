"use client";
import { Switch } from "@/components/ui/switch";

export function QuestProgressionSetting({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div className="quest-progression-setting">
      <label className="switch-row">
        <span>クリア後、次のステージを行先にする</span>
        <Switch
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
          aria-label="クリア後、次のステージを行先にする"
        />
      </label>
      <small>物語を読み終えると切り替わります。出発は自分で選べます。</small>
    </div>
  );
}
