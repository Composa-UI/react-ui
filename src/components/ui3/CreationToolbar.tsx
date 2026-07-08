import { useState, useEffect } from "react";
import { clsx } from "clsx";
import {
  MousePointer2, Hand, Hash, Square, Circle, Minus,
  Pen, Type, MessageCircle, Zap, Package,
  ChevronDown, LayoutGrid, Columns,
} from "lucide-react";
import { Menu, MenuRow } from "./Menu";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToolId = "move" | "hand" | "frame" | "rectangle" | "ellipse" | "line" | "pen" | "text" | "comment" | "actions";

interface Tool {
  id: ToolId;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

// ─── Tool registry ────────────────────────────────────────────────────────────

const TOOLS: Record<ToolId, Tool> = {
  move:      { id: "move",      icon: <MousePointer2 size={16} strokeWidth={1.5} />, label: "Move",      shortcut: "V" },
  hand:      { id: "hand",      icon: <Hand          size={16} strokeWidth={1.5} />, label: "Hand",      shortcut: "H" },
  frame:     { id: "frame",     icon: <Hash          size={16} strokeWidth={1.5} />, label: "Frame",     shortcut: "F" },
  rectangle: { id: "rectangle", icon: <Square        size={16} strokeWidth={1.5} />, label: "Rectangle", shortcut: "R" },
  ellipse:   { id: "ellipse",   icon: <Circle        size={16} strokeWidth={1.5} />, label: "Ellipse",   shortcut: "O" },
  line:      { id: "line",      icon: <Minus         size={16} strokeWidth={1.5} />, label: "Line",      shortcut: "L" },
  pen:       { id: "pen",       icon: <Pen           size={16} strokeWidth={1.5} />, label: "Pen",       shortcut: "P" },
  text:      { id: "text",      icon: <Type          size={16} strokeWidth={1.5} />, label: "Text",      shortcut: "T" },
  comment:   { id: "comment",   icon: <MessageCircle size={16} strokeWidth={1.5} />, label: "Comment",   shortcut: "C" },
  actions:   { id: "actions",   icon: <Zap           size={16} strokeWidth={1.5} />, label: "Actions" },
};

// ─── Tool group button (MenuButton or single) ─────────────────────────────────
// Main tool icon + optional small chevron for sub-menu

interface ToolGroupButtonProps {
  toolId: ToolId;
  isActive: boolean;
  hasMenu?: boolean;
  menuContent?: React.ReactNode;
  onClick: () => void;
}

function ToolGroupButton({
  toolId,
  isActive,
  hasMenu = false,
  menuContent,
  onClick,
}: ToolGroupButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const tool = TOOLS[toolId];

  return (
    <div className="relative flex items-stretch h-full">
      {/* Main tool button */}
      <button
        aria-label={tool.label}
        onClick={onClick}
        className={clsx(
          "flex items-center justify-center rounded-c-sm p-[4px]",
          "transition-colors outline-none",
          isActive
            ? "bg-c-bg-brand text-white"
            : "text-c-icon hover:bg-c-bg-hover",
        )}
      >
        {tool.icon}
      </button>

      {/* Chevron expander (for tools with sub-menus) */}
      {hasMenu && (
        <button
          aria-label={`${tool.label} tools`}
          onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
          className={clsx(
            "flex items-center justify-center w-[14px] rounded-c-sm",
            "text-c-icon-secondary hover:bg-c-bg-hover transition-colors",
          )}
        >
          <ChevronDown size={8} strokeWidth={2} />
        </button>
      )}

      {/* Floating menu */}
      {menuOpen && menuContent && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute bottom-[calc(100%+4px)] left-0 z-50">
            {menuContent}
          </div>
        </>
      )}
    </div>
  );
}

// ─── View toggle (right section) ─────────────────────────────────────────────

type ViewMode = "design" | "prototype";

function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange?: (v: ViewMode) => void;
}) {
  return (
    <div className="flex items-center bg-c-bg-secondary rounded-c-sm p-[2px] gap-[1px]">
      <button
        aria-label="Design view"
        onClick={() => onChange?.("design")}
        className={clsx(
          "flex items-center justify-center size-[28px] rounded-[3px] transition-colors",
          value === "design"
            ? "bg-c-bg shadow-c-100 text-c-icon"
            : "text-c-icon-secondary hover:text-c-icon",
        )}
      >
        <Columns size={14} strokeWidth={1.5} />
      </button>
      <button
        aria-label="Prototype view"
        onClick={() => onChange?.("prototype")}
        className={clsx(
          "flex items-center justify-center size-[28px] rounded-[3px] transition-colors",
          value === "prototype"
            ? "bg-c-bg-brand text-white"
            : "text-c-icon-secondary hover:text-c-icon",
        )}
      >
        <LayoutGrid size={14} strokeWidth={1.5} />
      </button>
    </div>
  );
}

// ─── CreationToolbar ──────────────────────────────────────────────────────────
// Bottom toolbar. White pill, rounded-large (13px), elevation drop-shadow.
// Tool groups: Move ▾ | Frame | Shape ▾ | Pen ▾ | Type ▾ | Comment | Actions | Assets
// Right section: view mode segmented control

