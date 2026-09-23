import { type ReactNode } from "react";
import { clsx } from "clsx";

export interface EditorShellProps {
  /** Far-left icon navigation rail (e.g. `NavRail`). */
  navRail?: ReactNode;
  /** The resizable left panel: composition / layers / assets / agent. Owns its own width. */
  leftPanel?: ReactNode;
  /** The document surface. The only region that grows to fill remaining space. */
  canvas?: ReactNode;
  /** The right inspector rail (e.g. `Inspector` / `PropertyPanel`). Owns its own width. */
  inspector?: ReactNode;
  /**
   * The bottom timeline strip. Omit it entirely for a tool that has no timeline
   * (e.g. a doc editor) — the workspace row then fills the full height, and no
   * other region moves. This is the seam that keeps the shell document-agnostic.
   */
  timeline?: ReactNode;
  /**
   * Floating chrome layered over the shell: creation toolbars, notifications, the
   * help button, portalled dialogs. Rendered last so it stacks above the regions.
   */
  overlays?: ReactNode;
  /**
   * Mark the workspace row as the overlay collision boundary the DS's anchored
   * overlays (`AnchoredInspectorOverlay`, inspector dialogs) resolve within, so a
   * menu opened at the inspector's edge stays inside the workspace rather than the
   * viewport. Defaults to `true`, matching the Composa editor. Set `false` only if
   * the host provides its own boundary further out.
   */
  overlayBoundary?: boolean;
  className?: string;
  /** Accessible name for the editor region group. */
  "aria-label"?: string;
}

// EditorShell — the editor screen, published by the design system.
//
// Where `ComposaApp` hand-assembles its top-level layout inline (nav rail, left
// panel, canvas `<main>`, inspector, then a timeline strip and floating chrome),
// EditorShell owns that arrangement as a template with named region slots. A host
// fills each slot; the shell owns the geometry — the workspace row (nav rail |
// left panel | canvas | inspector) over an optional timeline strip, with overlays
// stacked on top. Change one region's content and nothing else moves; drop the
// timeline and a second Figma-mental-model tool (a doc editor) reuses the same
// shell. Presentational and state-free, like every other kit component: the host
// still owns the data model, width persistence, and wiring.
//
// Additive: this ships the template from `@composa/ui`. Rewiring `ComposaApp` to
// fill these slots through adapters is a separate, maintainer-owned step.
export function EditorShell({
  navRail,
  leftPanel,
  canvas,
  inspector,
  timeline,
  overlays,
  overlayBoundary = true,
  className,
  "aria-label": ariaLabel = "Editor",
}: EditorShellProps) {
  return (
    <div
      // A plain labelled grouping, NOT role="application": application would
      // switch AT into forms/application mode and hide the very inner landmarks
      // the shell is built to preserve (canvas = main, inspector = complementary).
      // group names the workspace without suppressing that landmark navigation.
      role="group"
      aria-label={ariaLabel}
      className={clsx("relative flex flex-col h-full min-h-0 overflow-hidden", className)}
    >
      <div
        className="flex flex-1 min-h-0"
        {...(overlayBoundary ? { "data-composa-overlay-boundary": "" } : {})}
      >
        {navRail != null && (
          <div data-editor-region="navRail" className="shrink-0">
            {navRail}
          </div>
        )}
        {leftPanel != null && (
          <div data-editor-region="leftPanel" className="shrink-0">
            {leftPanel}
          </div>
        )}
        {canvas != null && (
          <div data-editor-region="canvas" className="relative flex-1 min-w-0 min-h-0">
            {canvas}
          </div>
        )}
        {inspector != null && (
          <div data-editor-region="inspector" className="shrink-0">
            {inspector}
          </div>
        )}
      </div>
      {timeline != null && (
        <div data-editor-region="timeline" className="shrink-0">
          {timeline}
        </div>
      )}
      {overlays}
    </div>
  );
}
