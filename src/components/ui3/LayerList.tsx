import { useState } from "react";
import { clsx } from "clsx";
import { ChevronRight, Frame, Folder, Type, Component, Image as ImageIcon, Square, Eye, EyeOff, LockOpen } from "lucide-react";
import { Lock as LockDuotone } from "@phosphor-icons/react";
import { ScrollArea } from "./Panel";

// ─── Layer list ─────────────────────────────────────────────────────────────────
// A layers tree (Figma-style), componentized from the previous DS tree + Dark export.
// Light theme (c-* tokens). Data-driven: a LayerNode[] with nesting; each row =
// chevron (if group) · type icon · name · visibility/lock. Component/instance types
// use the purple accent.

const FONT = "font-[family-name:var(--composa-font-family)]";

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
        role="treeitem"
        tabIndex={0}
        aria-selected={selected}
        aria-expanded={hasChildren ? open : undefined}
        onClick={() => onSelect(node.id)}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(node.id); }
          else if (e.key === "ArrowRight" && hasChildren && !open) setOpen(true);
          else if (e.key === "ArrowLeft" && hasChildren && open) setOpen(false);
        }}
        className={clsx(
          "group/layer relative flex items-center gap-[6px] h-[30px] pr-[8px] cursor-pointer select-none outline-none focus-visible:ring-1 focus-visible:ring-c-border-selected",
          !selected && "hover:bg-c-bg-hover",
          node.hidden && "opacity-40",
        )}
        style={{ paddingLeft: 8 + depth * 16 }}
      >
        {/* contained selection pill — inset from row edges, small radius */}
        {selected && <span aria-hidden className="pointer-events-none absolute inset-y-[2px] left-[4px] right-[4px] rounded-c-sm bg-c-bg-selected" />}
        {/* disclosure */}
        {hasChildren ? (
          <button
            onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
            aria-label={open ? "Collapse" : "Expand"}
            className="relative size-[16px] flex items-center justify-center shrink-0 text-c-icon-secondary"
          >
            <ChevronRight size={12} strokeWidth={2} className={clsx("transition-transform", open && "rotate-90")} />
          </button>
        ) : (
          <span className="size-[16px] shrink-0" />
        )}
        {/* type icon — uniform: text-c-icon @ strokeWidth 1.5, size 16; components/instances use the accent token */}
        <Icon size={16} strokeWidth={1.5} className={clsx("relative shrink-0", isComponent ? "text-accent-component" : "text-c-icon")} />
        {/* name */}
        <span className={clsx(FONT, "relative flex-1 min-w-0 text-[11px] font-[450] leading-[16px] truncate", isComponent ? "text-accent-component" : "text-c-text")}>
          {node.name}
        </span>
        {/* trailing: visibility (hover; eye-off persistent when hidden) + lock (open padlock on hover; closed duotone padlock when locked) */}
        {node.hidden
          ? <EyeOff size={14} strokeWidth={1.5} className="relative shrink-0 text-c-icon-secondary" />
          : <Eye size={14} strokeWidth={1.5} className="relative shrink-0 text-c-icon-secondary opacity-0 group-hover/layer:opacity-100" />}
        {node.locked
          ? <LockDuotone size={14} weight="duotone" className="relative shrink-0 text-c-icon-secondary" />
          : <LockOpen size={14} strokeWidth={1.5} className="relative shrink-0 text-c-icon-secondary opacity-0 group-hover/layer:opacity-100" />}
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
      {/* tree — overlay scrollbar (theme-aware thumb), matching inspector/slides panels */}
      <ScrollArea className="py-[4px]">
        <div role="tree" aria-label={title}>
          {layers.map(n => (
            <LayerRow key={n.id} node={n} depth={0} selectedId={selected} onSelect={setSelected} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
