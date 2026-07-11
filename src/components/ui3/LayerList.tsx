import { useMemo, useState, type DragEvent, type MouseEvent } from "react";
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

const ROW_H = 30;
// Outer inset for the hover/selection shapes — matches the slides panel's 8px gutter.
const INSET = 8;

// ── One row ───────────────────────────────────────────────────────────────────────
function LayerRow({ row, hasChildren, open, onToggle, isSelfSelected, onSelect, onVisibilityChange, onLockChange, onRenameRequest, onContextMenu, draggable, onDragStart, onDragOver, onDrop }: {
  row: FlatRow;
  hasChildren: boolean;
  open: boolean;
  onToggle: () => void;
  isSelfSelected: boolean;
  onSelect: (event: MouseEvent<HTMLDivElement>) => void;
  onVisibilityChange?: () => void;
  onLockChange?: () => void;
  onRenameRequest?: () => void;
  onContextMenu?: (event: MouseEvent<HTMLDivElement>) => void;
  draggable?: boolean;
  onDragStart?: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: DragEvent<HTMLDivElement>) => void;
}) {
  const { node, depth } = row;
  const Icon = TYPE_ICON[node.type];
  const isComponent = node.type === "component" || node.type === "instance";

  return (
    <div
      role="treeitem"
      aria-label={node.name}
      tabIndex={0}
      aria-selected={isSelfSelected}
      aria-expanded={hasChildren ? open : undefined}
      onClick={onSelect}
      onDoubleClick={onRenameRequest}
      onContextMenu={onContextMenu}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(e as unknown as MouseEvent<HTMLDivElement>); }
        else if (e.key === "ArrowRight" && hasChildren && !open) onToggle();
        else if (e.key === "ArrowLeft" && hasChildren && open) onToggle();
      }}
      className="group/layer relative flex items-center gap-[6px] h-[30px] pr-[12px] cursor-pointer select-none outline-none focus-visible:ring-1 focus-visible:ring-c-border-selected"
      style={{ paddingLeft: 8 + depth * 16 }}
    >
      {/* hover — single row only (the cascade selection highlight renders once, as
          a single shape, in the parent — see LayerList) */}
      <span aria-hidden className={clsx("pointer-events-none absolute inset-y-[2px] rounded-c-md bg-c-bg-hover opacity-0 group-hover/layer:opacity-100")} style={{ left: INSET, right: INSET }} />
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
      <button type="button" aria-label={node.locked ? `Unlock ${node.name}` : `Lock ${node.name}`} onClick={event => { event.stopPropagation(); onLockChange?.(); }} className={clsx("relative shrink-0 size-[14px] flex items-center justify-center text-c-icon-secondary", !node.locked && "opacity-0 group-hover/layer:opacity-100")}>
        {node.locked ? <LockDuotone size={14} weight="duotone" /> : <LockOpen size={14} strokeWidth={1.5} />}
      </button>
      <button type="button" aria-label={node.hidden ? `Show ${node.name}` : `Hide ${node.name}`} onClick={event => { event.stopPropagation(); onVisibilityChange?.(); }} className={clsx("relative shrink-0 size-[14px] flex items-center justify-center text-c-icon-secondary", !node.hidden && "opacity-0 group-hover/layer:opacity-100")}>
        {node.hidden ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
      </button>
    </div>
  );
}

export interface LayerListProps {
  layers?: LayerNode[];
  title?: string;
  selectedId?: string | null;
  defaultSelectedId?: string | null;
  onSelectionChange?: (id: string) => void;
  onVisibilityChange?: (id: string, visible: boolean) => void;
  onLockChange?: (id: string, locked: boolean) => void;
  onRenameRequest?: (id: string) => void;
  onContextMenu?: (id: string, event: MouseEvent<HTMLDivElement>) => void;
  onReorder?: (sourceId: string, targetId: string, position: "before" | "after") => void;
  onReparent?: (sourceId: string, parentId: string) => void;
}

