import { useEffect, useId, useMemo, useRef, useState, type DragEvent, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { SidePanel } from "./SidePanel";
import { clsx } from "clsx";
import { Upload, Search, Image as ImageIcon, Trash2, Plus, Pencil, ChevronRight, Library } from "lucide-react";
import { Dropdown } from "./Dropdown";
import { Tabs } from "./Tabs";
import { FieldShell, InputField } from "./Input";
import { Menu, MenuRow, PopoverMenu } from "./Menu";
import { Modal, ModalBody, ModalFooter, ModalHeader, MODAL_WIDTHS } from "./Dialog";
import { Button } from "./Button";
import { Waveform } from "./Waveform";
import { iconForSemantic } from "./IconSemantics";

// ─── Assets pane ──────────────────────────────────────────────────────────────
// Left-panel content shown when the Assets nav-rail icon is active — replaces the
// Composition view (Slides + Layers). Stores/organizes uploaded media per-project.
// Componentized to spec (docs/composa/specs/assets-pane.md): header + Upload,
// search field, type filter (All · Images · Videos · Audio) as a dropdown,
// 2-col thumbnail grid, per-card badge/duration/name, hover quick-actions,
// empty state, drop overlay. Audio cards render a waveform (a colour swatch
// reads wrong for sound) instead of a solid tint.
//
// Light theme by default (c-* tokens); flips to dark under [data-composa-mode="dark"].
// Presentational: fully controlled with callbacks — no upload/DnD side effects here.

const FONT = "font-[family-name:var(--composa-font-family)]";
const LABEL = clsx(FONT, "text-[11px] font-[550] leading-[16px] text-c-text");
const CAPTION = clsx(FONT, "text-[11px] font-[450] leading-[16px] text-c-text-secondary");

export type AssetKind = "image" | "video" | "audio";
export type AssetStatus = "ready" | "uploading" | "error";
export type AssetFilter = "all" | "images" | "videos" | "audio";
/** Top-level pane: this project's own media, or shared libraries to discover. */
export type AssetsPanelTab = "library" | "community";

// Tab ids double as the tabpanel ids so `Tabs` can wire real tab/tabpanel a11y.
const LIBRARY_PANEL_ID = "composa-assets-library";
const COMMUNITY_PANEL_ID = "composa-assets-community";
const ASSET_TABS = [
  { value: "library", label: "Library", panelId: LIBRARY_PANEL_ID },
  { value: "community", label: "Community", panelId: COMMUNITY_PANEL_ID },
];
const VideoMediaIcon = iconForSemantic("media-video");
const AudioMediaIcon = iconForSemantic("media-audio");

/** A named grouping of assets inside the Library tab. */
export interface AssetLibrary {
  id: string;
  name: string;
}

// Type-filter options (shared by the dropdown trigger + its menu). Icons match
// the per-kind badges; "All" has no icon.
const FILTER_OPTIONS: { value: AssetFilter; label: string; icon?: React.ReactNode }[] = [
  { value: "all", label: "All" },
  { value: "images", label: "Images", icon: <ImageIcon size={14} strokeWidth={1.75} /> },
  { value: "videos", label: "Videos", icon: <VideoMediaIcon data-icon-semantic="media-video" size={14} strokeWidth={1.75} /> },
  { value: "audio", label: "Audio", icon: <AudioMediaIcon data-icon-semantic="media-audio" size={14} strokeWidth={1.75} /> },
];
const FILTER_LABELS = Object.fromEntries(FILTER_OPTIONS.map((o) => [o.value, o.label])) as Record<AssetFilter, string>;

export interface AssetItem {
  id: string;
  name: string;
  kind: AssetKind;
  thumb?: string;         // preview src (video = first-frame)
  tint?: string;          // solid fallback when no thumb (demo)
  duration?: string;      // video only, e.g. "0:24"
  /** App-owned object URL and metadata for pointer-position video skimming.
   *  The idle `thumb` remains the accessible/error/touch fallback. */
  videoPreview?: {
    src: string;
    durationMs: number;
  };
  status?: AssetStatus;   // default "ready"
  progress?: number;      // 0–100 when status="uploading"
  errorMessage?: string;  // optional upload error detail
  inUseCount?: number;    // project references; deletion requires confirmation when > 0
  libraryId?: string;     // groups the card under an AssetLibrary section (opt-in)
}

/** Map a horizontal pointer coordinate to a safe media seek position. The tiny
 * end guard keeps the decoder on the final frame instead of entering `ended`. */
export function videoScrubTimeSeconds(
  clientX: number,
  left: number,
  width: number,
  durationSeconds: number,
): number {
  const fraction = videoScrubFraction(clientX, left, width, durationSeconds);
  if (fraction === null) return 0;
  const maxSeek = Math.max(0, durationSeconds - 0.001);
  return fraction * maxSeek;
}

/** The passive playhead uses the same clamped pointer fraction as media seeking. */
export function videoScrubFraction(clientX: number, left: number, width: number, durationSeconds: number): number | null {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || !Number.isFinite(width) || width <= 0) return null;
  return Math.min(1, Math.max(0, (clientX - left) / width));
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
      {kind === "video" ? "VID" : kind === "audio" ? "AUD" : "IMG"}
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
  insertLabel,
  onDelete,
  onContextMenu,
  onRetry,
  previewActive,
  onPreviewStart,
  onPreviewEnd,
}: {
  item: AssetItem;
  selected: boolean;
  onSelect: (event: MouseEvent<HTMLButtonElement>) => void;
  onDoubleClick: () => void;
  onInsert: () => void;
  insertLabel: string;
  onDelete: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onRetry: () => void;
  previewActive: boolean;
  onPreviewStart: () => void;
  onPreviewEnd: () => void;
}) {
  const status = item.status ?? "ready";
  const uploading = status === "uploading";
  const error = status === "error";
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const pendingSeek = useRef<{ clientX: number; left: number; width: number } | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [scrubFraction, setScrubFraction] = useState<number | null>(null);
  const previewInstructionId = useId();
  const canPreview = item.kind === "video" && status === "ready" && !!item.videoPreview && !previewFailed;

  const seekPreview = (video: HTMLVideoElement, pointer = pendingSeek.current) => {
    if (!pointer) return;
    const metadataDuration = Number.isFinite(video.duration) && video.duration > 0
      ? video.duration
      : (item.videoPreview?.durationMs ?? 0) / 1000;
    try {
      video.currentTime = videoScrubTimeSeconds(pointer.clientX, pointer.left, pointer.width, metadataDuration);
    } catch {
      // An unloaded/unsupported decoder keeps the static poster fallback. Its
      // eventual metadata/error event will either retry this seek or end preview.
    }
  };
  const handlePointerEnter = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || item.kind !== "video" || status !== "ready" || !item.videoPreview) return;
    setPreviewFailed(false);
    onPreviewStart();
  };
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!previewActive || !canPreview) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pendingSeek.current = { clientX: event.clientX, left: rect.left, width: rect.width };
    const duration = (item.videoPreview?.durationMs ?? 0) / 1000;
    setScrubFraction(videoScrubFraction(event.clientX, rect.left, rect.width, duration));
    if (previewRef.current) seekPreview(previewRef.current);
  };
  const handlePointerLeave = () => {
    pendingSeek.current = null;
    setScrubFraction(null);
    onPreviewEnd();
  };

  useEffect(() => {
    if (!previewActive) return;
    const video = previewRef.current;
    return () => {
      // The app owns/revokes the object URL. The kit only bounds decoder use by
      // pausing and detaching its source when this one active preview unmounts.
      video?.pause();
      video?.removeAttribute("src");
      video?.load();
    };
  }, [previewActive, item.videoPreview?.src]);

  return (
    <div className="flex flex-col gap-[4px] select-none">
      {/* thumbnail */}
      <div
        data-asset-thumbnail={item.id}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className={clsx(
          "group/card relative w-full aspect-[4/3] rounded-c-md overflow-hidden outline-none",
          "bg-c-bg-secondary ring-1 ring-inset transition-shadow duration-100",
          "focus-within:ring-c-focus-ring",
          selected ? "ring-c-border-selected-strong" : "ring-c-border-translucent hover:ring-c-border",
        )}
      >
        <button type="button" aria-label={item.name} aria-pressed={selected}
          aria-describedby={item.kind === "video" && item.videoPreview ? previewInstructionId : undefined}
          onClick={onSelect} onDoubleClick={onDoubleClick} onContextMenu={onContextMenu}
          className="absolute inset-0 z-[1] size-full outline-none" />
        {/* preview — image/video use the thumb or a tint fallback; audio draws a
            waveform (a solid colour swatch reads wrong for sound). */}
        {item.thumb ? (
          <img alt="" src={item.thumb} className="absolute inset-0 size-full object-cover" />
        ) : item.kind === "audio" ? (
          <div className="absolute inset-0 flex items-center bg-c-bg-secondary px-[12px] py-[16px] text-c-icon-secondary">
            <Waveform seed={item.id || item.name} />
          </div>
        ) : (
          <div className="absolute inset-0" style={{ background: item.tint ?? "var(--color-c-bg-secondary)" }} />
        )}
        {previewActive && canPreview && (
          <video
            ref={previewRef}
            data-asset-scrub-preview={item.id}
            aria-hidden="true"
            src={item.videoPreview?.src}
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={(event) => seekPreview(event.currentTarget)}
            onError={() => { setPreviewFailed(true); onPreviewEnd(); }}
            className="pointer-events-none absolute inset-0 size-full object-cover"
          />
        )}
        {previewActive && scrubFraction !== null && (
          <span data-asset-scrub-playhead={item.id} aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 z-[2] w-px bg-white/90 shadow-[0_0_2px_rgba(0,0,0,0.6)]"
            style={{ left: `${scrubFraction * 100}%` }} />
        )}
        {item.kind === "video" && item.videoPreview && (
          <span id={previewInstructionId} className="sr-only">
            Move the pointer horizontally over this thumbnail to preview the video. The static poster remains available for keyboard and touch input.
          </span>
        )}

        {/* type badge */}
        {!uploading && <TypeBadge kind={item.kind} />}

        {/* duration (video / audio) */}
        {!uploading && !error && (item.kind === "video" || item.kind === "audio") && item.duration && (
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
            <span className={clsx(CAPTION, "!text-c-text-danger text-center")} title={item.errorMessage}>
              {item.errorMessage ?? "Upload failed"}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRetry(); }}
              className={clsx(FONT, "relative z-[2] text-[11px] font-[550] text-c-text-danger underline underline-offset-2 cursor-pointer")}
            >
              Retry
            </button>
          </div>
        )}

        {/* hover quick-actions — Insert + Delete */}
        {!uploading && !error && (
          <div className="absolute inset-0 z-[2] pointer-events-none flex items-start justify-end p-[4px] gap-[4px] opacity-0 group-hover/card:opacity-100 focus-within:opacity-100 transition-opacity bg-gradient-to-b from-black/25 to-transparent">
            <button
              type="button"
              aria-label={insertLabel}
              title={insertLabel}
              onClick={(e) => { e.stopPropagation(); onInsert(); }}
              className="pointer-events-auto flex items-center justify-center size-[22px] rounded-c-sm bg-c-bg/90 text-c-icon hover:bg-c-bg cursor-pointer shadow-sm"
            >
              <Plus size={14} strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Delete"
              title="Delete"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="pointer-events-auto flex items-center justify-center size-[22px] rounded-c-sm bg-c-bg/90 text-c-icon hover:text-c-text-danger hover:bg-c-bg cursor-pointer shadow-sm"
            >
              <Trash2 size={13} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

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

// ─── Community empty state ────────────────────────────────────────────────────
// Honest placeholder: nothing is shared with this account yet, and the panel has
// no discovery backend, so there is deliberately NO call to action here — an
// enabled "Browse community" button would promise a destination that does not
// exist (Composa#661).
function CommunityEmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-[8px] px-[24px] text-center">
      <div className="flex items-center justify-center size-[40px] rounded-c-full bg-c-bg-secondary text-c-icon-secondary">
        <Library size={20} strokeWidth={1.5} />
      </div>
      <span className={LABEL}>No community libraries yet</span>
      <span className={clsx(FONT, "text-[9px] font-[450] leading-[14px] text-c-text-secondary")}>
        Libraries shared with you will show up here.
      </span>
    </div>
  );
}

