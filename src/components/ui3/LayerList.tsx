import { useState } from "react";
import { clsx } from "clsx";
import { ChevronRight, Frame, Folder, Type, Component, Image as ImageIcon, Square, Eye, EyeOff, Lock } from "lucide-react";

// ─── Layer list ─────────────────────────────────────────────────────────────────
// A layers tree (Figma-style), componentized from the previous DS tree + Dark export.
// Light theme (c-* tokens). Data-driven: a LayerNode[] with nesting; each row =
// chevron (if group) · type icon · name · visibility/lock. Component/instance types
// use the purple accent.

const FONT = "font-[family-name:var(--composa-font-family)]";
const PURPLE = "#9747ff";

export type LayerType = "frame" | "group" | "text" | "component" | "instance" | "image" | "shape";

export interface LayerNode {
  id: string;
  name: string;
  type: LayerType;
  children?: LayerNode[];
  hidden?: boolean;
  locked?: boolean;
}

const TYPE_ICON: Record<LayerType, typeof Frame> = {
  frame: Frame, group: Folder, text: Type, component: Component, instance: Component, image: ImageIcon, shape: Square,
};

const DEMO_LAYERS: LayerNode[] = [
  { id: "1", name: "Top Buttons", type: "group", children: [
    { id: "1a", name: "minus button left", type: "instance" },
    { id: "1b", name: "minus button right", type: "instance" },
  ] },
  { id: "2", name: "Sheet", type: "frame", children: [
    { id: "2a", name: "Rem Face", type: "shape" },
    { id: "2b", name: "time highlight", type: "text" },
    { id: "2c", name: "date highlight", type: "text", hidden: true },
  ] },
  { id: "3", name: "Control + highlight indicator", type: "group", locked: true, children: [
    { id: "3a", name: "Background", type: "shape" },
  ] },
  { id: "4", name: "Motto", type: "text" },
  { id: "5", name: "Cover", type: "image" },
];

function LayerRow({ node, depth, selectedId, onSelect }: {
  node: LayerNode; depth: number; selectedId: string | null; onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = !!node.children?.length;
  const Icon = TYPE_ICON[node.type];
  const isComponent = node.type === "component" || node.type === "instance";
  const selected = selectedId === node.id;

  return (
    <>
      <div
        onClick={() => onSelect(node.id)}
        className={clsx(
          "group/layer flex items-center gap-[6px] h-[28px] pr-[8px] cursor-pointer select-none",
          selected ? "bg-c-bg-selected" : "hover:bg-c-bg-hover",
          node.hidden && "opacity-40",
        )}
        style={{ paddingLeft: 8 + depth * 16 }}
      >
        {/* disclosure */}
        {hasChildren ? (
          <button
            onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
            aria-label={open ? "Collapse" : "Expand"}
            className="size-[16px] flex items-center justify-center shrink-0 text-c-icon-secondary"
          >
            <ChevronRight size={12} strokeWidth={2} className={clsx("transition-transform", open && "rotate-90")} />
          </button>
        ) : (
          <span className="size-[16px] shrink-0" />
        )}
        {/* type icon */}
        <Icon size={16} strokeWidth={1.5} className="shrink-0" style={isComponent ? { color: PURPLE } : undefined} />
        {/* name */}
        <span className={clsx(FONT, "flex-1 min-w-0 text-[11px] font-[450] leading-[16px] truncate", isComponent ? "text-[#9747ff]" : "text-c-text")}>
          {node.name}
        </span>
        {/* trailing: lock (if locked) + visibility (hover or when hidden) */}
        {node.locked && <Lock size={14} strokeWidth={1.5} className="shrink-0 text-c-icon-secondary" />}
        {node.hidden
          ? <EyeOff size={14} strokeWidth={1.5} className="shrink-0 text-c-icon-secondary" />
          : <Eye size={14} strokeWidth={1.5} className="shrink-0 text-c-icon-secondary opacity-0 group-hover/layer:opacity-100" />}
      </div>
      {hasChildren && open && node.children!.map(c => (
        <LayerRow key={c.id} node={c} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </>
  );
}

export function LayerList({ layers = DEMO_LAYERS, title = "Layers" }: { layers?: LayerNode[]; title?: string }) {
  const [selected, setSelected] = useState<string | null>("2b");
  return (
    <div className="w-[240px] shrink-0 h-full flex flex-col bg-c-bg border-r border-c-border overflow-hidden">
      {/* header */}
      <div className="shrink-0 h-[40px] flex items-center px-[16px] border-b border-c-border">
        <span className={clsx(FONT, "text-[11px] font-[550] leading-[16px] text-c-text")}>{title}</span>
      </div>
      {/* tree */}
      <div className="flex-1 overflow-y-auto py-[4px]">
        {layers.map(n => (
          <LayerRow key={n.id} node={n} depth={0} selectedId={selected} onSelect={setSelected} />
        ))}
      </div>
    </div>
  );
}
