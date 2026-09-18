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
const PLOT = { width: 200, height: 160, left: 16, right: 184, top: 16, bottom: 144, minY: -0.25, maxY: 1.25 } as const;
const plotX = (value: number) => PLOT.left + value * (PLOT.right - PLOT.left);
const plotY = (value: number) => PLOT.bottom - (value - PLOT.minY) / (PLOT.maxY - PLOT.minY) * (PLOT.bottom - PLOT.top);

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
  /** Presentation label for a host-owned single target such as an Animate card.
   *  This does not add a new engine scope; without an apply callback the row is
   *  a truthful, disabled description of what the editor will update. */
  applyToLabel?: string;
  onChange?: (value: { preset: EasingPreset; controlPoints?: CubicBezier }) => void;
  onApplyScopeChange?: (scope: EasingApplyScope) => void;
  onCurveEditStart?: () => void;
  onCurveEditCommit?: () => void;
  onCurveEditCancel?: () => void;
}

const clampX = (value: number) => Math.max(0, Math.min(1, value));
const finite = (value: number, fallback: number) => Number.isFinite(value) ? value : fallback;
const snapUnit = (value: number) => Math.abs(value) < 1e-12 ? 0 : Math.abs(value - 1) < 1e-12 ? 1 : value;

export function easingPointUpdate(points: CubicBezier, index: number, value: number): CubicBezier {
  const next = [...points] as CubicBezier;
  next[index] = index === 0 || index === 2 ? clampX(finite(value, points[index])) : finite(value, points[index]);
  return next;
}

export function easingPointAtClient(rect: Pick<DOMRect, "left" | "top" | "width" | "height">, clientX: number, clientY: number): [number, number] {
  const viewX = (clientX - rect.left) / Math.max(1, rect.width) * PLOT.width;
  const viewY = (clientY - rect.top) / Math.max(1, rect.height) * PLOT.height;
  const y = PLOT.minY + (PLOT.bottom - viewY) / (PLOT.bottom - PLOT.top) * (PLOT.maxY - PLOT.minY);
  return [snapUnit(clampX((viewX - PLOT.left) / (PLOT.right - PLOT.left))), snapUnit(y)];
}

