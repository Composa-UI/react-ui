import { type ReactNode } from "react";
import { clsx } from "clsx";
import { Panel, ScrollArea } from "./Panel";

interface InspectorProps {
  /** Fixed zone above the scrolling sections (e.g. the zoom + Design/Animate tab row). */
  header?: ReactNode;
  /** The section stack. Compose PanelSection children in the order you want. */
  children?: ReactNode;
  className?: string;
  /** Accessible name for the inspector landmark. */
  "aria-label"?: string;
}

// Inspector — the composable right-rail shell.
//
// Where PropertyPanel derives its section set internally from capability flags,
// Inspector renders whatever sections it is given, in order: reorder, add,
// remove, or replace a section by changing `children`. That is the composition
// seam the design-system-slots workstream needs, delivered additively on the
// existing Panel + ScrollArea + PanelSection primitives — no new visual
// language, and PropertyPanel is left untouched for the capability-driven path.
export function Inspector({
  header,
  children,
  className,
  "aria-label": ariaLabel = "Inspector",
}: InspectorProps) {
  return (
    <Panel className={clsx("h-full min-h-0", className)}>
      <div role="complementary" aria-label={ariaLabel} className="flex flex-col flex-1 min-h-0">
        {header != null && <div className="shrink-0">{header}</div>}
        <ScrollArea>{children}</ScrollArea>
      </div>
    </Panel>
  );
}
