// Loads the docs data sources at build time: the token file (foundations) and
// every annotation (annotations/*.json, the same contract-v1 files the
// enforcement test checks). Mirrors the ordering the old static generator used.
import tokensFile from "../../tokens/composa.tokens.json";

export type Annotation = {
  component: string;
  category: string;
  intent: string;
  use_when?: string[];
  dont_use_when?: string[];
  variants?: Record<string, unknown>;
  slots?: Record<string, string>;
  states?: string[];
  tokens?: Record<string, unknown> & { note?: string };
  a11y?: Record<string, unknown>;
  enforce?: { role?: string; ariaRole?: boolean; tokensOnly?: boolean };
  code: { import: string; example: string };
};

export type TokenEntry = { value: string; dark?: string };
export type Tokens = {
  color: Record<string, TokenEntry>;
  radius: Record<string, TokenEntry>;
  spacer: Record<string, TokenEntry>;
  [k: string]: Record<string, TokenEntry>;
};

export const tokens = (tokensFile as { tokens: Tokens }).tokens;

// Sidebar groups, in order. Each component's `category` is exactly one of these.
export const GROUP_ORDER = [
  "Actions", "Inputs", "Navigation", "Menus", "Overlays",
  "Lists", "Panels", "Toolbars", "Templates",
] as const;

// Within-group order (falls back to alphabetical for anything unlisted).
const order = [
  "Button", "SplitButton", "Dropdown", "InputField", "NumericInput", "Checkbox",
  "RadioButton", "Switch", "SegmentedControl", "AlignmentControl", "Slider", "Dial",
  "ColorInput", "ColorWheel", "NavRail", "Tabs", "Menu", "MenuRow", "Modal", "Tooltip",
  "Notification", "ListCell", "LayerList", "Inspector", "PanelSection", "SidePanel",
  "InspectorRailSwitcher", "CreationToolbar", "CropToolbar", "EditorShell",
];

const modules = import.meta.glob<{ default: Annotation }>("../../annotations/*.json", {
  eager: true,
});

const gi = (c: Annotation) => {
  const i = (GROUP_ORDER as readonly string[]).indexOf(c.category);
  return i < 0 ? 99 : i;
};
const oi = (c: Annotation) => {
  const i = order.indexOf(c.component);
  return i < 0 ? 99 : i;
};

export const components: Annotation[] = Object.entries(modules)
  .filter(([path]) => !path.endsWith("annotation.schema.json"))
  .map(([, mod]) => mod.default)
  .sort((a, b) => gi(a) - gi(b) || oi(a) - oi(b) || a.component.localeCompare(b.component));

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

// Resolve a --color-* alias one level so swatches paint a real value.
export const colorVal = (raw: string): string => {
  const m = String(raw).match(/^var\(--color-([\w-]+)\)$/);
  return m && tokens.color[m[1]] ? tokens.color[m[1]].value : raw;
};
