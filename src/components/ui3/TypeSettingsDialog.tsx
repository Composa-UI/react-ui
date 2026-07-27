import type { ReactElement } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";
import { InspectorDialog, COMPACT_INSPECTOR_DIALOG_WIDTH } from "./InspectorDialog";
import { NumericInput } from "./Input";
import { PanelFieldRow } from "./Panel";

const FONT = "font-[family-name:var(--composa-font-family)]";

export interface TypeSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  trigger: ReactElement;
  value: { lineHeight: number; letterSpacing: number };
  onChange?: (patch: { lineHeight?: number; letterSpacing?: number }) => void;
}

/**
 * Shared, non-modal typography settings surface. It deliberately exposes only
 * host-backed properties; future type capabilities should extend this contract
 * instead of adding inert rows to PropertyPanel.
 */
export function TypeSettingsDialog({
  open,
  onClose,
  trigger,
  value,
  onChange,
}: TypeSettingsDialogProps) {
  return (
    <InspectorDialog
      open={open}
      onClose={onClose}
      trigger={trigger}
      ariaLabel="Type settings"
      width={COMPACT_INSPECTOR_DIALOG_WIDTH}
      elevation={400}
    >
      <div className="flex h-[40px] items-center border-b border-c-border px-[8px]">
        <h2 className={clsx(FONT, "min-w-0 flex-1 truncate text-[11px] font-[550] text-c-text")}>
          Type settings
        </h2>
        <button
          type="button"
          aria-label="Close type settings"
          onClick={onClose}
          className="flex size-[24px] items-center justify-center rounded-c-sm text-c-icon-secondary hover:bg-c-bg-hover"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>
      <div className="py-[8px]">
        <PanelFieldRow
          label="Metrics"
          left={
            <NumericInput
              ariaLabel="Type settings line height"
              iconLead={<span className={FONT}>↕</span>}
              value={value.lineHeight}
              min={0}
              onChange={lineHeight => onChange?.({ lineHeight })}
            />
          }
          right={
            <NumericInput
              ariaLabel="Type settings letter spacing"
              iconLead={<span className={FONT}>AV</span>}
              value={value.letterSpacing}
              suffix="%"
              onChange={letterSpacing => onChange?.({ letterSpacing })}
            />
          }
        />
      </div>
    </InspectorDialog>
  );
}
