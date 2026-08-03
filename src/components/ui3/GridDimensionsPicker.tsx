import { Columns2, Minus, Plus, Rows2 } from "lucide-react";
import { type CSSProperties } from "react";
import { NumericComboInput } from "./Input";
import { Menu, MenuRow, PopoverMenu } from "./Menu";
import { PanelActionBtn } from "./Panel";
import type { ElementGridSettings, ElementGridTrack, InspectorKeyframeControl } from "./PropertyPanel";

const TRACK_LIMIT = 6;

function TrackEditor({ axis, tracks, keyframes, onChange }: {
  axis: "row" | "column";
  tracks: ElementGridTrack[];
  keyframes?: Record<string, InspectorKeyframeControl>;
  onChange: (tracks: ElementGridTrack[]) => void;
}) {
  const label = axis === "column" ? "Column" : "Row";
  const setTrack = (index: number, next: ElementGridTrack) => onChange(tracks.map((track, itemIndex) => itemIndex === index ? next : track));
  return <div role="group" aria-label={`${label} tracks`} className="flex flex-col gap-[4px]">
    {tracks.map((track, index) => <div key={track.id} className="flex items-center gap-[4px] px-[8px]">
      <div className="w-[168px]">
        <NumericComboInput
          dataMode={track.mode}
          ariaLabel={`${label} ${index + 1} size`}
          dropdownAriaLabel={`${label} ${index + 1} sizing mode: ${track.mode === "hug" ? "Hug" : "Fixed"}`}
          iconLead={axis === "column" ? <Columns2 size={16} strokeWidth={1.5} /> : <Rows2 size={16} strokeWidth={1.5} />}
          idleLabel={track.mode === "hug" ? "Auto" : undefined}
          value={track.mode === "fixed" ? track.size : undefined}
          defaultValue={track.size || 100}
          onChange={size => setTrack(index, { ...track, mode: "fixed", size: Math.max(0, size) })}
          min={0}
          suffix="px"
          keyframe={track.mode === "fixed" ? keyframes?.[track.id] : undefined}
          menu={close => <Menu>
            <MenuRow type="checkmark" label="Fixed" checked={track.mode === "fixed"} onClick={() => { setTrack(index, { ...track, mode: "fixed", size: track.size || 100 }); close(); }} />
            <MenuRow type="checkmark" label="Auto" checked={track.mode === "hug"} onClick={() => { setTrack(index, { ...track, mode: "hug", size: track.size }); close(); }} />
          </Menu>}
        />
      </div>
      <PanelActionBtn
        icon={<Minus size={16} strokeWidth={1.5} />}
        label={`Remove ${label.toLowerCase()} ${index + 1}`}
        disabled={tracks.length <= 1}
        onClick={() => tracks.length > 1 && onChange(tracks.filter((_, itemIndex) => itemIndex !== index))}
      />
    </div>)}
  </div>;
}

export interface GridDimensionsPickerProps {
  grid: ElementGridSettings;
  keyframes?: Record<string, InspectorKeyframeControl>;
  onChange?: (patch: Partial<ElementGridSettings>) => void;
}

const createTrack = (axis: "row" | "column"): ElementGridTrack => ({
  id: `grid-track-${axis}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
  mode: "hug",
  size: 100,
});

/** Compact Figma grid face. It edits dimensions in a menu; it is not a second Inspector section/dialog. */
export function GridDimensionsPicker({ grid, keyframes, onChange }: GridDimensionsPickerProps) {
  const columns = grid.columns.length;
  const autoRows = grid.rows.every(track => track.mode === "hug");
  const summary = `${columns} × ${autoRows ? "Auto" : grid.rows.length}`;
  const previewColumns = Math.min(TRACK_LIMIT, Math.max(1, columns));
  const previewRows = Math.min(3, Math.max(1, grid.rows.length));
  return <PopoverMenu
    directTrigger
    trigger={<button
      type="button"
      aria-label={`Grid dimensions: ${summary}`}
      className="relative grid h-[56px] w-[88px] overflow-hidden rounded-c-md bg-c-bg-secondary p-[3px] text-c-text ring-1 ring-inset ring-c-border outline-none focus-visible:ring-2 focus-visible:ring-c-border-selected-strong"
      style={{ gridTemplateColumns: `repeat(${previewColumns}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${previewRows}, minmax(0, 1fr))`, gap: 2 } as CSSProperties}
    >
      {Array.from({ length: previewColumns * previewRows }, (_, index) => <span key={index} className="rounded-[2px] bg-c-bg" />)}
      <span className="absolute inset-0 flex items-center justify-center font-[family-name:var(--composa-font-family)] text-[11px] font-[450] leading-[16px]">{summary}</span>
    </button>}
  >
    {() => <Menu className="gap-[8px] py-[8px]" >
      <div role="group" aria-label="Grid dimensions" className="flex flex-col gap-[8px]">
        <div>
          <div className="px-[8px] pb-[3px] font-[family-name:var(--composa-font-family)] text-[9px] font-[450] leading-[14px] text-c-text-secondary">Columns</div>
          <TrackEditor axis="column" tracks={grid.columns} keyframes={keyframes} onChange={columnsValue => onChange?.({ columns: columnsValue })} />
          <div className="px-[8px] pt-[4px]"><PanelActionBtn icon={<Plus size={16} strokeWidth={1.5} />} label="Add column" disabled={grid.columns.length >= TRACK_LIMIT} onClick={() => onChange?.({ columns: [...grid.columns, createTrack("column")] })} /></div>
        </div>
        <div>
          <div className="px-[8px] pb-[3px] font-[family-name:var(--composa-font-family)] text-[9px] font-[450] leading-[14px] text-c-text-secondary">Rows</div>
          <TrackEditor axis="row" tracks={grid.rows} keyframes={keyframes} onChange={rows => onChange?.({ rows })} />
          <div className="px-[8px] pt-[4px]"><PanelActionBtn icon={<Plus size={16} strokeWidth={1.5} />} label="Add row" disabled={grid.rows.length >= TRACK_LIMIT} onClick={() => onChange?.({ rows: [...grid.rows, createTrack("row")] })} /></div>
        </div>
      </div>
    </Menu>}
  </PopoverMenu>;
}
