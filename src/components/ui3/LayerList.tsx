import { useEffect, useLayoutEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent, type MouseEvent } from "react";
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
  inheritedHidden?: boolean;
  locked?: boolean;
  inheritedLocked?: boolean;
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
export interface FlatLayerRow {
  node: LayerNode;
  depth: number;
  ancestors: string[]; // ancestor ids, root-first
}

function flatten(nodes: LayerNode[], depth: number, ancestors: string[], expanded: Set<string>, out: FlatLayerRow[]) {
  for (const node of nodes) {
    out.push({ node, depth, ancestors });
    if (node.children?.length && expanded.has(node.id)) {
      flatten(node.children, depth + 1, [...ancestors, node.id], expanded, out);
    }
  }
}

function flattenAll(nodes: LayerNode[], depth: number, ancestors: string[], out: FlatLayerRow[]) {
  for (const node of nodes) {
    out.push({ node, depth, ancestors });
    if (node.children?.length) flattenAll(node.children, depth + 1, [...ancestors, node.id], out);
  }
}

export function normalizeLayerDragRoots(nodes: LayerNode[], ids: readonly string[]): string[] {
  const rows: FlatLayerRow[] = []; flattenAll(nodes, 0, [], rows);
  const selected = new Set(ids.filter(id => rows.some(row => row.node.id === id)));
  const roots = rows.filter(row => selected.has(row.node.id) && !row.ancestors.some(ancestor => selected.has(ancestor)));
  return roots.some(row => row.node.locked || row.node.inheritedLocked) ? [] : roots.map(row => row.node.id);
}

function collectGroupIds(nodes: LayerNode[], out: string[] = []): string[] {
  for (const n of nodes) {
    if (n.children?.length) { out.push(n.id); collectGroupIds(n.children, out); }
  }
  return out;
}

export function visibleLayerRows(nodes: LayerNode[], expandedIds: readonly string[]): FlatLayerRow[] {
  const out: FlatLayerRow[] = [];
  flatten(nodes, 0, [], new Set(expandedIds), out);
  return out;
}

export function layerSelectionRevealSignature(selectedIds: readonly string[], rows: readonly FlatLayerRow[]): string {
  const byId = new Map(rows.map(row => [row.node.id, row]));
  return selectedIds.map(id => `${id}:${(byId.get(id)?.ancestors ?? []).join("/")}`).join("\u0000");
}

export type LayerNavigationKey = "ArrowUp" | "ArrowDown" | "Home" | "End" | "ArrowLeft" | "ArrowRight";
export interface LayerNavigationResult { focusedId: string; expandedId?: string; expanded?: boolean; }

/** Pure keyboard projection used by the component and its contract tests. */
export function layerNavigationResult(rows: readonly FlatLayerRow[], focusedId: string, key: LayerNavigationKey): LayerNavigationResult | null {
  const index = rows.findIndex(row => row.node.id === focusedId);
  if (index < 0) return null;
  const row = rows[index];
  if (key === "ArrowUp") return index > 0 ? { focusedId: rows[index - 1].node.id } : null;
  if (key === "ArrowDown") return index < rows.length - 1 ? { focusedId: rows[index + 1].node.id } : null;
  if (key === "Home") return index > 0 ? { focusedId: rows[0].node.id } : null;
  if (key === "End") return index < rows.length - 1 ? { focusedId: rows[rows.length - 1].node.id } : null;
  const hasChildren = !!row.node.children?.length;
  const isExpanded = index + 1 < rows.length && rows[index + 1].ancestors.includes(row.node.id);
  if (key === "ArrowRight") return hasChildren && !isExpanded ? { focusedId, expandedId: focusedId, expanded: true } : null;
  if (hasChildren && isExpanded) return { focusedId, expandedId: focusedId, expanded: false };
  const parentId = row.ancestors[row.ancestors.length - 1];
  return parentId ? { focusedId: parentId } : null;
}

const ROW_H = 30;
// Outer inset for the hover/selection shapes — matches the slides panel's 8px gutter.
const INSET = 8;
type LayerDropZone = "before" | "inside" | "after";

