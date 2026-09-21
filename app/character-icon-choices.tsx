import { SquareDashed } from "lucide-react";
import type { ReactNode } from "react";

type Choice = { id: string; name: string; icon: ReactNode; badge?: string; muted?: boolean };
export function CharacterIconChoices({
  choices,
  selected,
  onSelect,
  label,
  emptyLabel,
}: {
  choices: Choice[];
  selected: string;
  onSelect: (id: string) => void;
  label: string;
  emptyLabel: string;
}) {
  const options: Choice[] = [
    ...choices,
    {
      id: "empty",
      name: emptyLabel,
      icon: <SquareDashed className="empty-slot-icon" aria-hidden="true" />,
      badge: "空",
    },
  ];
  return (
    <div className="character-icon-choices" role="group" aria-label={label}>
      {options.map((choice) => (
        <button
          key={choice.id}
          className="character-icon-choice"
          data-muted={choice.muted || undefined}
          aria-label={choice.name}
          title={choice.name}
          aria-pressed={selected === choice.id}
          onClick={() => {
            onSelect(choice.id);
          }}
        >
          {choice.icon}
          {choice.badge && <small>{choice.badge}</small>}
        </button>
      ))}
    </div>
  );
}
