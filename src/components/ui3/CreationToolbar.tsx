import { useState, useEffect, type ReactNode } from "react";
import { clsx } from "clsx";
import {
  MousePointer2, Hand, Frame, Square, Circle, Minus,
  Type, ChevronDown,
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
// A single button showing the group's current tool icon. When `menu` items are
// supplied it becomes a MenuButton: a small chevron indicates the sub-menu, and
// clicking the button opens it. Active groups take the accent/filled state.

interface MenuItem {
  tool: ToolId;
  active: boolean;
}

interface ToolGroupButtonProps {
  /** The tool whose icon the button currently shows (last-used in group). */
  tool: ToolId;
  active: boolean;
  /** Sub-menu items — when present the button gains a chevron + menu. */
  menu?: MenuItem[];
  onSelect: (tool: ToolId) => void;
}

function ToolGroupButton({ tool, active, menu, onSelect }: ToolGroupButtonProps) {
  const [open, setOpen] = useState(false);
  const { icon, label } = TOOLS[tool];
  const hasMenu = !!menu && menu.length > 0;

  const handleClick = () => {
    if (hasMenu) {
      // Open the menu; also (re)activate the group's current tool.
      setOpen(v => !v);
      onSelect(tool);
    } else {
      onSelect(tool);
    }
  };

  return (
    <div className="relative flex items-stretch">
      <button
        aria-label={hasMenu ? `${label} tools` : label}
        aria-haspopup={hasMenu ? "menu" : undefined}
        aria-expanded={hasMenu ? open : undefined}
        aria-pressed={active}
        onClick={handleClick}
        className={clsx(
          "relative flex items-center justify-center gap-[2px] shrink-0",
          "h-[32px] rounded-c-md px-[6px]",
          "transition-colors duration-100 outline-none",
          "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-c-focus-ring",
          active
            ? "bg-c-bg-brand text-white"
            : "text-c-icon hover:bg-c-bg-hover active:bg-c-bg-secondary",
        )}
      >
        {icon}
        {hasMenu && (
          <ChevronDown
            size={10}
            strokeWidth={2}
            className={active ? "text-white/80" : "text-c-icon-secondary"}
          />
        )}
      </button>

      {/* Floating sub-menu — opens upward (toolbar floats above canvas). */}
      {hasMenu && open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 z-50">
            <Menu minWidth={180}>
              {menu!.map(({ tool: t, active: a }) => {
                const item = TOOLS[t];
                return (
                  <MenuRow
                    key={t}
                    type="checkmark"
                    label={item.label}
                    shortcut={item.shortcut}
                    checked={a}
                    leading={item.icon}
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
