import { useState } from "react";
import { clsx } from "clsx";
import { ThumbsUp, ThumbsDown, Info } from "lucide-react";

// ─── RatingBar ──────────────────────────────────────────────────────────────
// Thumbs up / down feedback row shown beneath an AI response, with a trailing
// info affordance. Single active vote at a time; clicking the active vote clears
// it. Controlled or uncontrolled (internal state when `vote`/`onVote` omitted).

export type RatingVote = "up" | "down" | null;

export interface RatingBarProps {
  vote?: RatingVote;
  onVote?: (vote: RatingVote) => void;
  className?: string;
}

function RatingButton({
  label,
  active,
  activeClass,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  activeClass: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={clsx(
        "size-[24px] shrink-0 rounded-c-md flex items-center justify-center outline-none transition-colors",
        "hover:bg-c-bg-hover focus-visible:ring-1 focus-visible:ring-c-focus-ring",
        active ? activeClass : "text-c-icon-tertiary",
      )}
    >
      {children}
    </button>
  );
}

export function RatingBar({ vote: controlledVote, onVote, className }: RatingBarProps) {
  const [internal, setInternal] = useState<RatingVote>(null);
  const vote = controlledVote !== undefined ? controlledVote : internal;

  const setVote = (next: RatingVote) => {
    if (controlledVote === undefined) setInternal(next);
    onVote?.(next);
  };

  return (
    <div className={clsx("mt-[4px] w-full flex items-center", className)}>
      <RatingButton
        label="Thumbs up"
        active={vote === "up"}
        activeClass="text-c-text-brand"
        onClick={() => setVote(vote === "up" ? null : "up")}
      >
        <ThumbsUp size={16} strokeWidth={2} />
      </RatingButton>
      <RatingButton
        label="Thumbs down"
        active={vote === "down"}
        activeClass="text-c-text-danger"
        onClick={() => setVote(vote === "down" ? null : "down")}
      >
        <ThumbsDown size={16} strokeWidth={2} />
      </RatingButton>
      <button
        type="button"
        aria-label="Response info"
        className="ml-auto size-[24px] shrink-0 rounded-c-md flex items-center justify-center text-c-icon-tertiary outline-none transition-colors hover:bg-c-bg-hover focus-visible:ring-1 focus-visible:ring-c-focus-ring"
      >
        <Info size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