// ─── Library section header ───────────────────────────────────────────────────
// Label plus a trailing chevron that opens the full list for that one library.
// The chevron only renders when the host passes `onOpenLibrary` — a permanently
// visible chevron with nowhere to go is an inert control.
function LibrarySectionHeader({ name, onOpen }: { name: string; onOpen?: () => void }) {
  return (
    <div className="flex items-center gap-[4px] h-[24px] pl-[2px]">
      <span className={clsx(LABEL, "min-w-0 flex-1 truncate")}>{name}</span>
      {onOpen && (
        <button
          type="button"
          aria-label={`Open ${name}`}
          title={`Open ${name}`}
          onClick={onOpen}
          className="shrink-0 flex items-center justify-center size-[20px] rounded-c-sm text-c-icon hover:bg-c-bg-hover transition-colors"
        >
          <ChevronRight size={14} strokeWidth={2} />
        </button>
      )}
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
  { id: "a1", name: "hero-cover.png", kind: "image", tint: "linear-gradient(135deg,#7c5cff,#ff6ac1)", inUseCount: 2 },
  { id: "a2", name: "product-shot.jpg", kind: "image", tint: "linear-gradient(135deg,#22d3ee,#3b82f6)" },
  { id: "a3", name: "intro-clip.mp4", kind: "video", tint: "linear-gradient(135deg,#111827,#374151)", duration: "0:24" },
  { id: "a4", name: "texture-grain.webp", kind: "image", tint: "linear-gradient(135deg,#f59e0b,#ef4444)" },
  { id: "a5", name: "walkthrough.mov", kind: "video", tint: "linear-gradient(135deg,#059669,#065f46)", duration: "1:08" },
  { id: "a6", name: "logo-loop.gif", kind: "image", tint: "linear-gradient(135deg,#8b5cf6,#6366f1)" },
  { id: "a7", name: "b-roll-drone.mp4", kind: "video", status: "uploading", progress: 62 },
  { id: "a8", name: "broken-render.png", kind: "image", status: "error", errorMessage: "Upload failed" },
];

// ─── Panel ────────────────────────────────────────────────────────────────────
export interface AssetsPanelProps {
  /** Panel width in px (controlled). Share one value across the left rail so
   * the width survives switching tabs (Composa#664). */
  width?: number;
  /** Uncontrolled default when `width` is not provided. Default 240px. */
  defaultWidth?: number;
  onWidthChange?: (width: number) => void;
  assets?: AssetItem[];
  title?: string;
  /** Active top-level tab (controlled). */
  tab?: AssetsPanelTab;
  /** Uncontrolled default. Defaults to the project's own Library. */
  defaultTab?: AssetsPanelTab;
  onTabChange?: (tab: AssetsPanelTab) => void;
  /** Named libraries the Library tab groups assets under, via `AssetItem.libraryId`.
   *  Omit (the default) to render one flat grid, exactly as before. */
  libraries?: AssetLibrary[];
  /** Open the full list for one library — renders the section-header chevron. */
  onOpenLibrary?: (id: string) => void;
  filter?: AssetFilter;
  onFilterChange?: (f: AssetFilter) => void;
  query?: string;
  onQueryChange?: (q: string) => void;
  selectedId?: string | null;
  onSelect?: (id: string, event: MouseEvent<HTMLButtonElement>) => void;
  /** demo/controlled: force the OS drag-drop overlay */
  dropActive?: boolean;
  defaultDropActive?: boolean;
  onDropActiveChange?: (active: boolean) => void;
  onDropFiles?: (files: File[]) => void;
  onUpload?: () => void;
  onInsert?: (id: string) => void;
  onAddToTimeline?: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  onDelete?: (id: string) => void;
  onContextMenu?: (id: string, e: React.MouseEvent) => void;
  onRetry?: (id: string) => void;
}

export function AssetsPanel({
  width,
  defaultWidth,
  onWidthChange,
  assets = DEMO_ASSETS,
  title = "Assets",
  tab,
  defaultTab = "library",
  onTabChange,
  libraries,
  onOpenLibrary,
  filter,
  onFilterChange,
  query,
  onQueryChange,
  selectedId,
  onSelect,
  dropActive,
  defaultDropActive = false,
  onDropActiveChange,
  onDropFiles,
  onUpload,
  onInsert,
  onAddToTimeline,
  onRename,
  onDelete,
  onContextMenu,
  onRetry,
}: AssetsPanelProps) {
  // Uncontrolled fallbacks so the panel renders standalone.
  const [tabInner, setTabInner] = useState<AssetsPanelTab>(defaultTab);
  const [filterInner, setFilterInner] = useState<AssetFilter>("all");
  const [queryInner, setQueryInner] = useState("");
  const [selInner, setSelInner] = useState<string | null>("a1");
  const [dropInner, setDropInner] = useState(defaultDropActive);
  const dragDepth = useRef(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [contextAsset, setContextAsset] = useState<{ item: AssetItem; x: number; y: number } | null>(null);
  const [renameAsset, setRenameAsset] = useState<AssetItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteAsset, setDeleteAsset] = useState<AssetItem | null>(null);
  const [scrubPreviewId, setScrubPreviewId] = useState<string | null>(null);

  const activeTab = tab ?? tabInner;
  const setTab = (next: AssetsPanelTab) => {
    if (tab === undefined) setTabInner(next);
    onTabChange?.(next);
  };
  const activeFilter = filter ?? filterInner;
  const activeQuery = query ?? queryInner;
  const activeSel = selectedId !== undefined ? selectedId : selInner;

  const setFilter = (f: AssetFilter) => (onFilterChange ?? setFilterInner)(f);
  const setQuery = (q: string) => (onQueryChange ?? setQueryInner)(q);
  const activeDrop = dropActive ?? dropInner;
  const select = (id: string, event: MouseEvent<HTMLButtonElement>) => {
    if (onSelect) onSelect(id, event);
    else setSelInner(id);
  };
  const setDrop = (active: boolean) => {
    if (dropActive === undefined) setDropInner(active);
    onDropActiveChange?.(active);
  };
  const onDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current += 1;
    setDrop(true);
  };
  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDrop(false);
  };
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDrop(false);
    const files = Array.from(event.dataTransfer.files);
    if (files.length) onDropFiles?.(files);
  };

  const visible = useMemo(() => {
    return assets.filter((a) => {
      if (activeFilter === "images" && a.kind !== "image") return false;
      if (activeFilter === "videos" && a.kind !== "video") return false;
      if (activeFilter === "audio" && a.kind !== "audio") return false;
      if (activeQuery && !a.name.toLowerCase().includes(activeQuery.toLowerCase())) return false;
      return true;
    });
  }, [assets, activeFilter, activeQuery]);

  // Group the ALREADY filtered/searched cards, so a section only survives if it
  // still has a matching asset — a header over an empty grid reads as a bug.
  // Cards whose libraryId names no known library keep rendering, headerless.
  const grouped = useMemo(() => {
    if (!libraries?.length) return null;
    const buckets = new Map(libraries.map(library => [library.id, [] as AssetItem[]]));
    const ungrouped: AssetItem[] = [];
    for (const item of visible) {
      const bucket = item.libraryId ? buckets.get(item.libraryId) : undefined;
      (bucket ?? ungrouped).push(item);
    }
    return {
      sections: libraries
        .map(library => ({ ...library, items: buckets.get(library.id) ?? [] }))
        .filter(section => section.items.length > 0),
      ungrouped,
    };
  }, [libraries, visible]);

  const hasAny = assets.length > 0;
  const insertAsset = (item: AssetItem) => {
    if (item.kind === "video" || item.kind === "audio") onAddToTimeline?.(item.id);
    else onInsert?.(item.id);
  };
  const requestRename = (item: AssetItem) => {
    setContextAsset(null);
    setRenameValue(item.name);
    setRenameAsset(item);
  };
  const requestDelete = (item: AssetItem) => {
    setContextAsset(null);
    if ((item.inUseCount ?? 0) > 0) setDeleteAsset(item);
    else onDelete?.(item.id);
  };
  const commitRename = () => {
    if (!renameAsset || !renameValue.trim()) return;
    onRename?.(renameAsset.id, renameValue.trim());
    setRenameAsset(null);
  };

  // One card renderer shared by the flat grid and the per-library sections.
  const renderCard = (item: AssetItem) => (
    <AssetCard
      key={item.id}
      item={item}
      selected={activeSel === item.id}
      onSelect={event => select(item.id, event)}
      onDoubleClick={() => insertAsset(item)}
      onInsert={() => insertAsset(item)}
      insertLabel={item.kind === "video" || item.kind === "audio" ? "Add to timeline" : "Insert on slide"}
      onDelete={() => requestDelete(item)}
      onContextMenu={(e) => {
        e.preventDefault();
        setContextAsset({ item, x: e.clientX, y: e.clientY });
        onContextMenu?.(item.id, e);
      }}
      onRetry={() => onRetry?.(item.id)}
      previewActive={scrubPreviewId === item.id}
      onPreviewStart={() => setScrubPreviewId(item.id)}
      onPreviewEnd={() => setScrubPreviewId(current => current === item.id ? null : current)}
    />
  );
  const renderGrid = (items: AssetItem[]) => <div className="grid grid-cols-2 gap-[8px]">{items.map(renderCard)}</div>;

  return (
    <SidePanel width={width} defaultWidth={defaultWidth} onWidthChange={onWidthChange}
      onDragEnter={onDragEnter} onDragOver={event => event.preventDefault()} onDragLeave={onDragLeave} onDrop={onDrop}>
      {/* Header — Assets label + Upload. Title uses the same hierarchy as the
          composition panel's "Product review" title (13px/550), not the smaller
          11px section-label size. */}
      <div className="shrink-0 h-[40px] flex items-center pl-[16px] pr-[8px] border-b border-c-border">
        <span className={clsx(FONT, "flex-1 text-c-text text-[13px] font-[550] leading-[22px] tracking-[-0.0325px] truncate")}>{title}</span>
        <IconButton icon={<Upload size={16} strokeWidth={1.75} />} label="Upload" onClick={onUpload} />
      </div>

      {/* Tabs — this project's own Library vs. Community discovery (Composa#661).
          Everything below belongs to the active tab, so search/filter/grid never
          claim to be filtering something they are not. */}
      <div className="shrink-0 flex items-center px-[8px] py-[6px]">
        <Tabs tabs={ASSET_TABS} value={activeTab} onChange={value => setTab(value as AssetsPanelTab)} />
      </div>

      {activeTab === "community" ? (
        <div id={COMMUNITY_PANEL_ID} role="tabpanel" aria-labelledby={`${COMMUNITY_PANEL_ID}-tab`} className="flex-1 min-h-0 flex flex-col">
          <CommunityEmptyState />
        </div>
      ) : (
        <div id={LIBRARY_PANEL_ID} role="tabpanel" aria-labelledby={`${LIBRARY_PANEL_ID}-tab`} className="flex-1 min-h-0 flex flex-col">
        {/* Controls — search + type filter */}
        <div className="shrink-0 flex flex-col gap-[8px] p-[8px] border-t border-b border-c-border">
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

          {/* Type filter — a dropdown (not a segmented control): with Audio added
              the four options crowd the 240px panel, so a menu-pick reads cleaner.
              Borderless, label-only trigger matching the top-right canvas-size
              control (ProjectCanvasSizeControl): no container stroke, no leading
              icon — just the label + chevron (owner ask #460). */}
          <PopoverMenu
            align="left"
            className="w-fit"
            trigger={
              <Dropdown
                ariaLabel="Filter by type"
                value={FILTER_LABELS[activeFilter]}
                stroke={false}
              />
            }
          >
            {(close) => (
              <Menu>
                {FILTER_OPTIONS.map((opt) => (
                  <MenuRow
                    key={opt.value}
                    type="checkmark"
                    selectionRole="radio"
                    checked={opt.value === activeFilter}
                    leading={opt.icon}
                    label={opt.label}
                    onClick={() => { setFilter(opt.value); close(); }}
                  />
                ))}
              </Menu>
            )}
          </PopoverMenu>
        </div>

        {/* Body — sectioned grid / flat grid / empty */}
        {!hasAny ? (
          <EmptyState onUpload={() => onUpload?.()} />
        ) : visible.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-[24px] text-center">
            <span className={CAPTION}>No matching assets</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-[8px]">
            {grouped ? (
              <div className="flex flex-col gap-[12px]">
                {grouped.sections.map(section => (
                  <section key={section.id} aria-label={section.name} className="flex flex-col gap-[4px]">
                    <LibrarySectionHeader name={section.name} onOpen={onOpenLibrary ? () => onOpenLibrary(section.id) : undefined} />
                    {renderGrid(section.items)}
                  </section>
                ))}
                {grouped.ungrouped.length > 0 && renderGrid(grouped.ungrouped)}
              </div>
            ) : renderGrid(visible)}
          </div>
        )}
        </div>
      )}

      {/* OS drag-drop overlay */}
      {activeDrop && <DropOverlay />}

      {contextAsset && (
        <>
          <button type="button" aria-label="Close asset menu" className="fixed inset-0 z-20 cursor-default" onClick={() => setContextAsset(null)} />
          <div className="fixed z-30" style={{ left: contextAsset.x, top: contextAsset.y }}>
            <Menu>
              <MenuRow label={contextAsset.item.kind === "video" || contextAsset.item.kind === "audio" ? "Add to timeline" : "Insert on slide"}
                leading={contextAsset.item.kind === "video" ? <VideoMediaIcon data-icon-semantic="media-video" size={14} /> : contextAsset.item.kind === "audio" ? <AudioMediaIcon data-icon-semantic="media-audio" size={14} /> : <Plus size={14} />}
                onClick={() => { insertAsset(contextAsset.item); setContextAsset(null); }} />
              <MenuRow label="Rename" leading={<Pencil size={14} />} onClick={() => requestRename(contextAsset.item)} />
              <MenuRow type="divider" />
              <MenuRow label="Delete" leading={<Trash2 size={14} />} destructive onClick={() => requestDelete(contextAsset.item)} />
            </Menu>
          </div>
        </>
      )}

      <Modal open={renameAsset !== null} onClose={() => setRenameAsset(null)} width={MODAL_WIDTHS.dialog}>
        <ModalHeader title="Rename asset" onClose={() => setRenameAsset(null)} />
        <ModalBody padding scrollable={false}>
          <InputField label="Name" value={renameValue} onChange={setRenameValue} />
        </ModalBody>
        <ModalFooter>
          <Button label="Cancel" variant="Secondary" onClick={() => setRenameAsset(null)} />
          <Button label="Rename" disabled={!renameValue.trim()} onClick={commitRename} />
        </ModalFooter>
      </Modal>

      <Modal open={deleteAsset !== null} onClose={() => setDeleteAsset(null)} width={MODAL_WIDTHS.dialog}>
        <ModalHeader title="Delete asset?" onClose={() => setDeleteAsset(null)} />
        <ModalBody padding scrollable={false}>
          <p className={CAPTION}>
            {deleteAsset?.name} is used {deleteAsset?.inUseCount} {deleteAsset?.inUseCount === 1 ? "time" : "times"} in this project. Deleting it may leave missing media.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button label="Cancel" variant="Secondary" onClick={() => setDeleteAsset(null)} />
          <Button label="Delete" variant="Destructive" onClick={() => {
            if (deleteAsset) onDelete?.(deleteAsset.id);
            setDeleteAsset(null);
          }} />
        </ModalFooter>
      </Modal>
    </SidePanel>
  );
}