export function LayerList({
  layers = DEMO_LAYERS,
  title = "Layers",
  selectedId,
  defaultSelectedId = "2b",
  onSelectionChange,
  onVisibilityChange,
  onLockChange,
  onRenameRequest,
  onContextMenu,
  onReorder,
  onReparent,
}: LayerListProps) {
  const [internalSelected, setInternalSelected] = useState<string | null>(defaultSelectedId);
  const selected = selectedId === undefined ? internalSelected : selectedId;
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(collectGroupIds(layers)));

  const flat = useMemo(() => {
    const out: FlatRow[] = [];
    flatten(layers, 0, [], expanded, out);
    return out;
  }, [layers, expanded]);

  // The selection highlight is rendered ONCE as a single continuous shape spanning
  // the selected node + its visible descendants (not one pill per row) — this is
  // what makes it read as one seamless block rather than N adjacent translucent
  // rows (which produced faint seams at the row boundaries).
  const highlightRange = useMemo(() => {
    if (selected == null) return null;
    let first = -1, last = -1;
    flat.forEach((row, i) => {
      if (row.node.id === selected || row.ancestors.includes(selected)) {
        if (first === -1) first = i;
        last = i;
      }
    });
    return first === -1 ? null : { top: first * ROW_H, height: (last - first + 1) * ROW_H };
  }, [flat, selected]);

  const [scrolled, setScrolled] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  return (
    <div className="w-[240px] shrink-0 h-full flex flex-col bg-c-bg border-r border-c-border overflow-hidden">
      {/* header — the bottom divider only appears once the tree is scrolled (a
          "scrolled under" affordance), not persistently */}
      <div className={clsx("shrink-0 h-[40px] flex items-center px-[16px] border-t border-c-border", scrolled && "border-b border-c-border")}>
        <span className={clsx(FONT, "text-[11px] font-[550] leading-[16px] text-c-text")}>{title}</span>
      </div>
      {/* tree — overlay scrollbar (theme-aware thumb), matching inspector/slides panels */}
      <ScrollArea className="py-[4px]" onScroll={st => setScrolled(st > 0)}>
        <div role="tree" aria-label={title} className="relative">
          {highlightRange && (
            <span
              aria-hidden
              className="pointer-events-none absolute rounded-t-c-md rounded-b-c-md bg-c-bg-selected"
              style={{ left: INSET, right: INSET, top: highlightRange.top + 2, height: highlightRange.height - 4 }}
            />
          )}
          {flat.map(row => {
            const hasChildren = !!row.node.children?.length;
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
                onSelect={() => {
                  if (selectedId === undefined) setInternalSelected(row.node.id);
                  onSelectionChange?.(row.node.id);
                }}
                onVisibilityChange={() => onVisibilityChange?.(row.node.id, !!row.node.hidden)}
                onLockChange={() => onLockChange?.(row.node.id, !row.node.locked)}
                onRenameRequest={() => onRenameRequest?.(row.node.id)}
                onContextMenu={event => { if (onContextMenu) { event.preventDefault(); onContextMenu(row.node.id, event); } }}
                draggable={!!(onReorder || onReparent)}
                onDragStart={event => { setDraggedId(row.node.id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", row.node.id); }}
                onDragOver={event => { if (draggedId && draggedId !== row.node.id) event.preventDefault(); }}
                onDrop={event => {
                  event.preventDefault();
                  const sourceId = draggedId ?? event.dataTransfer.getData("text/plain");
                  setDraggedId(null);
                  if (!sourceId || sourceId === row.node.id) return;
                  const rect = event.currentTarget.getBoundingClientRect();
                  const ratio = (event.clientY - rect.top) / rect.height;
                  if (hasChildren && ratio >= 0.33 && ratio <= 0.67 && onReparent) onReparent(sourceId, row.node.id);
                  else onReorder?.(sourceId, row.node.id, ratio < 0.5 ? "before" : "after");
                }}
              />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
