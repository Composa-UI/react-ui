import { Eye, EyeOff, X } from "lucide-react";
import { useState, type ReactElement, type ReactNode } from "react";
import { Checkbox } from "./Checkbox";
import { ColorInput, NumericInput } from "./Input";
import { ColorDialog, COLOR_DIALOG_NESTED_EFFECT_SIDE_OFFSET } from "./ColorDialog";
import type { ColorDialogCapabilities } from "./ColorDialog";
import { Dropdown } from "./Dropdown";
import { iconForSemantic } from "./IconSemantics";
import {
  COMPACT_INSPECTOR_DIALOG_WIDTH,
  COMPOSA_INSPECTOR_SURFACE_SELECTOR,
  EFFECTS_INSPECTOR_DIALOG_SIDE_OFFSET,
  InspectorDialog,
} from "./InspectorDialog";
import { Menu, MenuRow, PopoverMenu } from "./Menu";

export type EffectDetailsType = "Drop shadow" | "Inner shadow" | "Layer blur" | "Background blur";

export interface EffectDetailsValue {
  type: EffectDetailsType;
  visible: boolean;
  x?: number;
  y?: number;
  blur?: number;
  spread?: number;
  color?: string;
  opacity?: number;
  showBehindTransparent?: boolean;
}

export interface EffectDetailsDialogProps {
  open: boolean;
  value: EffectDetailsValue;
  trigger: ReactElement;
  capabilities?: ColorDialogCapabilities;
  onChange?: (patch: Partial<EffectDetailsValue>) => void;
  onClose: () => void;
}

const TYPES: EffectDetailsType[] = ["Drop shadow", "Inner shadow", "Layer blur", "Background blur"];
const LABEL = "w-[72px] shrink-0 text-[11px] leading-[16px] font-[450] text-c-text-secondary";

const BlurIcon = iconForSemantic("effect-blur");
const SpreadIcon = iconForSemantic("effect-spread");
// Sized like every other icon `iconLead` in the inspector (cf. rotation/opacity).
const BLUR_LEAD = <BlurIcon data-icon-semantic="effect-blur" size={16} strokeWidth={1.5} />;
const SPREAD_LEAD = <SpreadIcon data-icon-semantic="effect-spread" size={16} strokeWidth={1.5} />;

function NumberRow({ label, value, icon, onChange }: { label: string; value: number; icon: ReactNode; onChange: (value: number) => void }) {
  return <div className="flex items-center gap-[8px] min-h-[32px]">
    <span className={LABEL}>{label}</span>
    <div className="min-w-0 flex-1"><NumericInput ariaLabel={label} iconLead={icon} value={value} onChange={onChange} /></div>
  </div>;
}

function PositionRow({ x, y, onXChange, onYChange }: {
  x: number;
  y: number;
  onXChange: (value: number) => void;
  onYChange: (value: number) => void;
}) {
  return <div className="flex items-center gap-[8px] min-h-[32px]">
    <span className={LABEL}>Position</span>
    <div className="flex min-w-0 flex-1 gap-[4px]">
      <NumericInput ariaLabel="Position X" iconLead={<span className="text-[10px]">X</span>} value={x} onChange={onXChange} />
      <NumericInput ariaLabel="Position Y" iconLead={<span className="text-[10px]">Y</span>} value={y} onChange={onYChange} />
    </div>
  </div>;
}

export function EffectDetailsDialog({ open, value, trigger, capabilities, onChange, onClose }: EffectDetailsDialogProps) {
  const shadow = value.type === "Drop shadow" || value.type === "Inner shadow";
  const [colorOpen, setColorOpen] = useState(false);
  return <InspectorDialog open={open} onClose={onClose} trigger={trigger} ariaLabel="Effect details"
    width={COMPACT_INSPECTOR_DIALOG_WIDTH} sideOffset={EFFECTS_INSPECTOR_DIALOG_SIDE_OFFSET}
    // Anchor the side axis to the inspector surface's left edge so the plain 8px
    // gutter matches Type/Stroke/Export/Color instead of the extra 32px a
    // trigger-relative offset produced from inside the PanelEntry grip (#661).
    anchorSurfaceSelector={COMPOSA_INSPECTOR_SURFACE_SELECTOR}
    elevation={400} blockOutsideDismiss={colorOpen}>
    <div className="flex h-[40px] items-center gap-[4px] border-b border-c-border px-[8px]">
      <div className="mr-auto"><PopoverMenu align="left" trigger={<Dropdown value={value.type} hug />}>
        {close => <Menu>{TYPES.map(type => <MenuRow key={type} type="checkmark" checked={type === value.type} label={type} onClick={() => { onChange?.({ type }); close(); }} />)}</Menu>}
      </PopoverMenu></div>
      <button type="button" aria-label={value.visible ? "Hide effect" : "Show effect"} onClick={() => onChange?.({ visible: !value.visible })}
        className="flex items-center justify-center size-[24px] rounded-c-sm text-c-icon-secondary hover:bg-c-bg-hover">
        {value.visible ? <Eye size={16} strokeWidth={1.5} /> : <EyeOff size={16} strokeWidth={1.5} />}
      </button>
      <button type="button" aria-label="Close" onClick={onClose} className="flex items-center justify-center size-[24px] rounded-c-sm text-c-icon-secondary hover:bg-c-bg-hover"><X size={16} strokeWidth={1.5} /></button>
    </div>
    <div className="flex flex-col gap-[4px] p-[12px]">
      {shadow ? <>
        <PositionRow x={value.x ?? 0} y={value.y ?? 4} onXChange={x => onChange?.({ x })} onYChange={y => onChange?.({ y })} />
        <NumberRow label="Blur" icon={BLUR_LEAD} value={value.blur ?? 8} onChange={blur => onChange?.({ blur })} />
        <NumberRow label="Spread" icon={SPREAD_LEAD} value={value.spread ?? 0} onChange={spread => onChange?.({ spread })} />
        <div className="flex items-center gap-[8px] min-h-[32px]">
          <span className={LABEL}>Color</span>
          <div className="min-w-0 flex-1">
            <ColorDialog
              open={colorOpen}
              onClose={() => setColorOpen(false)}
              sideOffset={COLOR_DIALOG_NESTED_EFFECT_SIDE_OFFSET}
              align="end"
              trigger={<ColorInput ariaLabel="Effect color" fullWidth color={value.color ?? "#000000"} opacity={value.opacity ?? 25}
                onSwatchClick={() => setColorOpen(true)} onColorChange={color => onChange?.({ color })} onOpacityChange={opacity => onChange?.({ opacity })} />}
              solidOnly
              pickerSource="hex"
              capabilities={capabilities}
              hex={(value.color ?? "#000000").replace(/^#/, "")}
              opacity={value.opacity ?? 25}
              onHexChange={hex => onChange?.({ color: `#${hex.replace(/^#/, "")}` })}
              onOpacityChange={opacity => onChange?.({ opacity })}
            />
          </div>
        </div>
        {value.type === "Drop shadow" && <div className="pt-[8px]"><Checkbox checked={value.showBehindTransparent ?? false}
          label="Show behind transparent areas" onChange={showBehindTransparent => onChange?.({ showBehindTransparent })} /></div>}
      </> : <NumberRow label="Blur" icon={BLUR_LEAD} value={value.blur ?? 4} onChange={blur => onChange?.({ blur })} />}
    </div>
  </InspectorDialog>;
}
