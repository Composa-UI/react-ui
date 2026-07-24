import { useState } from "react";
import { clsx } from "clsx";
import { Button } from "./Button";

const FONT = "font-[family-name:var(--composa-font-family)]";

// ─── UndoCard ─────────────────────────────────────────────────────────────────
// Shown below an agent response that edited the canvas: a version label and an
// Undo/Redo toggle. Controlled via `reverted`/`onToggle`, else internal state.

export interface UndoCardProps {
  reverted?: boolean;
  onToggle?: (reverted: boolean) => void;
  className?: string;
}

export function UndoCard({ reverted: controlledReverted, onToggle, className }: UndoCardProps) {
  const [internal, setInternal] = useState(false);
  const reverted = controlledReverted !== undefined ? controlledReverted : internal;

  const toggle = () => {
    const next = !reverted;
    if (controlledReverted === undefined) setInternal(next);
    onToggle?.(next);
  };

  return (
    <div className={clsx("w-full overflow-hidden rounded-c-lg ring-1 ring-inset ring-c-border", className)}>
      <div className="flex items-center justify-between px-[13px] py-[9px]">
        <p className={clsx(FONT, "text-[13px] leading-[22px] font-[450] tracking-[-0.032px] text-c-text-secondary")}>
          {reverted ? "Reverted" : "Current version"}
        </p>
        <Button variant="Secondary" size="default" label={reverted ? "Redo" : "Undo"} onClick={toggle} />
      </div>
    </div>
  );
}