export interface CreationToolbarProps {
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
  const [viewMode, setViewMode] = useState<ViewMode>("prototype");

  // Keep in sync with controlled prop
  useEffect(() => {
    if (activeToolProp !== undefined) setActiveTool(activeToolProp);
  }, [activeToolProp]);

  const selectTool = (id: ToolId) => {
    setActiveTool(id);
    onToolChange?.(id);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const map: Partial<Record<string, ToolId>> = {
        v: "move", h: "hand", f: "frame",
        r: "rectangle", o: "ellipse", l: "line",
        p: "pen", t: "text",
      };
      const tool = map[e.key.toLowerCase()];
      if (tool) selectTool(tool);
      if (e.key === "Escape") selectTool("move");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const isActive = (id: ToolId) => activeTool === id;
  // Group active state — true if any tool in this group is active
  const moveActive  = isActive("move") || isActive("hand");
  const shapeActive = isActive("rectangle") || isActive("ellipse") || isActive("line");
  const penActive   = isActive("pen");
  const textActive  = isActive("text");

  // Active group icon follows last-used tool in group
  const moveIcon  = isActive("hand") ? TOOLS.hand.icon : TOOLS.move.icon;
  const shapeIcon = isActive("ellipse") ? TOOLS.ellipse.icon
    : isActive("line") ? TOOLS.line.icon
    : TOOLS.rectangle.icon;

  const FONT = "font-[family-name:var(--composa-font-family)]";

  return (
    <div
      className={clsx(
        "inline-flex items-center bg-c-bg rounded-c-lg",
        "shadow-[0px_0px_0.5px_rgba(0,0,0,0.18),0px_3px_4px_rgba(0,0,0,0.1),0px_1px_1.5px_rgba(0,0,0,0.1)]",
        className,
      )}
    >
      {/* ── Tool buttons (left section) ── */}
      <div className="flex items-center gap-[8px] p-[8px] h-[48px]">

        {/* Move ▾ — Move / Hand */}
        <ToolGroupButton
          toolId={moveActive && isActive("hand") ? "hand" : "move"}
          isActive={moveActive}
          hasMenu
          onClick={() => selectTool(isActive("hand") ? "hand" : "move")}
          menuContent={
            <Menu minWidth={160}>
              <MenuRow
                label="Move"
                shortcut="V"
                type="checkmark"
                checked={isActive("move")}
                onClick={() => selectTool("move")}
              />
              <MenuRow
                label="Hand"
                shortcut="H"
                type="checkmark"
                checked={isActive("hand")}
                onClick={() => selectTool("hand")}
              />
            </Menu>
          }
        />

        {/* Frame (single) */}
        <ToolGroupButton
          toolId="frame"
          isActive={isActive("frame")}
          onClick={() => selectTool("frame")}
        />

        {/* Shape ▾ — Rectangle / Ellipse / Line */}
        <ToolGroupButton
          toolId={isActive("ellipse") ? "ellipse" : isActive("line") ? "line" : "rectangle"}
          isActive={shapeActive}
          hasMenu
          onClick={() => selectTool(isActive("ellipse") ? "ellipse" : isActive("line") ? "line" : "rectangle")}
          menuContent={
            <Menu minWidth={160}>
              <MenuRow label="Rectangle" shortcut="R" type="checkmark" checked={isActive("rectangle")} onClick={() => selectTool("rectangle")} />
              <MenuRow label="Ellipse"   shortcut="O" type="checkmark" checked={isActive("ellipse")}   onClick={() => selectTool("ellipse")} />
              <MenuRow label="Line"      shortcut="L" type="checkmark" checked={isActive("line")}      onClick={() => selectTool("line")} />
            </Menu>
          }
        />

        {/* Pen ▾ */}
        <ToolGroupButton
          toolId="pen"
          isActive={penActive}
          hasMenu
          onClick={() => selectTool("pen")}
          menuContent={
            <Menu minWidth={140}>
              <MenuRow label="Pen" shortcut="P" type="checkmark" checked onClick={() => selectTool("pen")} />
            </Menu>
          }
        />

        {/* Text ▾ */}
        <ToolGroupButton
          toolId="text"
          isActive={textActive}
          hasMenu
          onClick={() => selectTool("text")}
          menuContent={
            <Menu minWidth={140}>
              <MenuRow label="Text" shortcut="T" type="checkmark" checked onClick={() => selectTool("text")} />
            </Menu>
          }
        />

        {/* Comment (single) */}
        <ToolGroupButton
          toolId="comment"
          isActive={isActive("comment")}
          onClick={() => selectTool("comment")}
        />

        {/* Actions (single) */}
        <ToolGroupButton
          toolId="actions"
          isActive={isActive("actions")}
          onClick={() => selectTool("actions")}
        />

        {/* Assets — pill icon */}
        <button
          aria-label="Assets"
          className={clsx(
            "flex items-center justify-center rounded-full size-[32px] p-[4px]",
            "bg-c-bg-secondary text-c-icon hover:bg-c-bg-hover transition-colors",
          )}
        >
          <Package size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* ── Divider ── */}
      <div className="w-px h-[32px] bg-c-border" />

      {/* ── View mode toggle (right section) ── */}
      <div className="flex items-center justify-center p-[8px]">
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </div>
    </div>
  );
}
