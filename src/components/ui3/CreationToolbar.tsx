import { useState, useEffect, type ReactNode } from "react";
import { clsx } from "clsx";
import {
  MousePointer2, Hand, Frame, Square, Circle, Minus,
  Type,
} from "lucide-react";
import { Menu, MenuRow } from "./Menu";

// ─── Types ────────────────────────────────────────────────────────────────────
// Creation toolbar — floating pill of tool groups (see spec: creation-toolbar.md).
// Groups, left→right: Move ▾ (Move/Hand) · Region ▾ (Frame) · Shape ▾
// (Rectangle/Ellipse/Line) · Type. Each group's button reflects the last-used
// tool in that group and shows an accent/filled state when any of its tools is
// active. Presentational: controlled `activeTool` + `onToolChange`.

export type ToolId =
  | "move" | "hand"
  | "frame"
  | "rectangle" | "ellipse" | "line"
  | "text";

interface Tool {
  id: ToolId;
  icon: ReactNode;
  label: string;
  shortcut: string;
}

// ─── Tool registry ────────────────────────────────────────────────────────────

const TOOLS: Record<ToolId, Tool> = {
  move:      { id: "move",      icon: <MousePointer2 size={16} strokeWidth={1.5} />, label: "Move",      shortcut: "V" },
  hand:      { id: "hand",      icon: <Hand          size={16} strokeWidth={1.5} />, label: "Hand",      shortcut: "H" },
  frame:     { id: "frame",     icon: <Frame         size={16} strokeWidth={1.5} />, label: "Frame",     shortcut: "F" },
  rectangle: { id: "rectangle", icon: <Square        size={16} strokeWidth={1.5} />, label: "Rectangle", shortcut: "R" },
  ellipse:   { id: "ellipse",   icon: <Circle        size={16} strokeWidth={1.5} />, label: "Ellipse",   shortcut: "O" },
  line:      { id: "line",      icon: <Minus         size={16} strokeWidth={1.5} />, label: "Line",      shortcut: "L" },
  text:      { id: "text",      icon: <Type          size={16} strokeWidth={1.5} />, label: "Text",      shortcut: "T" },
};

// Keyboard shortcut → tool. (Spec: Keyboard shortcuts.)
const SHORTCUTS: Record<string, ToolId> = {
  v: "move", h: "hand", f: "frame",
  r: "rectangle", o: "ellipse", l: "line", t: "text",
};

// ─── Tool group button ─────────────────────────────────────────────────────────
// A tool group is a SPLIT BUTTON (see SplitButton.tsx for the base pattern):
//   • primary segment — the tool icon; clicking selects/activates the tool and
//     carries the active/accent state.
//   • chevron segment — a DISTINCT division (thin separator between them);
//     clicking only opens the upward sub-menu. Never carries the active state.
// Groups with a single tool and no menu (Type) render as a plain button instead.

interface MenuItem {
  tool: ToolId;
  active: boolean;
}

interface ToolGroupButtonProps {
  /** The tool whose icon the button currently shows (last-used in group). */
  tool: ToolId;
  active: boolean;
  /** Sub-menu items — when present the button becomes a split button. */
  menu?: MenuItem[];
  onSelect: (tool: ToolId) => void;
}

// Standard "has a menu" chevron-down affordance (the menu itself opens upward
// since the toolbar floats above the canvas, but the indicator stays conventional).
function ChevronDownGlyph() {
  return (
    <svg width="6" height="4" viewBox="0 0 6 4" fill="none" aria-hidden>
      <path d="M0.5 0.5L3 3L5.5 0.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ToolGroupButton({ tool, active, menu, onSelect }: ToolGroupButtonProps) {
  const [open, setOpen] = useState(false);
  const { icon, label } = TOOLS[tool];
  const hasMenu = !!menu && menu.length > 0;

  // Close on outside-click / Escape while open (mirrors PopoverMenu behaviour).
  // We keep a self-contained popover here because the shared PopoverMenu only
  // opens downward, and this toolbar floats above the canvas so its sub-menus
  // must open upward.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // ── Plain button (single tool, no menu — e.g. Type) ──────────────────────
  if (!hasMenu) {
    return (
      <button
        aria-label={label}
        aria-pressed={active}
        onClick={() => onSelect(tool)}
        className={clsx(
          "relative flex items-center justify-center shrink-0",
          "h-[32px] w-[32px] rounded-c-md",
          "transition-colors duration-100 outline-none",
          "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-c-focus-ring",
          active
            ? "bg-c-bg-brand text-c-text-on-brand"
            : "text-c-icon hover:bg-c-bg-hover active:bg-c-bg-secondary",
        )}
      >
        {icon}
      </button>
    );
  }

  // ── Split button (primary tool segment + separate chevron segment) ───────
  return (
    <div className="relative flex items-stretch">
      {/* gap-px reveals a thin separator (the container bg) between segments,
          matching SplitButton.tsx. */}
      <div className="flex items-stretch gap-px h-[32px] rounded-c-md overflow-hidden bg-c-bg-secondary">
        {/* Primary segment — selects/activates the tool; carries active state. */}
        <button
          aria-label={label}
          aria-pressed={active}
          onClick={() => onSelect(tool)}
          className={clsx(
            "relative flex items-center justify-center shrink-0",
            "h-full px-[6px]",
            "transition-colors duration-100 outline-none",
            "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-c-focus-ring",
            active
              // Active = a fully-rounded accent pill (all 4 corners), distinct from
              // the neutral chevron segment sitting beside it.
              ? "bg-c-bg-brand text-c-text-on-brand rounded-c-md"
              : "bg-c-bg text-c-icon hover:bg-c-bg-hover active:bg-c-bg-secondary rounded-l-c-md",
          )}
        >
          {icon}
        </button>

        {/* Chevron segment — opens the menu only; never carries active state. */}
        <button
          aria-label={`${label} tools`}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          className={clsx(
            "flex items-center justify-center self-stretch w-[16px] shrink-0",
            "rounded-r-c-md transition-colors duration-100 outline-none",
            "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-c-focus-ring",
            "bg-c-bg text-c-icon-secondary hover:bg-c-bg-hover active:bg-c-bg-secondary",
            open && "bg-c-bg-hover",
          )}
        >
          <ChevronDownGlyph />
        </button>
      </div>

      {/* Floating sub-menu — opens upward (toolbar floats above canvas). */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 z-50">
            <Menu minWidth={180}>
              {menu!.map(({ tool: t, active: a }) => {
                const item = TOOLS[t];
                return (
                  <MenuRow
                    key={t}
                    // Fixed Menu rows (see Menu.tsx): checkmark type reserves a
                    // LEFT accent-check slot, renders the leading tool icon AFTER
                    // it, then the label, then a right-aligned shortcut →
                    // [check] [icon] [label] … [shortcut].
                    type="checkmark"
                    label={item.label}
                    leading={item.icon}
                    checked={a}
                    shortcut={item.shortcut}
                    onClick={() => {
                      onSelect(t);
                      setOpen(false);
                    }}
                  />
                );
              })}
            </Menu>
          </div>
        </>
      )}
    </div>
  );
}

