import { SquareDashed, Check } from "lucide-react";
import { useId, type ReactNode } from "react";

type Choice = {
  id: string;
  name: string;
  icon: ReactNode;
  badge?: string;
  muted?: boolean;
  learnable?: boolean;
};
function LearnableDot({ id }: { id: string }) {
  return <span className="character-learnable-dot" id={id} role="img" aria-label="習得できます" />;
}
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
  const statusId = useId();
  const options: Choice[] = [
    ...choices,
    {
      id: "empty",
      name: emptyLabel,
      icon: <SquareDashed className="empty-slot-icon" aria-hidden="true" />,
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
          aria-describedby={
            choice.badge || choice.learnable ? `${statusId}-${choice.id}` : undefined
          }
          title={choice.name}
          aria-pressed={selected === choice.id}
          onClick={() => {
            onSelect(choice.id);
          }}
        >
          {choice.icon}
          {choice.learnable && <LearnableDot id={`${statusId}-${choice.id}`} />}
          {choice.badge && (
            <span
              className="character-equipped-mark"
              id={`${statusId}-${choice.id}`}
              role="img"
              aria-label={choice.badge}
            >
              <Check aria-hidden="true" />
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
