import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { Upload, Search, Image as ImageIcon, Film, Trash2, Plus } from "lucide-react";
import { SegmentedControl } from "./SegmentedControl";
import { FieldShell } from "./Input";

// ─── Assets pane ──────────────────────────────────────────────────────────────
// Left-panel content shown when the Assets nav-rail icon is active — replaces the
// Composition view (Slides + Layers). Stores/organizes uploaded media per-project.
// Componentized to spec (docs/composa/specs/assets-pane.md): header + Upload,
// search field, type filter (All · Images · Videos), 2-col thumbnail grid,
// per-card badge/duration/name, hover quick-actions, empty state, drop overlay.
//
// Light theme by default (c-* tokens); flips to dark under [data-composa-mode="dark"].
// Presentational: fully controlled with callbacks — no upload/DnD side effects here.

const FONT = "font-[family-name:var(--composa-font-family)]";
const LABEL = clsx(FONT, "text-[11px] font-[550] leading-[16px] text-c-text");
const CAPTION = clsx(FONT, "text-[11px] font-[450] leading-[16px] text-c-text-secondary");

export type AssetKind = "image" | "video";
export type AssetStatus = "ready" | "uploading" | "error";
export type AssetFilter = "all" | "images" | "videos";

export interface AssetItem {
  id: string;
  name: string;
  kind: AssetKind;
  thumb?: string;         // preview src (video = first-frame)
  tint?: string;          // solid fallback when no thumb (demo)
  duration?: string;      // video only, e.g. "0:24"
  status?: AssetStatus;   // default "ready"
  progress?: number;      // 0–100 when status="uploading"
}

// ─── Type badge (IMG / VID) ───────────────────────────────────────────────────
function TypeBadge({ kind }: { kind: AssetKind }) {
  return (
    <span
      className={clsx(
        FONT,
        "absolute top-[4px] left-[4px] px-[4px] h-[15px] flex items-center rounded-c-sm",
        "text-[9px] font-[550] leading-none tracking-[0.05em]",
        "bg-c-bg-inverse text-c-text-on-inverse",
      )}
    >
      {kind === "video" ? "VID" : "IMG"}
    </span>
  );
}

// ─── One asset card ───────────────────────────────────────────────────────────
function AssetCard({
  item,
  selected,
  onSelect,
  onDoubleClick,
  onInsert,
  onDelete,
  onContextMenu,
  onRetry,
}: {
  item: AssetItem;
  selected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onInsert: () => void;
  onDelete: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onRetry: () => void;
}) {
  const status = item.status ?? "ready";
  const uploading = status === "uploading";
  const error = status === "error";

  return (
    <div className="flex flex-col gap-[4px] select-none">
      {/* thumbnail */}
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        className={clsx(
          "group/card relative w-full aspect-[4/3] rounded-c-md overflow-hidden outline-none",
          "bg-c-bg-secondary ring-1 ring-inset transition-shadow duration-100",
          "focus-visible:ring-c-focus-ring",
          selected ? "ring-c-border-selected-strong" : "ring-c-border-translucent hover:ring-c-border",
        )}
      >
        {/* preview */}
        {item.thumb ? (
          <img alt="" src={item.thumb} className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: item.tint ?? "var(--color-c-bg-secondary)" }} />
        )}

        {/* type badge */}
        {!uploading && <TypeBadge kind={item.kind} />}

        {/* duration (video) */}
        {!uploading && !error && item.kind === "video" && item.duration && (
          <span
            className={clsx(
              FONT,
              "absolute bottom-[4px] right-[4px] px-[4px] h-[15px] flex items-center rounded-c-sm",
              "text-[9px] font-[550] leading-none tracking-[0.02em]",
              "bg-c-bg-inverse text-c-text-on-inverse tabular-nums",
            )}
          >
            {item.duration}
          </span>
        )}

        {/* uploading overlay — progress bar */}
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-[6px] bg-c-bg/70 px-[12px]">
            <span className={clsx(CAPTION, "!text-c-text")}>Uploading…</span>
            <div className="w-full h-[3px] rounded-c-full bg-c-bg-secondary overflow-hidden">
              <div
                className="h-full rounded-c-full bg-c-bg-brand transition-[width] duration-200"
                style={{ width: `${item.progress ?? 0}%` }}
              />
            </div>
          </div>
        )}

        {/* error overlay — retry */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-[4px] bg-c-bg-danger/15 px-[12px]">
            <span className={clsx(CAPTION, "!text-c-text-danger text-center")}>Upload failed</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onRetry(); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onRetry(); } }}
              className={clsx(FONT, "text-[11px] font-[550] text-c-text-danger underline underline-offset-2 cursor-pointer")}
            >
              Retry
            </span>
          </div>
        )}

        {/* hover quick-actions — Insert + Delete */}
        {!uploading && !error && (
          <div className="absolute inset-0 flex items-start justify-end p-[4px] gap-[4px] opacity-0 group-hover/card:opacity-100 focus-within:opacity-100 transition-opacity bg-gradient-to-b from-black/25 to-transparent">
            <span
              role="button"
              tabIndex={0}
              aria-label="Insert"
              title="Insert"
              onClick={(e) => { e.stopPropagation(); onInsert(); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onInsert(); } }}
              className="flex items-center justify-center size-[22px] rounded-c-sm bg-c-bg/90 text-c-icon hover:bg-c-bg cursor-pointer shadow-sm"
            >
              <Plus size={14} strokeWidth={2} />
            </span>
            <span
              role="button"
              tabIndex={0}
              aria-label="Delete"
              title="Delete"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onDelete(); } }}
              className="flex items-center justify-center size-[22px] rounded-c-sm bg-c-bg/90 text-c-icon hover:text-c-text-danger hover:bg-c-bg cursor-pointer shadow-sm"
            >
              <Trash2 size={13} strokeWidth={2} />
            </span>
          </div>
        )}
      </button>

      {/* name */}
      <span className={clsx(CAPTION, "px-[2px] truncate")} title={item.name}>
        {item.name}
      </span>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-[12px] px-[24px] text-center">
      <div className="flex items-center justify-center size-[40px] rounded-c-full bg-c-bg-secondary text-c-icon-secondary">
        <ImageIcon size={20} strokeWidth={1.5} />
      </div>
      <span className={CAPTION}>No assets yet</span>
      <button
        type="button"
        onClick={onUpload}
        className={clsx(
          "flex items-center gap-[6px] h-[28px] px-[12px] rounded-c-md",
          "bg-c-bg-brand text-c-text-on-brand hover:bg-c-bg-brand-pressed transition-colors",
          FONT, "text-[11px] font-[550]",
        )}
      >
        <Upload size={14} strokeWidth={2} />
        Upload media
      </button>
    </div>
  );
}

