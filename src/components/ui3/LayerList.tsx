import { forwardRef, useMemo, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { ChevronRight, Hash, Folder, Type, Component, Image as ImageIcon, Square, Eye, EyeOff, LockOpen } from "lucide-react";
import { Lock as LockDuotone } from "@phosphor-icons/react";
import { ScrollArea } from "./Panel";

// ─── Layer list ─────────────────────────────────────────────────────────────────
// A layers tree (Figma-style), componentized from the previous DS tree + Dark export.
// Light theme (c-* tokens). Data-driven: a LayerNode[] with nesting; each row =
// chevron (if group) · type icon · name · visibility/lock. Component/instance types
// use the purple accent.
//
// Presentational + COMPOSABLE, mirroring SlidesPanel. Two ways to use it:
//   • Standalone/demo: pass `layers={LayerNode[]}`; the panel owns selection +
//     expansion internally and renders the continuous cascade-selection highlight.
//   • Consumer-composed: pass `children` (a list of <LayerRow>) so the consumer
//     owns selection/expansion/rename/drag/visibility/lock while the kit owns the
//     row styling. The editor uses this path. `LayerRow` forwards `...rest` to its
//     root so the consumer can attach a context-menu trigger / drag + data-* hooks.

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

// ── One row (composable shell) ─────────────────────────────────────────────────
// forwardRef + `...rest` spread so a consumer (the editor) can wrap it in a
// context-menu trigger / attach drag + data-* + event handlers on the root.
export interface LayerRowProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  nameNode?: ReactNode;          // overrides the name label (e.g. a rename input)
  icon?: ReactNode;              // type-icon slot (consumer supplies); falls back to `type`
  type?: LayerType;
  depth?: number;
  selected?: boolean;
  hidden?: boolean;
  locked?: boolean;
  hasChildren?: boolean;
  open?: boolean;
  isComponent?: boolean;         // purple accent (component/instance)
  dropInto?: boolean;            // reparent-into (drop as child) indicator
  dropBefore?: boolean;          // reorder-before indicator
  onToggleExpand?: () => void;
  onToggleVisibility?: () => void;
  onToggleLock?: () => void;
}

export const LayerRow = forwardRef<HTMLDivElement, LayerRowProps>(function LayerRow(
  {
    name, nameNode, icon, type, depth = 0, selected, hidden, locked, hasChildren, open,
    isComponent, dropInto, dropBefore, onToggleExpand, onToggleVisibility, onToggleLock,
    className, ...rest
  },
  ref,
) {
  const Icon = icon ? null : TYPE_ICON[type ?? "shape"];
  return (
    <div
      ref={ref}
      role="treeitem"
      tabIndex={0}
      aria-selected={selected}
      aria-expanded={hasChildren ? open : undefined}
      className={clsx(
        "group/layer relative flex items-center gap-[6px] h-[30px] pr-[12px] cursor-pointer select-none outline-none",
        "focus-visible:ring-1 focus-visible:ring-c-border-selected",
        hidden && "opacity-50",
        className,
      )}
      style={{ paddingLeft: 8 + depth * 16 }}
      {...rest}
    >
      {/* reparent-into ring */}
      {dropInto && <span aria-hidden className="pointer-events-none absolute inset-y-[1px] rounded-c-md ring-1 ring-inset ring-c-border-selected-strong" style={{ left: INSET, right: INSET }} />}
      {/* reorder-before line */}
      {dropBefore && <span aria-hidden className="pointer-events-none absolute top-0 h-[2px] rounded-full bg-c-border-selected-strong" style={{ left: INSET, right: INSET }} />}
      {/* selection / hover fill */}
      {selected
        ? <span aria-hidden className="pointer-events-none absolute inset-y-[1px] rounded-c-md bg-c-bg-selected" style={{ left: INSET, right: INSET }} />
        : <span aria-hidden className="pointer-events-none absolute inset-y-[2px] rounded-c-md bg-c-bg-hover opacity-0 group-hover/layer:opacity-100" style={{ left: INSET, right: INSET }} />}
      {/* disclosure */}
      {hasChildren ? (
        <button
          onClick={e => { e.stopPropagation(); onToggleExpand?.(); }}
          aria-label={open ? "Collapse" : "Expand"}
          className="relative size-[16px] flex items-center justify-center shrink-0 text-c-icon-secondary"
          type="button"
        >
          <ChevronRight size={12} strokeWidth={2} className={clsx("transition-transform", open && "rotate-90")} />
        </button>
      ) : (
        <span className="size-[16px] shrink-0" />
      )}
      {/* type icon */}
      <span className={clsx("relative shrink-0 flex items-center", isComponent ? "text-accent-component" : "text-c-icon")}>
        {icon ?? (Icon ? <Icon size={16} strokeWidth={1.5} /> : null)}
      </span>
      {/* name (or rename slot) */}
      {nameNode ?? (
        <span className={clsx(FONT, "relative flex-1 min-w-0 text-[11px] font-[450] leading-[16px] truncate", isComponent ? "text-accent-component" : "text-c-text")}>
          {name}
        </span>
      )}
      {/* trailing: lock (open padlock on hover; closed duotone when locked), then visibility */}
      <button
        onClick={e => { e.stopPropagation(); onToggleLock?.(); }}
        aria-label={locked ? `Unlock ${name}` : `Lock ${name}`}
        className="relative shrink-0 text-c-icon-secondary"
        type="button"
      >
        {locked
          ? <LockDuotone size={14} weight="duotone" />
          : <LockOpen size={14} strokeWidth={1.5} className="opacity-0 group-hover/layer:opacity-100" />}
      </button>
      <button
        onClick={e => { e.stopPropagation(); onToggleVisibility?.(); }}
        aria-label={hidden ? `Show ${name}` : `Hide ${name}`}
        className="relative shrink-0 text-c-icon-secondary"
        type="button"
      >
        {hidden
          ? <EyeOff size={14} strokeWidth={1.5} />
          : <Eye size={14} strokeWidth={1.5} className="opacity-0 group-hover/layer:opacity-100" />}
      </button>
    </div>
  );
});

