import type { ReactElement, ReactNode } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";
import {
  COMPACT_INSPECTOR_DIALOG_WIDTH,
  COMPOSA_INSPECTOR_SURFACE_SELECTOR,
  InspectorDialog,
  TYPE_SETTINGS_INSPECTOR_SIDE_OFFSET,
} from "./InspectorDialog";
import { InputField } from "./Input";
import { Dropdown } from "./Dropdown";
import { Menu, MenuRow, PopoverMenu } from "./Menu";
import { Checkbox } from "./Checkbox";

const FONT = "font-[family-name:var(--composa-font-family)]";

/* ─── Value contract ─────────────────────────────────────────────────────── */

export type ExportColorProfile = "sRGB (same as file)" | "sRGB" | "Display P3" | "Unmanaged";
export type ExportImageResampling = "Detailed" | "Bilinear" | "Nearest neighbor";

export interface ExportSettingsValue {
  /** Filename suffix appended to each exported asset. Empty renders as "None". */
  suffix: string;
  colorProfile: ExportColorProfile;
  imageResampling: ExportImageResampling;
  ignoreOverlappingLayers: boolean;
}

export type ExportSettingsPatch = Partial<ExportSettingsValue>;

export interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  trigger: ReactElement;
  value: ExportSettingsValue;
  /** Locked / inherited-lock selection: values stay readable but mutation is disabled. */
  readOnly?: boolean;
  onChange?: (patch: ExportSettingsPatch) => void;
}

export const EXPORT_COLOR_PROFILES: ReadonlyArray<ExportColorProfile> = [
  "sRGB (same as file)",
  "sRGB",
  "Display P3",
  "Unmanaged",
];

export const EXPORT_IMAGE_RESAMPLINGS: ReadonlyArray<ExportImageResampling> = [
  "Detailed",
  "Bilinear",
  "Nearest neighbor",
];

/* ─── Shared field primitive ─────────────────────────────────────────────── */

const ROW_LABEL = clsx(FONT, "w-[96px] shrink-0 text-[11px] leading-[16px] font-[450] text-c-text-secondary");

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[32px] items-center gap-[8px]">
      <span className={ROW_LABEL}>{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/**
 * A menu-pick dropdown row: the neutral Dropdown trigger opens a radio Menu of
 * options. Mirrors the Stroke settings Style picker so the whole dialog stays on
 * the shared Dropdown + PopoverMenu primitives (never a hand-rolled listbox).
 */
function OptionRow<T extends string>({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<T>;
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <FieldRow label={label}>
      <PopoverMenu
        directTrigger
        align="right"
        className="w-full"
        trigger={
          <Dropdown aria-haspopup="menu" ariaLabel={`${label}: ${value}`} value={value} disabled={disabled} fullWidth />
        }
      >
        {close => (
          <Menu>
            {options.map(option => (
              <MenuRow
                key={option}
                type="checkmark"
                selectionRole="radio"
                checked={option === value}
                label={option}
                onClick={() => {
                  onChange(option);
                  close();
                }}
              />
            ))}
          </Menu>
        )}
      </PopoverMenu>
    </FieldRow>
  );
}

/* ─── Dialog ─────────────────────────────────────────────────────────────── */

/**
 * Anchored, non-modal export-settings surface. Adapted from the owner's reference
 * export into canonical @composa/ui primitives + tokens, and hosted on the shared
 * `InspectorDialog` / `AnchoredInspectorOverlay` contract the Type (#431) and
 * Stroke (#430) dialogs use: 240px, elevation-400, portalled + collision-safe.
 *
 * Its side axis anchors to the inspector surface's LEFT edge
 * (`anchorSurfaceSelector`) so it lands clear of the inspector at ANY panel width
 * — the robust anchor established in #499/#73, not a trigger-relative magic offset.
 */
export function ExportDialog({ open, onClose, trigger, value, readOnly = false, onChange }: ExportDialogProps) {
  const editDisabled = readOnly || !onChange;

  return (
    <InspectorDialog
      open={open}
      onClose={onClose}
      trigger={trigger}
      ariaLabel="Export"
      width={COMPACT_INSPECTOR_DIALOG_WIDTH}
      sideOffset={TYPE_SETTINGS_INSPECTOR_SIDE_OFFSET}
      anchorSurfaceSelector={COMPOSA_INSPECTOR_SURFACE_SELECTOR}
      elevation={400}
    >
      <div className="flex h-[40px] items-center border-b border-c-border pl-[16px] pr-[8px]">
        <h2 className={clsx(FONT, "min-w-0 flex-1 truncate text-[11px] font-[550] text-c-text")}>Export</h2>
        <button
          type="button"
          aria-label="Close export settings"
          onClick={onClose}
          className="flex size-[24px] items-center justify-center rounded-c-md text-c-icon-secondary hover:bg-c-bg-hover"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex flex-col gap-[4px] p-[12px]">
        <FieldRow label="Suffix">
          <InputField
            size="medium"
            value={value.suffix}
            placeholder="None"
            disabled={editDisabled}
            onChange={suffix => onChange?.({ suffix })}
          />
        </FieldRow>

        <OptionRow
          label="Color profile"
          value={value.colorProfile}
          options={EXPORT_COLOR_PROFILES}
          disabled={editDisabled}
          onChange={colorProfile => onChange?.({ colorProfile })}
        />

        <OptionRow
          label="Image resampling"
          value={value.imageResampling}
          options={EXPORT_IMAGE_RESAMPLINGS}
          disabled={editDisabled}
          onChange={imageResampling => onChange?.({ imageResampling })}
        />

        <div className="pt-[8px]">
          <Checkbox
            checked={value.ignoreOverlappingLayers}
            disabled={editDisabled}
            label="Ignore overlapping layers"
            onChange={ignoreOverlappingLayers => onChange?.({ ignoreOverlappingLayers })}
          />
        </div>
      </div>

      {readOnly && (
        <p className="sr-only" aria-live="polite">
          Unlock the selection to edit export settings.
        </p>
      )}
    </InspectorDialog>
  );
}

export default ExportDialog;