// ─── Drop-zone overlay ────────────────────────────────────────────────────────
function DropOverlay() {
  return (
    <div className="absolute inset-0 z-10 m-[8px] flex flex-col items-center justify-center gap-[8px] rounded-c-lg border-2 border-dashed border-c-border-selected bg-c-bg-selected/80 backdrop-blur-sm pointer-events-none">
      <div className="flex items-center justify-center size-[36px] rounded-c-full bg-c-bg text-c-text-brand">
        <Upload size={18} strokeWidth={2} />
      </div>
      <span className={clsx(LABEL, "!text-c-text-brand")}>Drop to upload</span>
      <span className={clsx(FONT, "text-[9px] font-[450] leading-[14px] text-c-text-secondary text-center px-[16px]")}>
        PNG · JPG · WebP · GIF · MP4 · MOV
      </span>
    </div>
  );
}

// ─── Icon button (header Upload) ──────────────────────────────────────────────
function IconButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex items-center justify-center size-[24px] rounded-c-md text-c-icon hover:bg-c-bg-hover transition-colors"
    >
      {icon}
    </button>
  );
}

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO_ASSETS: AssetItem[] = [
  { id: "a1", name: "hero-cover.png", kind: "image", tint: "linear-gradient(135deg,#7c5cff,#ff6ac1)" },
  { id: "a2", name: "product-shot.jpg", kind: "image", tint: "linear-gradient(135deg,#22d3ee,#3b82f6)" },
  { id: "a3", name: "intro-clip.mp4", kind: "video", tint: "linear-gradient(135deg,#111827,#374151)", duration: "0:24" },
  { id: "a4", name: "texture-grain.webp", kind: "image", tint: "linear-gradient(135deg,#f59e0b,#ef4444)" },
  { id: "a5", name: "walkthrough.mov", kind: "video", tint: "linear-gradient(135deg,#059669,#065f46)", duration: "1:08" },
  { id: "a6", name: "logo-loop.gif", kind: "image", tint: "linear-gradient(135deg,#8b5cf6,#6366f1)" },
  { id: "a7", name: "b-roll-drone.mp4", kind: "video", status: "uploading", progress: 62 },
  { id: "a8", name: "broken-render.png", kind: "image", status: "error" },
];

