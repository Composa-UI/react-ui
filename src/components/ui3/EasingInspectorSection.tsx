import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { clsx } from "clsx";
import { Copy } from "lucide-react";
import { Dropdown } from "./Dropdown";
import { NumericInput } from "./Input";
import { Menu, MenuRow, PopoverMenu } from "./Menu";
import { PanelActionBtn, PanelFieldRow, PanelFullRow, PanelSection } from "./Panel";
import { SegmentedControl } from "./SegmentedControl";
import {
  EASING_PRESETS,
  EASING_SCOPE_LABELS,
  easingControlPoints,
  easingPresetLabel,
  easingSvgPath,
  type CubicBezier,
  type EasingApplyScope,
  type EasingPreset,
} from "./easing";

const FONT = "font-[family-name:var(--composa-font-family)]";
const SPRING_POINTS = EASING_PRESETS.find(preset => preset.value === "spring")!.controlPoints;

// Compact cubic readout, e.g. [0,0,1,1] -> "0, 0, 1, 1" (matches the export).
function formatCubic(points: CubicBezier): string {
  return points
    .map(value => {
      const rounded = Math.round((value + Number.EPSILON) * 1000) / 1000;
      return Object.is(rounded, -0) ? "0" : String(rounded);
    })
    .join(", ");
}

export interface EasingInspectorValue {
  preset: EasingPreset;
  controlPoints?: CubicBezier;
  editable?: boolean;
  /** Host identity for the selected keyframe/segment; a change cancels an active curve gesture. */
  interactionKey?: string;
}

export interface EasingInspectorSectionProps {
  value: EasingInspectorValue;
  applyScope?: EasingApplyScope;
  onChange?: (value: { preset: EasingPreset; controlPoints?: CubicBezier }) => void;
  onApplyScopeChange?: (scope: EasingApplyScope) => void;
  onCurveEditStart?: () => void;
  onCurveEditCommit?: () => void;
  onCurveEditCancel?: () => void;
}

const clampX = (value: number) => Math.max(0, Math.min(1, value));
const finite = (value: number, fallback: number) => Number.isFinite(value) ? value : fallback;

export function easingPointUpdate(points: CubicBezier, index: number, value: number): CubicBezier {
  const next = [...points] as CubicBezier;
  next[index] = index === 0 || index === 2 ? clampX(finite(value, points[index])) : finite(value, points[index]);
  return next;
}

export function easingPointAtClient(rect: Pick<DOMRect, "left" | "top" | "width" | "height">, clientX: number, clientY: number): [number, number] {
  const viewX = (clientX - rect.left) / Math.max(1, rect.width) * 200;
  const viewY = (clientY - rect.top) / Math.max(1, rect.height) * 112;
  return [clampX((viewX - 12) / 176), (100 - viewY) / 88];
}

