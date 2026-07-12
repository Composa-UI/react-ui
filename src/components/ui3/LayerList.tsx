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

function flattenAll(nodes: LayerNode[], depth: number, ancestors: string[], out: FlatRow[]) {
  for (const node of nodes) {
    out.push({ node, depth, ancestors });
    if (node.children?.length) flattenAll(node.children, depth + 1, [...ancestors, node.id], out);
  }
}

export function normalizeLayerDragRoots(nodes: LayerNode[], ids: readonly string[]): string[] {
  const rows: FlatRow[] = []; flattenAll(nodes, 0, [], rows);
  const selected = new Set(ids.filter(id => rows.some(row => row.node.id === id)));
  const roots = rows.filter(row => selected.has(row.node.id) && !row.ancestors.some(ancestor => selected.has(ancestor)));
  return roots.some(row => row.node.locked) ? [] : roots.map(row => row.node.id);
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
type LayerDropZone = "before" | "inside" | "after";

function dropZoneFor(row: FlatRow, clientY: number, rect: DOMRect, canReorder: boolean, canReparent: boolean): LayerDropZone | null {
  const ratio = (clientY - rect.top) / rect.height;
  if (ratio < 1 / 3) return canReorder ? "before" : null;
  if (ratio > 2 / 3) return canReorder ? "after" : null;
  const container = !row.node.locked && (row.node.type === "frame" || row.node.type === "group");
  return canReparent && container ? "inside" : null;
}

// ── One row ───────────────────────────────────────────────────────────────────────
export interface LayerSelectionModifiers { toggle: boolean; range: boolean; visibleOrder?: readonly string[]; }

function LayerRow({ row, hasChildren, open, onToggle, isSelfSelected, onSelect, onVisibilityChange, onLockChange, onRenameRequest, onContextMenu, draggable, dropZone, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop }: {
  row: FlatRow;
  hasChildren: boolean;
  open: boolean;
  onToggle: () => void;
  isSelfSelected: boolean;
  onSelect: (modifiers: LayerSelectionModifiers) => void;
  onVisibilityChange?: () => void;
  onLockChange?: () => void;
  onRenameRequest?: () => void;
  onContextMenu?: (event: MouseEvent<HTMLDivElement>) => void;
  draggable?: boolean;
  dropZone?: LayerDropZone | null;
  onDragStart?: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (event: DragEvent<HTMLDivElement>) => void;
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
      onClick={event => onSelect({ toggle: event.metaKey || event.ctrlKey, range: event.shiftKey })}
      onDoubleClick={onRenameRequest}
      onContextMenu={onContextMenu}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect({ toggle: e.metaKey || e.ctrlKey, range: e.shiftKey }); }
        else if (e.key === "ArrowRight" && hasChildren && !open) onToggle();
        else if (e.key === "ArrowLeft" && hasChildren && open) onToggle();
      }}
      className="group/layer relative flex items-center gap-[6px] h-[30px] pr-[12px] cursor-pointer select-none outline-none focus-visible:ring-1 focus-visible:ring-c-border-selected"
      style={{ paddingLeft: 8 + depth * 16 }}
    >
      {/* hover — single row only (the cascade selection highlight renders once, as
          a single shape, in the parent — see LayerList) */}
      <span aria-hidden className={clsx("pointer-events-none absolute inset-y-[2px] rounded-c-md bg-c-bg-hover opacity-0 group-hover/layer:opacity-100")} style={{ left: INSET, right: INSET }} />
      {dropZone === "inside" && <span aria-hidden className="pointer-events-none absolute inset-y-[2px] rounded-c-md bg-c-bg-selected" style={{ left: INSET, right: INSET }} />}
      {(dropZone === "before" || dropZone === "after") && <span aria-hidden className={clsx("pointer-events-none absolute h-[2px] bg-c-border-selected z-10", dropZone === "before" ? "top-0" : "bottom-0")} style={{ left: INSET + depth * 16, right: INSET }} />}
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
      <button type="button" aria-label={node.locked ? `Unlock ${node.name}` : `Lock ${node.name}`} onClick={event => { event.stopPropagation(); onLockChange?.(); }} className={clsx("relative shrink-0 size-[14px] flex items-center justify-center text-c-icon-secondary focus-visible:opacity-100", !node.locked && "opacity-0 group-hover/layer:opacity-100")}>
        {node.locked ? <LockDuotone size={14} weight="duotone" /> : <LockOpen size={14} strokeWidth={1.5} />}
      </button>
      <button type="button" aria-label={node.hidden ? `Show ${node.name}` : `Hide ${node.name}`} onClick={event => { event.stopPropagation(); onVisibilityChange?.(); }} className={clsx("relative shrink-0 size-[14px] flex items-center justify-center text-c-icon-secondary focus-visible:opacity-100", !node.hidden && "opacity-0 group-hover/layer:opacity-100")}>
        {node.hidden ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
      </button>
    </div>
  );
}

export interface LayerListProps {
  layers?: LayerNode[];
  title?: string;
  selectedId?: string | null;
  selectedIds?: string[];
  defaultSelectedId?: string | null;
  onSelectionChange?: (id: string, modifiers: LayerSelectionModifiers) => void;
  onVisibilityChange?: (id: string, visible: boolean) => void;
  onLockChange?: (id: string, locked: boolean) => void;
  onRenameRequest?: (id: string) => void;
  onContextMenu?: (id: string, event: MouseEvent<HTMLDivElement>) => void;
  onReorder?: (sourceIds: string[], targetId: string, position: "before" | "after") => void;
  onReparent?: (sourceIds: string[], parentId: string) => void;
}

