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

// ── Storybook linkage ───────────────────────────────────────────────────────
// Mirror Storybook's own id derivation (@storybook/csf `sanitize` + `toId`) so
// the "View in Storybook" link resolves to the right story without guessing.
// Each story is titled `<Category>/<Component>` with a single `Default` export,
// so its id is `sanitize("<Category>/<Component>")--default`.
const sanitize = (s: string) =>
  s
    .toLowerCase()
    // eslint-disable-next-line no-useless-escape
    .replace(/[ '’–—―′¿`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

export const storyTitle = (c: Annotation) => `${c.category}/${c.component}`;
export const storyId = (c: Annotation) => `${sanitize(storyTitle(c))}--default`;

// import.meta.env.BASE_URL is the docs app base ("/react-ui/" in the deployed
// build, "/" in local dev). Storybook is assembled one level down at
// `<base>storybook/`, so this link resolves under the Pages project prefix.
export const storybookHref = (c: Annotation) =>
  `${import.meta.env.BASE_URL}storybook/?path=/story/${storyId(c)}`;

export type Theme = "light" | "dark";

// The story embedded as an iframe — Carbon's StorybookDemo pattern. It points at
// Storybook's headless `iframe.html` (the story alone, no manager chrome) and
// wires the docs page's light/dark toggle to the story's `composaMode` global so
// the embedded demo tracks the surrounding page's theme.
export const storybookIframeHref = (c: Annotation, theme: Theme) =>
  `${import.meta.env.BASE_URL}storybook/iframe.html?id=${storyId(c)}&globals=composaMode:${theme}`;

// ── Hash routing (Pages is static → no BrowserRouter) ────────────────────────
export type Route =
  | { kind: "home" }
  | { kind: "foundations" }
  | { kind: "token-compliance" }
  | { kind: "component"; component: Annotation }
  | { kind: "not-found"; slug: string };

const bySlug = new Map(components.map(c => [slug(c.component), c] as const));

export const componentBySlug = (s: string) => bySlug.get(s);

export const routeForComponent = (c: Annotation) => `#/components/${slug(c.component)}`;

export function parseRoute(hash: string): Route {
  // "#/components/button" → ["components","button"]; "" / "#/" → home.
  const path = hash.replace(/^#/, "").replace(/^\/+/, "").replace(/\/+$/, "");
  if (path === "") return { kind: "home" };
  if (path === "foundations") return { kind: "foundations" };
  if (path === "token-compliance") return { kind: "token-compliance" };
  const m = path.match(/^components\/(.+)$/);
  if (m) {
    const c = bySlug.get(m[1]);
    return c ? { kind: "component", component: c } : { kind: "not-found", slug: m[1] };
  }
  return { kind: "not-found", slug: path };
}

// Resolve a --color-* alias one level so swatches paint a real value.
export const colorVal = (raw: string): string => {
  const m = String(raw).match(/^var\(--color-([\w-]+)\)$/);
  return m && tokens.color[m[1]] ? tokens.color[m[1]].value : raw;
};
