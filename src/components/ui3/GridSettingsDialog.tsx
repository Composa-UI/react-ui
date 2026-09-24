import { Columns2, Minus, Plus, Rows2, X } from "lucide-react";
import { clsx } from "clsx";
import { type ReactElement } from "react";
import { AlignmentControl, type AlignmentValue } from "./AlignmentControl";
import {
  COMPACT_INSPECTOR_DIALOG_WIDTH,
  COMPOSA_INSPECTOR_SURFACE_SELECTOR,
  GRID_SETTINGS_INSPECTOR_SIDE_OFFSET,
  InspectorDialog,
} from "./InspectorDialog";
import { NumericComboInput } from "./Input";
import { GRID_TRACK_LIMIT } from "./GridTrackContract";
import { Menu, MenuRow } from "./Menu";
import { PanelActionBtn } from "./Panel";
import type { ElementGridSettings, ElementGridTrack, GridContentAlign, InspectorKeyframeControl } from "./PropertyPanel";

// Grid settings — the externalised half of the grid inspector (Composa#661 RP-16).
// The owner's verdict on the first pass was that the inspector "did too much by
// showing the columns and grid inline rather than externalising it to a menu or a
// dedicated inspector". The per-track Column/Row editors and the secondary
// content alignment live here; the inline Grid section keeps only Flow, ONE
// alignment picker, the two gaps, padding and sizing.
//
// This reuses the anchored InspectorDialog idiom the DS already uses for every
// other "settings" entry point (Type / Stroke / Effects / Auto layout) rather
// than inventing a surface. See the PR body: whether the owner's "dedicated
// right inspector" means this anchored dialog or a full right-rail view swap is
// NOT settled, and a rail view would additionally need an app-side seam.

const SUB_LABEL = "font-[family-name:var(--composa-font-family)] text-[9px] font-[450] leading-[14px] tracking-[0.05em] text-c-text-secondary mb-[3px]";

/** Content alignment places the whole track block inside a larger frame. */
const gridContentCode = (grid: ElementGridSettings): AlignmentValue => {
  const h = grid.justifyContent === "center" ? "c" : grid.justifyContent === "end" ? "r" : "l";
  const v = grid.alignContent === "center" ? "m" : grid.alignContent === "end" ? "b" : "t";
  return `${v}${h}` as AlignmentValue;
};

const codeToContent = (code: AlignmentValue) => ({
  justifyContent: (code[1] === "c" ? "center" : code[1] === "r" ? "end" : "start") as GridContentAlign,
  alignContent: (code[0] === "m" ? "center" : code[0] === "b" ? "end" : "start") as GridContentAlign,
});

function GridTrackEditor({ axis, tracks, keyframes, onChange }: { axis: "row" | "column"; tracks: ElementGridTrack[]; keyframes?: Record<string, InspectorKeyframeControl>; onChange: (tracks: ElementGridTrack[]) => void }) {
  const label = axis === "column" ? "Column" : "Row";
  const setTrack = (index: number, next: ElementGridTrack) => onChange(tracks.map((track, i) => (i === index ? next : track)));
  const removeTrack = (index: number) => { if (tracks.length <= 1) return; onChange(tracks.filter((_, i) => i !== index)); };
  const trackMenu = (index: number, track: ElementGridTrack) => (close: () => void) => (
    <Menu>
      <MenuRow type="checkmark" label="Fixed" checked={track.mode === "fixed"} onClick={() => { setTrack(index, { ...track, mode: "fixed", size: track.size || 100 }); close(); }} />
      <MenuRow type="checkmark" label="Hug" checked={track.mode === "hug"} onClick={() => { setTrack(index, { ...track, mode: "hug", size: track.size }); close(); }} />
    </Menu>
  );
  return (
    <div className="flex flex-col gap-[4px]" role="group" aria-label={`${label} tracks`}>
      {tracks.map((track, index) => (
        <div key={track.id} className="flex items-center gap-[4px]">
          <div className="flex-1 min-w-0">
            <NumericComboInput
              dataMode={track.mode}
              ariaLabel={`${label} ${index + 1} size`}
              dropdownAriaLabel={`${label} ${index + 1} sizing mode: ${track.mode === "hug" ? "Hug" : "Fixed"}`}
              iconLead={axis === "column" ? <Columns2 size={16} strokeWidth={1.5} /> : <Rows2 size={16} strokeWidth={1.5} />}
              // Hug shows a "Hug" idle label but stays type-to-convert (Figma parity):
              // typing a px value on a hug track atomically switches it to Fixed.
              idleLabel={track.mode === "hug" ? "Hug" : undefined}
              value={track.mode === "fixed" ? track.size : undefined}
              defaultValue={track.size || 100}
              onChange={size => setTrack(index, { ...track, mode: "fixed", size })}
              min={0}
              suffix="px"
              keyframe={track.mode === "fixed" ? keyframes?.[track.id] : undefined}
              menu={trackMenu(index, track)}
              className="w-full"
            />
          </div>
          <PanelActionBtn icon={<Minus size={16} strokeWidth={1.5} />} label={`Remove ${label.toLowerCase()} ${index + 1}`} disabled={tracks.length <= 1} onClick={() => removeTrack(index)} />
        </div>
      ))}
    </div>
  );
}