export function LayerList({
  layers = DEMO_LAYERS,
  title = "Layers",
  selectedId,
  selectedIds,
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
  const controlledSelection = selectedIds ?? (selectedId === undefined ? undefined : selectedId == null ? [] : [selectedId]);
  const selected = controlledSelection ?? (internalSelected == null ? [] : [internalSelected]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
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
  const highlightRanges = useMemo(() => {
    const ranges = selected.flatMap(id => {
      let first = -1, last = -1;
      flat.forEach((row, index) => { if (row.node.id === id || row.ancestors.includes(id)) { if (first === -1) first = index; last = index; } });
      return first === -1 ? [] : [{ first, last }];
    }).sort((left, right) => left.first - right.first);
    return ranges.reduce<Array<{ first: number; last: number }>>((merged, range) => {
      const previous = merged[merged.length - 1];
      if (previous && range.first <= previous.last + 1) previous.last = Math.max(previous.last, range.last); else merged.push({ ...range });
      return merged;
    }, []).map(range => ({ top: range.first * ROW_H, height: (range.last - range.first + 1) * ROW_H }));
  }, [flat, selected]);

  const [scrolled, setScrolled] = useState(false);
  const [draggedIds, setDraggedIds] = useState<string[]>([]);
  const [dropTarget, setDropTarget] = useState<{ id: string; zone: LayerDropZone } | null>(null);

  return (
    <div className="w-[240px] shrink-0 h-full flex flex-col bg-c-bg border-r border-c-border overflow-hidden">
      {/* header — the bottom divider only appears once the tree is scrolled (a
          "scrolled under" affordance), not persistently */}
      <div className={clsx("shrink-0 h-[40px] flex items-center px-[16px] border-t border-c-border", scrolled && "border-b border-c-border")}>
        <span className={clsx(FONT, "text-[11px] font-[550] leading-[16px] text-c-text")}>{title}</span>
      </div>
      {/* tree — overlay scrollbar (theme-aware thumb), matching inspector/slides panels */}
      <ScrollArea className="py-[4px]" onScroll={st => setScrolled(st > 0)}>
        <div role="tree" aria-label={title} aria-multiselectable={selectedIds !== undefined || undefined} className="relative">
          {highlightRanges.map(range => (
            <span
              key={`${range.top}:${range.height}`}
              aria-hidden
              className="pointer-events-none absolute rounded-t-c-md rounded-b-c-md bg-c-bg-selected"
              style={{ left: INSET, right: INSET, top: range.top + 2, height: range.height - 4 }}
            />
          ))}
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
                isSelfSelected={selectedSet.has(row.node.id)}
                onSelect={modifiers => {
                  if (controlledSelection === undefined) setInternalSelected(row.node.id);
                  onSelectionChange?.(row.node.id, { ...modifiers, visibleOrder: flat.map(item => item.node.id) });
                }}
                // Callback value is the requested next visibility: hidden → visible,
                // visible → hidden. `hidden` therefore equals `nextVisible` here.
                onVisibilityChange={() => {
                  const nextVisible = !!row.node.hidden;
                  onVisibilityChange?.(row.node.id, nextVisible);
                }}
                onLockChange={() => onLockChange?.(row.node.id, !row.node.locked)}
                onRenameRequest={() => onRenameRequest?.(row.node.id)}
                onContextMenu={event => { if (onContextMenu) { event.preventDefault(); onContextMenu(row.node.id, event); } }}
                draggable={!!(onReorder || onReparent) && !row.node.locked}
                dropZone={dropTarget?.id === row.node.id ? dropTarget.zone : null}
                onDragStart={event => {
                  const candidates = selectedSet.has(row.node.id) ? selected : [row.node.id];
                  const roots = normalizeLayerDragRoots(layers, candidates);
                  if (!roots.length) { event.preventDefault(); setDraggedIds([]); setDropTarget(null); return; }
                  setDraggedIds(roots); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("application/x-composa-layers", JSON.stringify(roots));
                  event.dataTransfer.setData("text/plain", roots[0] ?? row.node.id);
                }}
                onDragEnd={() => { setDraggedIds([]); setDropTarget(null); }}
                onDragOver={event => {
                  if (!draggedIds.length || draggedIds.includes(row.node.id) || draggedIds.some(id => row.ancestors.includes(id))) return;
                  const zone = dropZoneFor(row, event.clientY, event.currentTarget.getBoundingClientRect(), !!onReorder, !!onReparent);
                  if (!zone) { setDropTarget(current => current?.id === row.node.id ? null : current); return; }
                  event.preventDefault(); setDropTarget({ id: row.node.id, zone });
                }}
                onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropTarget(current => current?.id === row.node.id ? null : current); }}
                onDrop={event => {
                  let sourceIds = draggedIds;
                  if (!sourceIds.length) {
                    try {
                      const parsed: unknown = JSON.parse(event.dataTransfer.getData("application/x-composa-layers"));
                      sourceIds = Array.isArray(parsed) && parsed.every(id => typeof id === "string" && id.length > 0) ? normalizeLayerDragRoots(layers, parsed) : [];
                    } catch { sourceIds = []; }
                    if (!sourceIds.length) sourceIds = normalizeLayerDragRoots(layers, [event.dataTransfer.getData("text/plain")].filter(Boolean));
                  }
                  const zone = dropZoneFor(row, event.clientY, event.currentTarget.getBoundingClientRect(), !!onReorder, !!onReparent);
                  setDraggedIds([]); setDropTarget(null);
                  if (!sourceIds.length || sourceIds.includes(row.node.id) || sourceIds.some(id => row.ancestors.includes(id)) || !zone) return;
                  event.preventDefault();
                  if (zone === "inside") onReparent?.(sourceIds, row.node.id);
                  else onReorder?.(sourceIds, row.node.id, zone);
                }}
              />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
