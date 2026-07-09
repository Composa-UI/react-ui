import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { ChevronRight, Hash, Folder, Type, Component, Image as ImageIcon, Square, Eye, EyeOff, LockOpen } from "lucide-react";
import { Lock as LockDuotone } from "@phosphor-icons/react";
import { ScrollArea } from "./Panel";

// ─── Layer list ─────────────────────────────────────────────────────────────────
// A layers tree (Figma-style), componentized from the previous DS tree + Dark export.
// Light theme (c-* tokens). Data-driven: a LayerNode[] with nesting; each row =
// chevron (if group) · type icon · name · visibility/lock. Component/instance types
// use the purple accent. Selecting a parent/group highlights its full visible subtree
// as ONE continuous rounded block (rounded top on the first row, rounded bottom on the
// last, square in between) — matches the UI3 reference (Figma node 2352-118293).

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

const TYPE_ICON: Record<LayerType, typeof Hash> = {
  frame: Hash, group: Folder, text: Type, component: Component, instance: Component, image: ImageIcon, shape: Square,
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

// ── Flatten the tree into visible rows (respecting expanded state) ────────────────
interface FlatRow {
  node: LayerNode;
  depth: number;
  ancestors: string[]; // ancestor ids, root-first
}

function flatten(nodes: LayerNode[], depth: number, ancestors: string[], expanded: Set<string>, out: FlatRow[]) {
  for (const node of nodes) {
    out.push({ node, depth, ancestors });
    if (node.children?.length && expanded.has(node.id)) {
      flatten(node.children, depth + 1, [...ancestors, node.id], expanded, out);
    }
  }
}

function collectGroupIds(nodes: LayerNode[], out: string[] = []): string[] {
  for (const n of nodes) {
    if (n.children?.length) { out.push(n.id); collectGroupIds(n.children, out); }
  }
  return out;
}

// ── One row ───────────────────────────────────────────────────────────────────────
function LayerRow({ row, hasChildren, open, onToggle, isSelfSelected, highlighted, roundTop, roundBottom, onSelect }: {
  row: FlatRow;
  hasChildren: boolean;
  open: boolean;
  onToggle: () => void;
  isSelfSelected: boolean;
  highlighted: boolean;
  roundTop: boolean;
  roundBottom: boolean;
  onSelect: () => void;
}) {
  const { node, depth } = row;
  const Icon = TYPE_ICON[node.type];
  const isComponent = node.type === "component" || node.type === "instance";

  return (
    <div
      role="treeitem"
      tabIndex={0}
      aria-selected={isSelfSelected}
      aria-expanded={hasChildren ? open : undefined}
      onClick={onSelect}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); }
        else if (e.key === "ArrowRight" && hasChildren && !open) onToggle();
        else if (e.key === "ArrowLeft" && hasChildren && open) onToggle();
      }}
      className="group/layer relative flex items-center gap-[6px] h-[30px] pr-[8px] cursor-pointer select-none outline-none focus-visible:ring-1 focus-visible:ring-c-border-selected"
      style={{ paddingLeft: 8 + depth * 16 }}
    >
      {/* highlight — one continuous block across a selected parent + its visible
          descendants; rounded only at the very top/bottom of the run, square between */}
      {highlighted && (
        <span
          aria-hidden
          className={clsx(
            "pointer-events-none absolute left-[4px] right-[4px] bg-c-bg-selected",
            roundTop ? "top-[2px] rounded-t-c-md" : "top-0",
            roundBottom ? "bottom-[2px] rounded-b-c-md" : "bottom-0",
          )}
        />
      )}
      {!highlighted && (
        <span aria-hidden className="pointer-events-none absolute inset-y-[2px] left-[4px] right-[4px] rounded-c-md bg-c-bg-hover opacity-0 group-hover/layer:opacity-100" />
      )}
      {/* disclosure */}
      {hasChildren ? (
        <button
          onClick={e => { e.stopPropagation(); onToggle(); }}
          aria-label={open ? "Collapse" : "Expand"}
          className="relative size-[16px] flex items-center justify-center shrink-0 text-c-icon-secondary"
        >
          <ChevronRight size={12} strokeWidth={2} className={clsx("transition-transform", open && "rotate-90")} />
        </button>
      ) : (
        <span className="size-[16px] shrink-0" />
      )}
      {/* type icon */}
      <Icon size={16} strokeWidth={1.5} className={clsx("relative shrink-0", isComponent ? "text-accent-component" : "text-c-icon")} />
      {/* name */}
      <span className={clsx(FONT, "relative flex-1 min-w-0 text-[11px] font-[450] leading-[16px] truncate", isComponent ? "text-accent-component" : "text-c-text")}>
        {node.name}
      </span>
      {/* trailing: lock first (open padlock on hover; closed duotone padlock persistent when locked), then visibility */}
      {node.locked
        ? <LockDuotone size={14} weight="duotone" className="relative shrink-0 text-c-icon-secondary" />
        : <LockOpen size={14} strokeWidth={1.5} className="relative shrink-0 text-c-icon-secondary opacity-0 group-hover/layer:opacity-100" />}
      {node.hidden
        ? <EyeOff size={14} strokeWidth={1.5} className="relative shrink-0 text-c-icon-secondary" />
        : <Eye size={14} strokeWidth={1.5} className="relative shrink-0 text-c-icon-secondary opacity-0 group-hover/layer:opacity-100" />}
    </div>
  );
}

export function LayerList({ layers = DEMO_LAYERS, title = "Layers" }: { layers?: LayerNode[]; title?: string }) {
  const [selected, setSelected] = useState<string | null>("2b");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(collectGroupIds(layers)));

  const flat = useMemo(() => {
    const out: FlatRow[] = [];
    flatten(layers, 0, [], expanded, out);
    return out;
  }, [layers, expanded]);

  const isHighlighted = (row: FlatRow) => selected != null && (row.node.id === selected || row.ancestors.includes(selected));

  return (
    <div className="w-[240px] shrink-0 h-full flex flex-col bg-c-bg border-r border-c-border overflow-hidden">
      {/* header */}
      <div className="shrink-0 h-[40px] flex items-center px-[16px] border-t border-b border-c-border">
        <span className={clsx(FONT, "text-[11px] font-[550] leading-[16px] text-c-text")}>{title}</span>
      </div>
      {/* tree — overlay scrollbar (theme-aware thumb), matching inspector/slides panels */}
      <ScrollArea className="py-[4px]">
        <div role="tree" aria-label={title}>
          {flat.map((row, i) => {
            const hasChildren = !!row.node.children?.length;
            const highlighted = isHighlighted(row);
            const prevHighlighted = i > 0 && isHighlighted(flat[i - 1]);
            const nextHighlighted = i < flat.length - 1 && isHighlighted(flat[i + 1]);
            return (
              <LayerRow
                key={row.node.id}
                row={row}
                hasChildren={hasChildren}
                open={expanded.has(row.node.id)}
                onToggle={() => setExpanded(s => {
                  const next = new Set(s);
                  next.has(row.node.id) ? next.delete(row.node.id) : next.add(row.node.id);
                  return next;
                })}
                isSelfSelected={selected === row.node.id}
                highlighted={highlighted}
                roundTop={highlighted && !prevHighlighted}
                roundBottom={highlighted && !nextHighlighted}
                onSelect={() => setSelected(row.node.id)}
              />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
