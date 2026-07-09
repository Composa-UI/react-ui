import { useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { MousePointer2, Frame, Type, Image as ImageIcon, Square, Table, MessageCircle, Sparkles, Plus } from "lucide-react";

// ─── Navigation / tool rail ─────────────────────────────────────────────────────
// Vertical icon rail for the editor's left edge (tool switches), componentized from
// the previous DS toolbelt + Dark export. Light theme. 48px wide, 32px icon buttons;
// the active tool uses the accent selection (bg-c-bg-selected + text-c-text-brand).

export interface NavTool {
  id: string;
  icon: ReactNode;
  label: string;
}

const S = 16;
const DEFAULT_TOOLS: NavTool[] = [
  { id: "select",   icon: <MousePointer2 size={S} strokeWidth={1.5} />, label: "Move" },
  { id: "frame",    icon: <Frame size={S} strokeWidth={1.5} />,         label: "Frame" },
  { id: "text",     icon: <Type size={S} strokeWidth={1.5} />,          label: "Text" },
  { id: "image",    icon: <ImageIcon size={S} strokeWidth={1.5} />,     label: "Image" },
  { id: "shape",    icon: <Square size={S} strokeWidth={1.5} />,        label: "Shape" },
  { id: "table",    icon: <Table size={S} strokeWidth={1.5} />,         label: "Table" },
  { id: "comment",  icon: <MessageCircle size={S} strokeWidth={1.5} />, label: "Comment" },
  { id: "magic",    icon: <Sparkles size={S} strokeWidth={1.5} />,      label: "Generate" },
];

export function NavRail({
  tools = DEFAULT_TOOLS,
  defaultActive = "select",
  active: controlled,
  onSelect,
  footer,
}: {
  tools?: NavTool[];
  defaultActive?: string;
  active?: string;
  onSelect?: (id: string) => void;
  footer?: ReactNode;
}) {
  const [internal, setInternal] = useState(defaultActive);
  const active = controlled ?? internal;
  const select = (id: string) => { if (controlled === undefined) setInternal(id); onSelect?.(id); };

  return (
    <div className="w-[48px] shrink-0 h-full flex flex-col items-center py-[8px] bg-c-bg border-r border-c-border">
      <div className="flex flex-col items-center gap-[4px]">
        {tools.map(t => (
          <button
            key={t.id}
            onClick={() => select(t.id)}
            aria-label={t.label}
            aria-pressed={active === t.id}
            className={clsx(
              "size-[32px] rounded-c-md flex items-center justify-center transition-colors",
              active === t.id ? "bg-c-bg-selected text-c-text-brand" : "text-c-icon hover:bg-c-bg-hover",
            )}
          >
            {t.icon}
          </button>
        ))}
      </div>
      <div className="flex-1" />
      {footer ?? (
        <button aria-label="Add" className="size-[32px] rounded-c-md flex items-center justify-center bg-c-bg-secondary text-c-icon hover:bg-c-bg-hover">
          <Plus size={S} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