export function EasingInspectorSection({
  value,
  applyScope = "segment",
  applyToLabel,
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
  const convertHoldToCurve = () => {
    if (editable && value.preset === "hold") onChange?.({ preset: "custom", controlPoints: [0, 0, 1, 1] });
  };
  const curvePath = value.preset === "hold"
    ? `M${plotX(0)} ${plotY(0)} L${plotX(1)} ${plotY(0)} L${plotX(1)} ${plotY(1)}`
    : `M${plotX(0)} ${plotY(0)} C${plotX(points[0])} ${plotY(points[1])} ${plotX(points[2])} ${plotY(points[3])} ${plotX(1)} ${plotY(1)}`;

  return (
    <div data-easing-inspector-preset={value.preset} data-easing-inspector-control-points={JSON.stringify(value.controlPoints ?? null)}>
    <PanelSection title="Easing" landmark>
      <PanelFullRow height={32}>
        <PopoverMenu directTrigger align="right" className="w-full" trigger={
          <Dropdown aria-haspopup="menu" ariaLabel="Easing preset" value={easingPresetLabel(value.preset)} fullWidth disabled={!editable} />
        }>
          {close => <Menu>
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

      <div className={clsx("group relative mx-[16px] my-[8px] h-[160px] rounded-c-md bg-c-bg-secondary ring-1 ring-inset ring-c-border-translucent", !editable && "opacity-60")}
        data-composa-easing-preview>
        <svg ref={previewRef} viewBox={`0 0 ${PLOT.width} ${PLOT.height}`} className="block size-full overflow-hidden" aria-label="Easing curve preview">
          {value.preset !== "hold" && <path d={`M${plotX(0)} ${plotY(0)} L${plotX(1)} ${plotY(1)}`} fill="none" stroke="var(--color-c-border)" strokeWidth="1" strokeDasharray="3 3" />}
          <path d={curvePath} fill="none" stroke="var(--color-c-text)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          {value.preset === "custom" && <>
            <line x1={plotX(0)} y1={plotY(0)} x2={plotX(points[0])} y2={plotY(points[1])} stroke="var(--color-c-border-selected-strong)" strokeWidth="1.5" />
            <line x1={plotX(1)} y1={plotY(1)} x2={plotX(points[2])} y2={plotY(points[3])} stroke="var(--color-c-border-selected-strong)" strokeWidth="1.5" />
          </>}
          {value.preset === "custom" && [0, 1].map(index => {
            const x = plotX(points[index === 0 ? 0 : 2]);
            const y = plotY(points[index === 0 ? 1 : 3]);
            return <foreignObject key={index} x={x - 6} y={y - 6} width="12" height="12">
              <button type="button" role="slider" disabled={!editable}
                aria-label={`Easing control point ${index + 1}`}
                aria-valuemin={0}
                aria-valuemax={1}
                aria-valuenow={points[index === 0 ? 0 : 2]}
                aria-valuetext={`X ${points[index === 0 ? 0 : 2].toFixed(2)}, Y ${points[index === 0 ? 1 : 3].toFixed(2)}`}
                aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Shift+ArrowLeft Shift+ArrowRight Shift+ArrowUp Shift+ArrowDown"
                onPointerDown={begin(index as 0 | 1)} onPointerMove={move} onPointerUp={finish} onPointerCancel={cancel} onLostPointerCapture={finish}
                onKeyDown={keyHandle(index as 0 | 1)}
                className="size-[12px] rounded-full border-2 border-c-border-selected-strong bg-c-bg outline-none focus-visible:ring-2 focus-visible:ring-c-focus-ring disabled:cursor-not-allowed" />
            </foreignObject>;
          })}
        </svg>
        {value.preset === "hold" && editable && <button type="button" aria-label="Change Hold easing to custom curve" onClick={convertHoldToCurve}
          className={clsx(FONT, "absolute inset-0 flex flex-col items-center justify-center bg-c-bg-secondary/80 text-[11px] leading-[16px] text-c-text opacity-0 outline-none transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-c-focus-ring")}>
          <strong className="font-[550]">Hold easing</strong><span>Click to change to curve</span>
        </button>}
      </div>

      <PanelFieldRow label="Control points"
        left={<div className="flex gap-[4px]"><NumericInput ariaLabel="Easing X1" value={points[0]} onChange={numeric(0)} min={0} max={1} step={0.01} disabled={!editable} /><NumericInput ariaLabel="Easing Y1" value={points[1]} onChange={numeric(1)} step={0.01} disabled={!editable} /></div>}
        right={<div className="flex gap-[4px]"><NumericInput ariaLabel="Easing X2" value={points[2]} onChange={numeric(2)} min={0} max={1} step={0.01} disabled={!editable} /><NumericInput ariaLabel="Easing Y2" value={points[3]} onChange={numeric(3)} step={0.01} disabled={!editable} /></div>}
        rightAction={<PanelActionBtn icon={<Copy size={12} strokeWidth={1.5} />} label="Copy control points" onClick={copyCubic} disabled={!editable} />} />

      <PanelFullRow label="Apply to" height={40}>
        <PopoverMenu directTrigger align="right" className="w-full" trigger={
          <Dropdown aria-haspopup="menu" ariaLabel="Apply easing to" value={applyToLabel ?? EASING_SCOPE_LABELS[applyScope]} fullWidth disabled={!onApplyScopeChange || value.editable === false} />
        }>
          {close => <Menu>{(Object.keys(EASING_SCOPE_LABELS) as EasingApplyScope[]).map(scope =>
            <MenuRow key={scope} type="checkmark" selectionRole="radio" checked={scope === applyScope} label={EASING_SCOPE_LABELS[scope]}
              onClick={() => { onApplyScopeChange?.(scope); close(); }} />)}</Menu>}
        </PopoverMenu>
      </PanelFullRow>
      <span className="sr-only" data-easing-preview-path={easingSvgPath(points)} />
    </PanelSection>
    </div>
  );
}