function dropZoneFor(row: FlatLayerRow, clientY: number, rect: DOMRect, canReorder: boolean, canReparent: boolean): LayerDropZone | null {
  const ratio = (clientY - rect.top) / rect.height;
  if (ratio < 1 / 3) return canReorder ? "before" : null;
  if (ratio > 2 / 3) return canReorder ? "after" : null;
  const container = !row.node.locked && !row.node.inheritedLocked && (row.node.type === "frame" || row.node.type === "group");
  return canReparent && container ? "inside" : null;
}

// ── One row ───────────────────────────────────────────────────────────────────────
export interface LayerSelectionModifiers { toggle: boolean; range: boolean; visibleOrder?: readonly string[]; }

export const layerRowTabIndex = (focused: boolean, renaming: boolean) => renaming ? -1 : focused ? 0 : -1;

export function layerDomFocusSource(
  rowId: string,
  pendingProgrammaticFocusId: string | null,
  targetIsRow: boolean,
): "pointer" | null {
  if (!targetIsRow || pendingProgrammaticFocusId === rowId) return null;
  return "pointer";
}

export function nextLayerSelection(
  currentIds: readonly string[],
  targetId: string,
  modifiers: Pick<LayerSelectionModifiers, "toggle" | "range">,
  visibleOrder: readonly string[],
  anchorId: string | null,
): { ids: string[]; anchorId: string | null } {
  const current = [...new Set(currentIds)].filter(id => visibleOrder.includes(id));
  if (modifiers.range) {
    const anchor = anchorId && visibleOrder.includes(anchorId) ? anchorId : current[current.length - 1] ?? targetId;
    const start = visibleOrder.indexOf(anchor), end = visibleOrder.indexOf(targetId);
    return { ids: start < 0 || end < 0 ? [targetId] : visibleOrder.slice(Math.min(start, end), Math.max(start, end) + 1), anchorId: anchor };
  }
  if (modifiers.toggle) {
    const ids = current.includes(targetId) ? current.filter(id => id !== targetId) : [...current, targetId];
    return { ids, anchorId: ids[ids.length - 1] ?? null };
  }
  return { ids: [targetId], anchorId: targetId };
}

