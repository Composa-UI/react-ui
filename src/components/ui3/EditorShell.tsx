import type { ReactNode } from "react";
import { clsx } from "clsx";

// ─── Editor shell ─────────────────────────────────────────────────────────────
// The assembled Composa editor layout (the `?view=editor` playground study), as
// a real SLOTTED component so a consumer renders the ACTUAL kit layout — not a
// hand-ported re-creation — and only injects content into the slots. This is the
// single source of truth for the editor frame: header · [nav · left panel ·
// canvas (toolbar floats over it) · inspector] · docked timeline. Solid docked
// panels; the workspace shows through only in the canvas area.
//
// The canvas slot FILLS its column (the real editor drops a live canvas here);
// the study's centered 70% placeholder was demo-only.

export interface EditorShellProps {
  /** Optional top bar (app header). Omitted in the standalone kit study. */
  header?: ReactNode;
  /** Left navigation rail. */
  nav: ReactNode;
  /** Left panel content (Composition or Assets). */
  panel: ReactNode;
  /** Center canvas — fills the column. */
  canvas: ReactNode;
  /** Creation toolbar — floats bottom-center over the canvas. */
  toolbar?: ReactNode;
  /** Right inspector (PropertyPanel). */
  inspector: ReactNode;
  /** Docked timeline (full-bleed under the row). */
  timeline: ReactNode;
  /** Timeline height in px (0/undefined collapses to auto). */
  timelineHeight?: number;
  className?: string;
}

export function EditorShell({
  header,
  nav,
  panel,
  canvas,
  toolbar,
  inspector,
  timeline,
  timelineHeight = 220,
  className,
}: EditorShellProps) {
  return (
    <div className={clsx("h-full w-full flex flex-col bg-c-bg-secondary overflow-hidden", className)}>
      {header != null && <div className="shrink-0">{header}</div>}

      {/* Main row */}
      <div className="flex flex-1 min-h-0">
        {nav}
        {panel}

        {/* Canvas — the injected canvas fills this column; the toolbar floats. */}
        <div className="relative flex-1 min-w-0 min-h-0">
          {canvas}
          {toolbar != null && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2">
              {toolbar}
            </div>
          )}
        </div>

        {inspector}
      </div>

      {/* Timeline — full-bleed, docked */}
      <div className="shrink-0" style={{ height: timelineHeight || undefined }}>
        {timeline}
      </div>
    </div>
  );
}
