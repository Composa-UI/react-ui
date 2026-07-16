export type CubicBezier = [number, number, number, number];
export type EasingPreset =
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "ease-in-strong"
  | "ease-out-strong"
  | "ease-in-out-strong"
  | "spring"
  | "custom";
export type NamedEasingPreset = Exclude<EasingPreset, "custom">;
export type EasingApplyScope = "segment" | "property" | "layer" | "slide";

export interface EasingPresetDefinition {
  value: NamedEasingPreset;
  label: string;
  controlPoints: CubicBezier;
}

export const EASING_PRESETS: readonly EasingPresetDefinition[] = Object.freeze([
  { value: "linear", label: "Linear", controlPoints: [0, 0, 1, 1] },
  { value: "ease-in", label: "Ease in", controlPoints: [0.42, 0, 1, 1] },
  { value: "ease-out", label: "Ease out", controlPoints: [0, 0, 0.58, 1] },
  { value: "ease-in-out", label: "Ease in-out", controlPoints: [0.42, 0, 0.58, 1] },
  { value: "ease-in-strong", label: "Ease in (strong)", controlPoints: [0.7, 0, 1, 1] },
  { value: "ease-out-strong", label: "Ease out (strong)", controlPoints: [0, 0, 0.3, 1] },
  { value: "ease-in-out-strong", label: "Ease in-out (strong)", controlPoints: [0.7, 0, 0.3, 1] },
  { value: "spring", label: "Spring", controlPoints: [0.175, 0.885, 0.32, 1.275] },
]);

export const EASING_SCOPE_LABELS: Record<EasingApplyScope, string> = {
  segment: "This segment",
  property: "All segments on this property",
  layer: "All segments on this layer",
  slide: "All segments on this slide",
};

export const easingPresetLabel = (preset: EasingPreset) =>
  preset === "custom" ? "Custom" : EASING_PRESETS.find(item => item.value === preset)?.label ?? "Linear";

export const easingControlPoints = (preset: EasingPreset, custom?: CubicBezier): CubicBezier =>
  preset === "custom"
    ? [...(custom ?? [0.25, 0.1, 0.25, 1])]
    : [...(EASING_PRESETS.find(item => item.value === preset)?.controlPoints ?? [0, 0, 1, 1])];

export function easingSvgPath(points: CubicBezier, width = 28, height = 10, padding = 1): string {
  const [x1, y1, x2, y2] = points;
  const x = (value: number) => padding + value * (width - padding * 2);
  const y = (value: number) => height - padding - value * (height - padding * 2);
  return `M${x(0)} ${y(0)} C${x(x1)} ${y(y1)} ${x(x2)} ${y(y2)} ${x(1)} ${y(1)}`;
}