export interface GridSettingsDialogProps {
  open: boolean;
  grid: ElementGridSettings;
  trigger: ReactElement;
  /** Patches merge into the host's ElementGridSettings — the same contract the
   *  inline section emits, so the app's onLayoutChange handler is unchanged. */
  onChange?: (patch: Partial<ElementGridSettings>) => void;
  /** Stable track-id keyed motion controls. Auto/Hug tracks never expose a diamond. */
  keyframes?: Record<string, InspectorKeyframeControl>;
  /** Semantic creation intent. The host owns durable track identity and document mutation. */
  onAddTrack?: (axis: "row" | "column") => void;
  onClose: () => void;
}

export function GridSettingsDialog({ open, grid, trigger, onChange, keyframes, onAddTrack, onClose }: GridSettingsDialogProps) {
  return (
    <InspectorDialog
      open={open}
      onClose={onClose}
      trigger={trigger}
      ariaLabel="Grid Settings"
      width={COMPACT_INSPECTOR_DIALOG_WIDTH}
      sideOffset={GRID_SETTINGS_INSPECTOR_SIDE_OFFSET}
      anchorSurfaceSelector={COMPOSA_INSPECTOR_SURFACE_SELECTOR}
      elevation={400}
      triggerClassName="inline-flex"
    >
      <div className="flex h-[40px] items-center border-b border-c-border px-[12px]">
        <h2 className="m-0 flex-1 font-[family-name:var(--composa-font-family)] [font-size:var(--composa-body-medium-size)] [line-height:var(--composa-body-medium-line)] [font-weight:var(--composa-body-medium-strong-weight)] [letter-spacing:var(--composa-body-medium-letter-spacing)] text-c-text">
          Grid Settings
        </h2>
        <button
          type="button"
          aria-label="Close Grid Settings"
          onClick={onClose}
          className="flex size-[24px] items-center justify-center rounded-c-sm text-c-icon-secondary outline-none hover:bg-c-bg-hover focus-visible:ring-1 focus-visible:ring-c-focus-ring"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>
      <div className="flex flex-col gap-[8px] p-[12px]">
        <div className="flex items-start gap-[8px]">
          <div className="flex-1 min-w-0">
            <div className={clsx(SUB_LABEL)}>Columns</div>
            <GridTrackEditor axis="column" tracks={grid.columns} keyframes={keyframes} onChange={columns => onChange?.({ columns })} />
          </div>
          <div className="shrink-0 pt-[17px]">
            <PanelActionBtn icon={<Plus size={16} strokeWidth={1.5} />} label="Add column" disabled={!onAddTrack || grid.columns.length >= GRID_TRACK_LIMIT} onClick={() => grid.columns.length < GRID_TRACK_LIMIT && onAddTrack?.("column")} />
          </div>
        </div>

        <div className="flex items-start gap-[8px]">
          <div className="flex-1 min-w-0">
            <div className={clsx(SUB_LABEL)}>Rows</div>
            <GridTrackEditor axis="row" tracks={grid.rows} keyframes={keyframes} onChange={rows => onChange?.({ rows })} />
          </div>
          <div className="shrink-0 pt-[17px]">
            <PanelActionBtn icon={<Plus size={16} strokeWidth={1.5} />} label="Add row" disabled={!onAddTrack || grid.rows.length >= GRID_TRACK_LIMIT} onClick={() => grid.rows.length < GRID_TRACK_LIMIT && onAddTrack?.("row")} />
          </div>
        </div>

        {/* Content alignment is the SECONDARY alignment (where the track block sits
            in a larger frame). It used to be a second 3×3 stacked beside the item
            one in the inline panel, which is the duplication the owner rejected. */}
        <div>
          <div className={clsx(SUB_LABEL)}>Content alignment</div>
          <AlignmentControl
            ariaLabel="Grid content alignment"
            value={gridContentCode(grid)}
            onChange={code => onChange?.(codeToContent(code))}
          />
        </div>
      </div>
    </InspectorDialog>
  );
}