// ─── Panel ────────────────────────────────────────────────────────────────────
export interface AssetsPanelProps {
  assets?: AssetItem[];
  title?: string;
  filter?: AssetFilter;
  onFilterChange?: (f: AssetFilter) => void;
  query?: string;
  onQueryChange?: (q: string) => void;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** demo/controlled: force the OS drag-drop overlay */
  dropActive?: boolean;
  onUpload?: () => void;
  onInsert?: (id: string) => void;
  onAddToTimeline?: (id: string) => void;
  onDelete?: (id: string) => void;
  onContextMenu?: (id: string, e: React.MouseEvent) => void;
  onRetry?: (id: string) => void;
}

export function AssetsPanel({
  assets = DEMO_ASSETS,
  title = "Assets",
  filter,
  onFilterChange,
  query,
  onQueryChange,
  selectedId,
  onSelect,
  dropActive = false,
  onUpload,
  onInsert,
  onAddToTimeline,
  onDelete,
  onContextMenu,
  onRetry,
}: AssetsPanelProps) {
  // Uncontrolled fallbacks so the panel renders standalone.
  const [filterInner, setFilterInner] = useState<AssetFilter>("all");
  const [queryInner, setQueryInner] = useState("");
  const [selInner, setSelInner] = useState<string | null>("a1");
  const [searchFocused, setSearchFocused] = useState(false);

  const activeFilter = filter ?? filterInner;
  const activeQuery = query ?? queryInner;
  const activeSel = selectedId !== undefined ? selectedId : selInner;

  const setFilter = (f: AssetFilter) => (onFilterChange ?? setFilterInner)(f);
  const setQuery = (q: string) => (onQueryChange ?? setQueryInner)(q);
  const select = (id: string) => (onSelect ?? setSelInner)(id);

  const visible = useMemo(() => {
    return assets.filter((a) => {
      if (activeFilter === "images" && a.kind !== "image") return false;
      if (activeFilter === "videos" && a.kind !== "video") return false;
      if (activeQuery && !a.name.toLowerCase().includes(activeQuery.toLowerCase())) return false;
      return true;
    });
  }, [assets, activeFilter, activeQuery]);

  const hasAny = assets.length > 0;

  return (
    <div className="relative w-[240px] shrink-0 h-full flex flex-col bg-c-bg border-r border-c-border overflow-hidden">
      {/* Header — Assets label + Upload */}
      <div className="shrink-0 h-[40px] flex items-center pl-[16px] pr-[8px] border-b border-c-border">
        <span className={clsx(LABEL, "flex-1")}>{title}</span>
        <IconButton icon={<Upload size={16} strokeWidth={1.75} />} label="Upload" onClick={onUpload} />
      </div>

      {/* Controls — search + type filter */}
      <div className="shrink-0 flex flex-col gap-[8px] p-[8px] border-b border-c-border">
        <FieldShell focused={searchFocused} size="medium">
          <span className="absolute left-0 flex items-center justify-center size-[24px] shrink-0 text-c-icon-secondary pointer-events-none">
            <Search size={14} strokeWidth={1.75} />
          </span>
          <input
            type="text"
            value={activeQuery}
            placeholder="Search assets"
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={clsx(
              "w-full h-full bg-transparent outline-none pl-[24px] pr-[8px]",
              FONT, "font-[450] tracking-[0.005em] text-[11px] leading-[16px]",
              "text-c-text placeholder:text-c-text-tertiary",
            )}
          />
        </FieldShell>

        <SegmentedControl
          value={activeFilter}
          onChange={(v) => setFilter(v as AssetFilter)}
          segments={[
            { value: "all", label: "All" },
            { value: "images", label: "Images", icon: <ImageIcon size={13} strokeWidth={1.75} /> },
            { value: "videos", label: "Videos", icon: <Film size={13} strokeWidth={1.75} /> },
          ]}
        />
      </div>

      {/* Body — grid / empty */}
      {!hasAny ? (
        <EmptyState onUpload={() => onUpload?.()} />
      ) : visible.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-[24px] text-center">
          <span className={CAPTION}>No matching assets</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-[8px]">
          <div className="grid grid-cols-2 gap-[8px]">
            {visible.map((item) => (
              <AssetCard
                key={item.id}
                item={item}
                selected={activeSel === item.id}
                onSelect={() => select(item.id)}
                onDoubleClick={() =>
                  item.kind === "video" ? onAddToTimeline?.(item.id) : onInsert?.(item.id)
                }
                onInsert={() => onInsert?.(item.id)}
                onDelete={() => onDelete?.(item.id)}
                onContextMenu={(e) => {
                  if (onContextMenu) { e.preventDefault(); onContextMenu(item.id, e); }
                }}
                onRetry={() => onRetry?.(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* OS drag-drop overlay */}
      {dropActive && <DropOverlay />}
    </div>
  );
}