export function EasingInspectorSection({
  value,
  applyScope = "segment",
  onChange,
  onApplyScopeChange,
  onCurveEditStart,
  onCurveEditCommit,
  onCurveEditCancel,
}: EasingInspectorSectionProps) {
  const editable = value.editable !== false && !!onChange;
  const points = easingControlPoints(value.preset, value.controlPoints);
  const drag = useRef<{ index: 0 | 1; pointerId: number; start: CubicBezier; startValue: EasingInspectorValue } | null>(null);
  const previewRef = useRef<SVGSVGElement>(null);
  const cancelRef = useRef<() => void>(() => {});
  const changeRef = useRef(onChange);
  const curveCancelRef = useRef(onCurveEditCancel);
  changeRef.current = onChange;
  curveCancelRef.current = onCurveEditCancel;
  const emitPoints = (next: CubicBezier) => onChange?.({ preset: "custom", controlPoints: next });
  const releaseEscape = () => {
    if (typeof document !== "undefined") document.removeEventListener("keydown", cancelRef.current, true);
  };
  const cancel = () => {
    const active = drag.current;
    if (!active) return;
    drag.current = null;
    releaseEscape();
    onChange?.({ preset: active.startValue.preset, controlPoints: active.startValue.controlPoints });
    onCurveEditCancel?.();
  };
  cancelRef.current = (event?: KeyboardEvent) => {
    if (event && (event.key !== "Escape" || event.isComposing || event.keyCode === 229)) return;
    event?.preventDefault();
    event?.stopImmediatePropagation();
    cancel();
  };
  useEffect(() => () => {
    const active = drag.current;
    drag.current = null;
    releaseEscape();
    if (!active) return;
    changeRef.current?.({ preset: active.startValue.preset, controlPoints: active.startValue.controlPoints });
    curveCancelRef.current?.();
  }, []);
  const begin = (index: 0 | 1) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!editable || event.button !== 0 || !event.isPrimary) return;
    event.preventDefault();
    drag.current = { index, pointerId: event.pointerId, start: [...points], startValue: { ...value, controlPoints: value.controlPoints ? [...value.controlPoints] : undefined } };
    onCurveEditStart?.();
    if (typeof document !== "undefined") document.addEventListener("keydown", cancelRef.current, true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const active = drag.current;
    const rect = previewRef.current?.getBoundingClientRect();
    if (!active || !rect || active.pointerId !== event.pointerId) return;
    const [x, y] = easingPointAtClient(rect, event.clientX, event.clientY);
    const next = [...active.start] as CubicBezier;
    if (active.index === 0) { next[0] = x; next[1] = y; }
    else { next[2] = x; next[3] = y; }
    emitPoints(next);
  };
  const finish = () => {
    if (!drag.current) return;
    drag.current = null;
    releaseEscape();
    onCurveEditCommit?.();
  };
  const keyHandle = (index: 0 | 1) => (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!editable || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const step = event.shiftKey ? 0.1 : 0.01;
    const next = [...points] as CubicBezier;
    const xIndex = index === 0 ? 0 : 2, yIndex = index === 0 ? 1 : 3;
    if (event.key === "ArrowLeft") next[xIndex] = clampX(next[xIndex] - step);
    if (event.key === "ArrowRight") next[xIndex] = clampX(next[xIndex] + step);
    if (event.key === "ArrowUp") next[yIndex] += step;
    if (event.key === "ArrowDown") next[yIndex] -= step;
    onCurveEditStart?.();
    emitPoints(next);
    onCurveEditCommit?.();
  };
  const numeric = (index: number) => (next: number) => emitPoints(easingPointUpdate(points, index, next));

  // Curve/Spring tabs (export parity): Spring selects the spring preset; Curve
  // keeps a hand-editable cubic. The preset dropdown still offers every preset.
  const easingType = value.preset === "spring" ? "spring" : "curve";
  const setEasingType = (next: string) => {
    if (!editable || next === easingType) return;
    if (next === "spring") onChange?.({ preset: "spring", controlPoints: [...SPRING_POINTS] });
    else onChange?.({ preset: "custom", controlPoints: points });
  };
  const copyCubic = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(`cubic-bezier(${formatCubic(points)})`);
    }
  };

  return (
    <div data-easing-inspector-preset={value.preset} data-easing-inspector-control-points={JSON.stringify(value.controlPoints ?? null)}>
    <PanelSection title="Easing" landmark>
      <PanelFullRow height={32}>
        <PopoverMenu directTrigger align="right" className="w-full" trigger={
          <Dropdown aria-haspopup="menu" ariaLabel="Easing preset" value={easingPresetLabel(value.preset)} fullWidth disabled={!editable} />
        }>
          {close => <Menu minWidth={190}>
            {EASING_PRESETS.map(preset => <MenuRow key={preset.value} type="checkmark" selectionRole="radio"
              checked={value.preset === preset.value} label={preset.label}
              onClick={() => { onChange?.({ preset: preset.value, controlPoints: [...preset.controlPoints] }); close(); }} />)}
            <MenuRow type="divider" />
            <MenuRow type="checkmark" selectionRole="radio" checked={value.preset === "custom"} label="Custom"
              onClick={() => { onChange?.({ preset: "custom", controlPoints: points }); close(); }} />
          </Menu>}
        </PopoverMenu>
      </PanelFullRow>

      <PanelFullRow height={32}>
        <SegmentedControl
          ariaLabel="Easing type"
          className="w-full"
          value={easingType}
          onChange={setEasingType}
          disabled={!editable}
          segments={[{ value: "curve", label: "Curve" }, { value: "spring", label: "Spring" }]}
        />
      </PanelFullRow>

      <div className={clsx("mx-[16px] my-[8px] h-[112px] rounded-c-md bg-c-bg-secondary ring-1 ring-inset ring-c-border-translucent", !editable && "opacity-60")}
        data-composa-easing-preview>
        <svg ref={previewRef} viewBox="0 0 200 112" className="block size-full overflow-visible" aria-label="Easing curve preview">
          <path d="M12 100 L188 12" fill="none" stroke="var(--color-c-border)" strokeWidth="1" strokeDasharray="3 3" />
          <path d={`M12 100 C${12 + points[0] * 176} ${100 - points[1] * 88} ${12 + points[2] * 176} ${100 - points[3] * 88} 188 12`}
            fill="none" stroke="var(--color-c-border-selected-strong)" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="100" x2={12 + points[0] * 176} y2={100 - points[1] * 88} stroke="var(--color-c-icon-secondary)" strokeWidth="1" />
          <line x1="188" y1="12" x2={12 + points[2] * 176} y2={100 - points[3] * 88} stroke="var(--color-c-icon-secondary)" strokeWidth="1" />
          {value.preset === "custom" && [0, 1].map(index => {
            const x = 12 + points[index === 0 ? 0 : 2] * 176;
            const y = 100 - points[index === 0 ? 1 : 3] * 88;
            return <foreignObject key={index} x={x - 9} y={y - 9} width="18" height="18">
              <button type="button" role="slider" disabled={!editable}
                aria-label={`Easing control point ${index + 1}`}
                aria-valuemin={0}
                aria-valuemax={1}
                aria-valuenow={points[index === 0 ? 0 : 2]}
                aria-valuetext={`X ${points[index === 0 ? 0 : 2].toFixed(2)}, Y ${points[index === 0 ? 1 : 3].toFixed(2)}`}
                aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Shift+ArrowLeft Shift+ArrowRight Shift+ArrowUp Shift+ArrowDown"
                onPointerDown={begin(index as 0 | 1)} onPointerMove={move} onPointerUp={finish} onPointerCancel={cancel} onLostPointerCapture={finish}
                onKeyDown={keyHandle(index as 0 | 1)}
                className="size-[18px] rounded-full border-2 border-c-border-selected-strong bg-c-bg outline-none focus-visible:ring-2 focus-visible:ring-c-focus-ring disabled:cursor-not-allowed" />
            </foreignObject>;
          })}
        </svg>
      </div>

      <PanelFieldRow label="Control points"
        left={<div className="flex gap-[4px]"><NumericInput ariaLabel="Easing X1" value={points[0]} onChange={numeric(0)} min={0} max={1} step={0.01} disabled={!editable} /><NumericInput ariaLabel="Easing Y1" value={points[1]} onChange={numeric(1)} step={0.01} disabled={!editable} /></div>}
        right={<div className="flex gap-[4px]"><NumericInput ariaLabel="Easing X2" value={points[2]} onChange={numeric(2)} min={0} max={1} step={0.01} disabled={!editable} /><NumericInput ariaLabel="Easing Y2" value={points[3]} onChange={numeric(3)} step={0.01} disabled={!editable} /></div>}
        reserveRightSlot={false} />

      {/* Compact cubic-bezier readout with copy (export parity). */}
      <PanelFullRow label="Cubic" height={32} rightAction={
        <PanelActionBtn icon={<Copy size={12} strokeWidth={1.5} />} label="Copy cubic bézier" onClick={copyCubic} disabled={!editable} />
      }>
        <div className="flex h-[24px] items-center rounded-c-md bg-c-bg-secondary px-[8px]">
          <span data-easing-cubic-readout className={clsx(FONT, "truncate text-[11px] leading-[16px] font-[450] tracking-[0.055px] text-c-text")}>
            {formatCubic(points)}
          </span>
        </div>
      </PanelFullRow>

      <PanelFullRow label="Apply to" height={40}>
        <PopoverMenu directTrigger align="right" className="w-full" trigger={
          <Dropdown aria-haspopup="menu" ariaLabel="Apply easing to" value={EASING_SCOPE_LABELS[applyScope]} fullWidth disabled={!onApplyScopeChange || value.editable === false} />
        }>
          {close => <Menu minWidth={210}>{(Object.keys(EASING_SCOPE_LABELS) as EasingApplyScope[]).map(scope =>
            <MenuRow key={scope} type="checkmark" selectionRole="radio" checked={scope === applyScope} label={EASING_SCOPE_LABELS[scope]}
              onClick={() => { onApplyScopeChange?.(scope); close(); }} />)}</Menu>}
        </PopoverMenu>
      </PanelFullRow>
      <span className="sr-only" data-easing-preview-path={easingSvgPath(points)} />
    </PanelSection>
    </div>
  );
}