// ─── CreationToolbar ──────────────────────────────────────────────────────────
// Self-contained floating pill: rounded, elevated, centered over the canvas.

export interface CreationToolbarProps {
  /** Controlled active tool. Defaults to "move" when uncontrolled. */
  activeTool?: ToolId;
  onToolChange?: (tool: ToolId) => void;
  className?: string;
}

export function CreationToolbar({
  activeTool: activeToolProp,
  onToolChange,
  className,
}: CreationToolbarProps) {
  const [activeTool, setActiveTool] = useState<ToolId>(activeToolProp ?? "move");

  // Keep in sync with the controlled prop.
  useEffect(() => {
    if (activeToolProp !== undefined) setActiveTool(activeToolProp);
  }, [activeToolProp]);

  const selectTool = (id: ToolId) => {
    setActiveTool(id);
    onToolChange?.(id);
  };

  const isActive = (id: ToolId) => activeTool === id;

  // Keyboard shortcuts (spec: V/H/F/R/O/L/T, Escape → Move).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") {
        if (activeTool !== "move") selectTool("move");
        return;
      }
      const tool = SHORTCUTS[e.key.toLowerCase()];
      // Pressing a tool's own shortcut while already active is a no-op.
      if (tool && tool !== activeTool) selectTool(tool);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  // Group active state — true when any of the group's tools is active.
  const moveActive  = isActive("move") || isActive("hand");
  const shapeActive = isActive("rectangle") || isActive("ellipse") || isActive("line");

  // Group button icon follows the last-used tool in the group.
  const moveTool: ToolId  = isActive("hand") ? "hand" : "move";
  const shapeTool: ToolId = isActive("ellipse") ? "ellipse"
    : isActive("line") ? "line"
    : "rectangle";

  return (
    <div
      role="toolbar"
      aria-label="Creation tools"
      className={clsx(
        "inline-flex items-center gap-[2px]",
        "bg-c-bg rounded-c-lg p-[6px]",
        "ring-1 ring-inset ring-c-border-translucent",
        "shadow-[0px_0px_0.5px_rgba(0,0,0,0.18),0px_3px_8px_rgba(0,0,0,0.12),0px_1px_2px_rgba(0,0,0,0.1)]",
        className,
      )}
    >
      {/* Move ▾ — Move / Hand */}
      <ToolGroupButton
        tool={moveTool}
        active={moveActive}
        menu={[
          { tool: "move", active: isActive("move") },
          { tool: "hand", active: isActive("hand") },
        ]}
        onSelect={selectTool}
      />

      {/* Region ▾ — Frame */}
      <ToolGroupButton
        tool="frame"
        active={isActive("frame")}
        menu={[{ tool: "frame", active: isActive("frame") }]}
        onSelect={selectTool}
      />

      {/* Shape ▾ — Rectangle / Ellipse / Line */}
      <ToolGroupButton
        tool={shapeTool}
        active={shapeActive}
        menu={[
          { tool: "rectangle", active: isActive("rectangle") },
          { tool: "ellipse",   active: isActive("ellipse") },
          { tool: "line",      active: isActive("line") },
        ]}
        onSelect={selectTool}
      />

      {/* Type — single IconButton (no menu in V1) */}
      <ToolGroupButton
        tool="text"
        active={isActive("text")}
        onSelect={selectTool}
      />
    </div>
  );
}