// ── Standalone (self-managed) layers panel ────────────────────────────────────
function StandaloneLayerList({ layers, title }: { layers: LayerNode[]; title: string }) {
  const [selected, setSelected] = useState<string | null>("2b");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(collectGroupIds(layers)));

  const flat = useMemo(() => {
    const out: FlatRow[] = [];
    flatten(layers, 0, [], expanded, out);
    return out;
  }, [layers, expanded]);

  // The selection highlight is rendered ONCE as a single continuous shape spanning
  // the selected node + its visible descendants (not one pill per row).
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

  return (
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
        const isComponent = row.node.type === "component" || row.node.type === "instance";
        return (
          <LayerRow
            key={row.node.id}
            name={row.node.name}
            type={row.node.type}
            depth={row.depth}
            hidden={row.node.hidden}
            locked={row.node.locked}
            hasChildren={hasChildren}
            open={expanded.has(row.node.id)}
            isComponent={isComponent}
            selected={selected === row.node.id}
            // In standalone mode the continuous highlight above renders the tint,
            // so suppress the per-row fill (pass selected=false for styling but
            // keep aria via a manual attr).
            onClick={() => setSelected(row.node.id)}
            onToggleExpand={() => setExpanded(s => {
              const next = new Set(s);
              next.has(row.node.id) ? next.delete(row.node.id) : next.add(row.node.id);
              return next;
            })}
          />
        );
      })}
    </div>
  );
}

// ── Panel ──────────────────────────────────────────────────────────────────────
export interface LayerListProps {
  /** Standalone/demo data — ignored when `children` is provided. */
  layers?: LayerNode[];
  /** Consumer-composed rows (a list of <LayerRow>). Takes precedence over layers. */
  children?: ReactNode;
  title?: string;
}

export function LayerList({ layers = DEMO_LAYERS, children, title = "Layers" }: LayerListProps) {
  const [scrolled, setScrolled] = useState(false);

  return (
    <div className="w-[240px] shrink-0 h-full flex flex-col bg-c-bg border-r border-c-border overflow-hidden">
      {/* header — the bottom divider only appears once the tree is scrolled */}
      <div className={clsx("shrink-0 h-[40px] flex items-center px-[16px] border-t border-c-border", scrolled && "border-b border-c-border")}>
        <span className={clsx(FONT, "text-[11px] font-[550] leading-[16px] text-c-text")}>{title}</span>
      </div>
      {/* tree — overlay scrollbar (theme-aware thumb) */}
      <ScrollArea className="py-[4px]" onScroll={st => setScrolled(st > 0)}>
        {children
          ? <div role="tree" aria-label={title} className="relative">{children}</div>
          : <StandaloneLayerList layers={layers} title={title} />}
      </ScrollArea>
    </div>
  );
}