function LayerRow({ row, hasChildren, open, focused, renaming, renameDraft, onRenameDraftChange, onRenameCommit, onRenameCancel, onDomFocus, onToggle, isSelfSelected, onSelect, onVisibilityChange, onLockChange, onRenameRequest, onContextMenu, draggable, dropZone, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, onKeyDown, rowRef }: {
  row: FlatLayerRow;
  hasChildren: boolean;
  open: boolean;
  focused: boolean;
  renaming: boolean;
  renameDraft: string;
  onRenameDraftChange: (value: string) => void;
  onRenameCommit: () => void;
  onRenameCancel: () => void;
  onDomFocus: (targetIsRow: boolean) => void;
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
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  rowRef: (node: HTMLDivElement | null) => void;
}) {
  const { node, depth } = row;
  const Icon = TYPE_ICON[node.type];
  const isComponent = node.type === "component" || node.type === "instance";
  const effectivelyHidden = !!(node.hidden || node.inheritedHidden);
  const effectivelyLocked = !!(node.locked || node.inheritedLocked);

  return (
    <div
      ref={rowRef}
      role="treeitem"
      aria-label={node.name}
      aria-level={depth + 1}
      tabIndex={layerRowTabIndex(focused, renaming)}
      aria-selected={isSelfSelected}
      aria-expanded={hasChildren ? open : undefined}
      onFocus={event => onDomFocus(event.currentTarget === event.target)}
      onClick={event => {
        if (isSelfSelected && !event.metaKey && !event.ctrlKey && !event.shiftKey) onRenameRequest?.();
        else onSelect({ toggle: event.metaKey || event.ctrlKey, range: event.shiftKey });
      }}
      onDoubleClick={onRenameRequest}
      onContextMenu={onContextMenu}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onKeyDown={onKeyDown}
      className={clsx("group/layer relative flex items-center gap-[6px] h-[30px] pr-[12px] cursor-pointer select-none outline-none focus-visible:ring-1 focus-visible:ring-c-border-selected", effectivelyHidden && "opacity-45")}
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
          tabIndex={-1}
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
      {renaming ? (
        <input
          autoFocus
          aria-label={`Rename ${node.name}`}
          value={renameDraft}
          onClick={event => event.stopPropagation()}
          onChange={event => onRenameDraftChange(event.target.value)}
          onBlur={onRenameCommit}
          onKeyDown={event => {
            if (event.key !== "Enter" && event.key !== "Escape") return;
            event.preventDefault(); event.stopPropagation();
            event.key === "Enter" ? onRenameCommit() : onRenameCancel();
          }}
          className={clsx(FONT, "relative flex-1 min-w-0 h-[22px] rounded-c-sm border border-c-border-selected bg-c-bg px-[4px] text-[11px] font-[450] leading-[16px] text-c-text outline-none")}
        />
      ) : (
        <span className={clsx(FONT, "relative flex-1 min-w-0 text-[11px] font-[450] leading-[16px] truncate", isComponent ? "text-accent-component" : "text-c-text")}>{node.name}</span>
      )}
      {/* trailing: lock first (open padlock on hover; closed duotone padlock persistent when locked), then visibility */}
      <button type="button" tabIndex={-1} disabled={!!node.inheritedLocked && !node.locked} aria-label={node.inheritedLocked && !node.locked ? `${node.name} locked by parent` : node.locked ? `Unlock ${node.name}` : `Lock ${node.name}`} onClick={event => { event.stopPropagation(); onLockChange?.(); }} className={clsx("relative shrink-0 size-[14px] flex items-center justify-center text-c-icon-secondary focus-visible:opacity-100", !effectivelyLocked && "opacity-0 group-hover/layer:opacity-100")}>
        {effectivelyLocked ? <LockDuotone size={14} weight="duotone" /> : <LockOpen size={14} strokeWidth={1.5} />}
      </button>
      <button type="button" tabIndex={-1} aria-label={node.hidden ? `Show ${node.name}` : `Hide ${node.name}`} onClick={event => { event.stopPropagation(); onVisibilityChange?.(); }} className={clsx("relative shrink-0 size-[14px] flex items-center justify-center text-c-icon-secondary focus-visible:opacity-100", !node.hidden && "opacity-0 group-hover/layer:opacity-100")}>
        {node.hidden ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
      </button>
    </div>
  );
}

export interface LayerListProps {
  layers?: LayerNode[];
  title?: string;
  scopeId?: string;
  selectedId?: string | null;
  selectedIds?: readonly string[];
  defaultSelectedId?: string | null;
  expandedIds?: readonly string[];
  defaultExpandedIds?: readonly string[];
  onExpandedIdsChange?: (ids: string[], detail: { id: string; expanded: boolean; source: "pointer" | "keyboard" | "selection-reveal"; changedIds?: string[] }) => void;
  focusedId?: string | null;
  defaultFocusedId?: string | null;
  onFocusedIdChange?: (id: string | null, detail: { source: "pointer" | "keyboard" | "reconcile" }) => void;
  renamingId?: string | null;
  onSelectionChange?: (id: string, modifiers: LayerSelectionModifiers) => void;
  onVisibilityChange?: (id: string, visible: boolean) => void;
  onLockChange?: (id: string, locked: boolean) => void;
  onRenameRequest?: (id: string) => void;
  onRenameCommit?: (id: string, value: string) => void;
  onRenameCancel?: (id: string) => void;
  onContextMenu?: (id: string, event: MouseEvent<HTMLDivElement>) => void;
  onReorder?: (sourceIds: string[], targetId: string, position: "before" | "after") => void;
  onReparent?: (sourceIds: string[], parentId: string) => void;
}

export function LayerList({
  layers = DEMO_LAYERS,
  title = "Layers",
  scopeId,
  selectedId,
  selectedIds,
  defaultSelectedId = "2b",
  expandedIds,
  defaultExpandedIds,
  onExpandedIdsChange,
  focusedId,
  defaultFocusedId = null,
  onFocusedIdChange,
  renamingId,
  onSelectionChange,
  onVisibilityChange,
  onLockChange,
  onRenameRequest,
  onRenameCommit,
  onRenameCancel,
  onContextMenu,
  onReorder,
  onReparent,
}: LayerListProps) {
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>(() => defaultSelectedId == null ? [] : [defaultSelectedId]);
  const internalSelectionAnchor = useRef<string | null>(defaultSelectedId);
  const controlledSelection = selectedIds ?? (selectedId === undefined ? undefined : selectedId == null ? [] : [selectedId]);
  const selected = controlledSelection ?? internalSelectedIds;
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const parentIds = useMemo(() => collectGroupIds(layers), [layers]);
  const allRows = useMemo(() => { const out: FlatLayerRow[] = []; flattenAll(layers, 0, [], out); return out; }, [layers]);
  const allRowsById = useMemo(() => new Map(allRows.map(row => [row.node.id, row])), [allRows]);
  const [internalExpandedIds, setInternalExpandedIds] = useState<string[]>(() => [...(defaultExpandedIds ?? collectGroupIds(layers))]);
  const effectiveExpandedIds = expandedIds ?? internalExpandedIds;
  const expanded = useMemo(() => new Set(effectiveExpandedIds), [effectiveExpandedIds]);
  const [internalFocusedId, setInternalFocusedId] = useState<string | null>(defaultFocusedId);
  const requestedFocusedId = focusedId === undefined ? internalFocusedId : focusedId;
  const [internalRenamingId, setInternalRenamingId] = useState<string | null>(null);
  const effectiveRenamingId = renamingId === undefined ? internalRenamingId : renamingId;
  const [renameDraft, setRenameDraft] = useState("");
  const [internalNames, setInternalNames] = useState<Record<string, string>>({});
  const endingRename = useRef(false);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const pendingFocusId = useRef<string | null>(null);
  const pendingRevealId = useRef<string | null>(null);
  const previousScopeId = useRef(scopeId);
  const previousParentIds = useRef(new Set(parentIds));

  const flat = useMemo(() => {
    const out: FlatLayerRow[] = [];
    flatten(layers, 0, [], expanded, out);
    return out;
  }, [layers, expanded]);
  const visibleIds = useMemo(() => flat.map(row => row.node.id), [flat]);
  const fallbackFocusedId = [...selected].reverse().find(id => visibleIds.includes(id)) ?? visibleIds[0] ?? null;
  const effectiveFocusedId = requestedFocusedId && visibleIds.includes(requestedFocusedId) ? requestedFocusedId : fallbackFocusedId;

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
  const previousSelectionSignature = useRef<string | null>(null);

  const commitExpandedIds = (ids: readonly string[], detail: { id: string; expanded: boolean; source: "pointer" | "keyboard" | "selection-reveal"; changedIds?: string[] }) => {
    const requested = new Set(ids);
    const next = parentIds.filter(id => requested.has(id));
    if (expandedIds === undefined) setInternalExpandedIds(next);
    onExpandedIdsChange?.(next, detail);
  };
  const setNodeExpanded = (id: string, nextExpanded: boolean, source: "pointer" | "keyboard" | "selection-reveal") => {
    const next = new Set(effectiveExpandedIds);
    nextExpanded ? next.add(id) : next.delete(id);
    commitExpandedIds([...next], { id, expanded: nextExpanded, source });
  };
  const commitFocusedId = (id: string | null, source: "pointer" | "keyboard" | "reconcile", moveDomFocus = false) => {
    if (focusedId === undefined) setInternalFocusedId(id);
    onFocusedIdChange?.(id, { source });
    if (moveDomFocus && id) pendingFocusId.current = id;
  };
  const updateUncontrolledSelection = (id: string, modifiers: Pick<LayerSelectionModifiers, "toggle" | "range">, order: readonly string[]) => {
    if (controlledSelection !== undefined) return;
    setInternalSelectedIds(current => {
      const next = nextLayerSelection(current, id, modifiers, order, internalSelectionAnchor.current);
      internalSelectionAnchor.current = next.anchorId;
      return next.ids;
    });
  };
  const requestRename = (id: string) => {
    const row = allRowsById.get(id);
    if (!row) return;
    endingRename.current = false;
    setRenameDraft(internalNames[id] ?? row.node.name);
    if (renamingId === undefined) setInternalRenamingId(id);
    onRenameRequest?.(id);
  };
  const restoreRowFocus = (id: string) => {
    pendingFocusId.current = id;
    requestAnimationFrame(() => {
      const row = rowRefs.current.get(id);
      if (row) row.focus({ preventScroll: true });
      if (pendingFocusId.current === id) pendingFocusId.current = null;
    });
  };
  const cancelRename = () => {
    if (!effectiveRenamingId || endingRename.current) return;
    endingRename.current = true;
    const id = effectiveRenamingId;
    if (renamingId === undefined) setInternalRenamingId(null);
    onRenameCancel?.(id);
    restoreRowFocus(id);
  };
  const commitRename = () => {
    if (!effectiveRenamingId || endingRename.current) return;
    endingRename.current = true;
    const id = effectiveRenamingId;
    const currentName = internalNames[id] ?? allRowsById.get(id)?.node.name ?? "";
    const value = renameDraft.trim();
    if (renamingId === undefined) {
      setInternalRenamingId(null);
      if (value && value !== currentName) setInternalNames(current => ({ ...current, [id]: value }));
    }
    if (value && value !== currentName) onRenameCommit?.(id, value);
    else onRenameCancel?.(id);
    restoreRowFocus(id);
  };

  useEffect(() => {
    if (previousScopeId.current === scopeId) return;
    previousScopeId.current = scopeId;
    previousParentIds.current = new Set(parentIds);
    if (controlledSelection === undefined) {
      const ids = defaultSelectedId == null || !allRowsById.has(defaultSelectedId) ? [] : [defaultSelectedId];
      setInternalSelectedIds(ids); internalSelectionAnchor.current = ids[0] ?? null;
    }
    if (expandedIds === undefined) setInternalExpandedIds([...(defaultExpandedIds ?? parentIds)]);
    if (focusedId === undefined) setInternalFocusedId(defaultFocusedId);
    if (renamingId === undefined) setInternalRenamingId(null);
    setDraggedIds([]); setDropTarget(null); endingRename.current = false;
  }, [scopeId, parentIds, defaultSelectedId, defaultExpandedIds, defaultFocusedId, controlledSelection, expandedIds, focusedId, renamingId]);

  useEffect(() => {
    const currentParents = new Set(parentIds);
    const previous = previousParentIds.current;
    previousParentIds.current = currentParents;
    if (expandedIds !== undefined) return;
    setInternalExpandedIds(current => {
      const next = parentIds.filter(id => current.includes(id) || !previous.has(id));
      return next.join("\u0000") === current.join("\u0000") ? current : next;
    });
  }, [parentIds, expandedIds]);

  useEffect(() => {
    if (!requestedFocusedId || visibleIds.includes(requestedFocusedId)) return;
    const row = allRowsById.get(requestedFocusedId);
    const visibleAncestor = [...(row?.ancestors ?? [])].reverse().find(id => visibleIds.includes(id));
    commitFocusedId(visibleAncestor ?? fallbackFocusedId, "reconcile");
  }, [requestedFocusedId, visibleIds.join("\u0000"), allRowsById, fallbackFocusedId]);

  useEffect(() => {
    if (!effectiveRenamingId) return;
    const row = allRowsById.get(effectiveRenamingId);
    if (!row) return;
    endingRename.current = false;
    setRenameDraft(internalNames[effectiveRenamingId] ?? row.node.name);
  }, [effectiveRenamingId]);

  useEffect(() => {
    const signature = layerSelectionRevealSignature(selected, allRows);
    if (signature === previousSelectionSignature.current) return;
    previousSelectionSignature.current = signature;
    const revealId = selected[selected.length - 1];
    if (!revealId) return;
    const required = new Set(effectiveExpandedIds);
    for (const id of selected) for (const ancestor of allRowsById.get(id)?.ancestors ?? []) required.add(ancestor);
    const next = parentIds.filter(id => required.has(id));
    if (next.join("\u0000") !== parentIds.filter(id => expanded.has(id)).join("\u0000")) {
      commitExpandedIds(next, { id: revealId, expanded: true, source: "selection-reveal", changedIds: next.filter(id => !expanded.has(id)) });
    }
    pendingRevealId.current = revealId;
  }, [selected.join("\u0000"), allRows, allRowsById, parentIds, effectiveExpandedIds]);

  useLayoutEffect(() => {
    const focusId = pendingFocusId.current;
    if (focusId && visibleIds.includes(focusId)) {
      rowRefs.current.get(focusId)?.focus({ preventScroll: true });
      if (pendingFocusId.current === focusId) pendingFocusId.current = null;
      pendingRevealId.current = focusId;
    }
    const revealId = pendingRevealId.current;
    const viewport = viewportRef.current, row = revealId ? rowRefs.current.get(revealId) : null;
    if (!viewport || !row) return;
    pendingRevealId.current = null;
    const top = row.offsetTop, bottom = top + row.offsetHeight;
    if (top < viewport.scrollTop) viewport.scrollTop = top;
    else if (bottom > viewport.scrollTop + viewport.clientHeight) viewport.scrollTop = bottom - viewport.clientHeight;
  }, [visibleIds.join("\u0000"), effectiveFocusedId]);

  return (
    <div className="w-[240px] shrink-0 h-full flex flex-col bg-c-bg border-r border-c-border overflow-hidden">
      {/* header — the bottom divider only appears once the tree is scrolled (a
          "scrolled under" affordance), not persistently */}
      <div className={clsx("shrink-0 h-[40px] flex items-center px-[16px] border-t border-c-border", scrolled && "border-b border-c-border")}>
        <span className={clsx(FONT, "text-[11px] font-[550] leading-[16px] text-c-text")}>{title}</span>
      </div>
      {/* tree — overlay scrollbar (theme-aware thumb), matching inspector/slides panels */}
      <ScrollArea viewportRef={viewportRef} className="py-[4px]" onScroll={st => setScrolled(st > 0)}>
        <div role="tree" aria-label={title} aria-multiselectable={selectedIds !== undefined || undefined} className="relative">
          {highlightRanges.map(range => (
            <span
              key={`${range.top}:${range.height}`}
              aria-hidden
              className="pointer-events-none absolute rounded-t-c-md rounded-b-c-md bg-c-bg-selected"
              style={{ left: INSET, right: INSET, top: range.top + 2, height: range.height - 4 }}
            />
          ))}
          {!flat.length && <div className={clsx(FONT, "flex h-[88px] flex-col items-center justify-center px-[16px] text-center") }>
            <span className="text-[11px] font-[550] leading-[16px] text-c-text">No layers</span>
            <span className="mt-[2px] text-[9px] font-[450] leading-[14px] text-c-text-secondary">Use the toolbar to add elements</span>
          </div>}
          {flat.map(rowValue => {
            const row = internalNames[rowValue.node.id] ? { ...rowValue, node: { ...rowValue.node, name: internalNames[rowValue.node.id] } } : rowValue;
            const hasChildren = !!row.node.children?.length;
            const rowId = row.node.id;
            const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
              if (event.key === "Enter") {
                event.preventDefault(); event.stopPropagation();
                if (!selectedSet.has(rowId)) {
                  updateUncontrolledSelection(rowId, { toggle: false, range: false }, visibleIds);
                  onSelectionChange?.(rowId, { toggle: false, range: false, visibleOrder: visibleIds });
                }
                requestRename(rowId); return;
              }
              if (event.key === " ") {
                event.preventDefault(); event.stopPropagation();
                updateUncontrolledSelection(rowId, { toggle: event.metaKey || event.ctrlKey, range: event.shiftKey }, visibleIds);
                onSelectionChange?.(rowId, { toggle: event.metaKey || event.ctrlKey, range: event.shiftKey, visibleOrder: visibleIds }); return;
              }
              if (!["ArrowUp", "ArrowDown", "Home", "End", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
              event.preventDefault(); event.stopPropagation();
              const result = layerNavigationResult(flat, rowId, event.key as LayerNavigationKey);
              if (!result) return;
              if (result.expandedId && result.expanded !== undefined) setNodeExpanded(result.expandedId, result.expanded, "keyboard");
              if (result.focusedId !== rowId) {
                commitFocusedId(result.focusedId, "keyboard", true);
                if (event.shiftKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
                  updateUncontrolledSelection(result.focusedId, { toggle: false, range: true }, visibleIds);
                  onSelectionChange?.(result.focusedId, { toggle: false, range: true, visibleOrder: visibleIds });
                }
              }
            };
            return (
              <LayerRow
                key={rowId}
                row={row}
                hasChildren={hasChildren}
                open={expanded.has(rowId)}
                focused={effectiveFocusedId === rowId}
                renaming={effectiveRenamingId === rowId}
                renameDraft={renameDraft}
                onRenameDraftChange={setRenameDraft}
                onRenameCommit={commitRename}
                onRenameCancel={cancelRename}
                onDomFocus={targetIsRow => {
                  const source = layerDomFocusSource(rowId, pendingFocusId.current, targetIsRow);
                  if (pendingFocusId.current === rowId) pendingFocusId.current = null;
                  if (source) commitFocusedId(rowId, source);
                }}
                onToggle={() => {
                  const nextExpanded = !expanded.has(rowId);
                  const focusedRow = requestedFocusedId ? allRowsById.get(requestedFocusedId) : undefined;
                  commitFocusedId(rowId, "pointer", !nextExpanded && !!focusedRow?.ancestors.includes(rowId));
                  setNodeExpanded(rowId, nextExpanded, "pointer");
                }}
                isSelfSelected={selectedSet.has(rowId)}
                onSelect={modifiers => {
                  updateUncontrolledSelection(rowId, modifiers, visibleIds);
                  onSelectionChange?.(rowId, { ...modifiers, visibleOrder: visibleIds });
                }}
                // Callback value is the requested next visibility: hidden → visible,
                // visible → hidden. `hidden` therefore equals `nextVisible` here.
                onVisibilityChange={() => {
                  const nextVisible = !!row.node.hidden;
                  onVisibilityChange?.(rowId, nextVisible);
                }}
                onLockChange={() => onLockChange?.(rowId, !row.node.locked)}
                onRenameRequest={() => requestRename(rowId)}
                onContextMenu={event => { if (onContextMenu) { event.preventDefault(); onContextMenu(rowId, event); } }}
                draggable={!!(onReorder || onReparent) && !row.node.locked && !row.node.inheritedLocked}
                dropZone={dropTarget?.id === rowId ? dropTarget.zone : null}
                onKeyDown={handleKeyDown}
                rowRef={node => { if (node) rowRefs.current.set(rowId, node); else rowRefs.current.delete(rowId); }}
                onDragStart={event => {
                  const candidates = selectedSet.has(rowId) ? selected : [rowId];
                  const roots = normalizeLayerDragRoots(layers, candidates);
                  if (!roots.length) { event.preventDefault(); setDraggedIds([]); setDropTarget(null); return; }
                  setDraggedIds(roots); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("application/x-composa-layers", JSON.stringify(roots));
                  event.dataTransfer.setData("text/plain", roots[0] ?? rowId);
                }}
                onDragEnd={() => { setDraggedIds([]); setDropTarget(null); }}
                onDragOver={event => {
                  if (!draggedIds.length || draggedIds.includes(rowId) || draggedIds.some(id => row.ancestors.includes(id))) return;
                  const zone = dropZoneFor(row, event.clientY, event.currentTarget.getBoundingClientRect(), !!onReorder, !!onReparent);
                  if (!zone) { setDropTarget(current => current?.id === rowId ? null : current); return; }
                  event.preventDefault(); setDropTarget({ id: rowId, zone });
                }}
                onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropTarget(current => current?.id === rowId ? null : current); }}
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
                  if (!sourceIds.length || sourceIds.includes(rowId) || sourceIds.some(id => row.ancestors.includes(id)) || !zone) return;
                  event.preventDefault();
                  if (zone === "inside") onReparent?.(sourceIds, rowId);
                  else onReorder?.(sourceIds, rowId, zone);
                }}
              />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
