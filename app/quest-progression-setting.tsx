"use client";
import { Switch } from "@/components/ui/switch";

export function QuestProgressionSetting({
  checked,
  onChange,
  disabled,
  compact = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled: boolean;
  compact?: boolean;
}) {
  return (
    <div className="quest-progression-setting">
      <label className="switch-row">
        <span>Auto-Next</span>
        <Switch
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
          aria-label="Auto-Next"
        />
      </label>
      {!compact && <small>クリア後、次のステージへ自動で出発します。</small>}
    </div>
  );
}
