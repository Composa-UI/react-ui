import { GOOGLE_FONTS_CATALOG } from "./googleFontsCatalog";
import type { FontEntry } from "./FontPickerDialog";

/**
 * The full Google Fonts suite as picker entries. The family list is bundled
 * statically (see `googleFontsCatalog.ts`) — the metadata endpoint is
 * CORS-blocked in-browser and the Developer API needs a key — while the actual
 * webfont files load lazily via the css2 stylesheet (see
 * {@link ensureGoogleFontLoaded}). Each row previews in its own face once its
 * stylesheet has loaded, and falls back to the generic family until then.
 */
let entriesCache: FontEntry[] | null = null;
export function googleFontEntries(): FontEntry[] {
  if (!entriesCache) {
    entriesCache = GOOGLE_FONTS_CATALOG.map(([name, generic]) => ({
      name,
      stack: `'${name}', ${generic}`,
      source: "google" as const,
    }));
  }
  return entriesCache;
}

/** css2 stylesheet endpoint — reachable cross-origin and CSP-safe. */
const CSS2_BASE = "https://fonts.googleapis.com/css2";

// Session-level dedupe so a family's stylesheet is injected at most once even
// across dialog opens / component instances.
const loaded = new Set<string>();

/**
 * Inject a Google Fonts css2 stylesheet for `name` so the family renders in its
 * own face (in the picker preview and on the canvas, which applies the raw
 * family name as CSS `font-family`). Idempotent, side-effect-guarded for
 * non-DOM/test environments, and non-throwing: a failed load (offline) simply
 * leaves the row on its generic fallback.
 */
export function ensureGoogleFontLoaded(name: string): void {
  const trimmed = name.trim();
  if (!trimmed || loaded.has(trimmed)) return;
  loaded.add(trimmed);
  if (typeof document === "undefined") return;
  const escaped = typeof CSS !== "undefined" && typeof CSS.escape === "function" ? CSS.escape(trimmed) : null;
  if (escaped !== null) {
    try {
      if (document.querySelector(`link[data-composa-google-font="${escaped}"]`)) return;
    } catch {
      // Bad selector — fall through to append (the module Set still dedupes).
    }
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.dataset.composaGoogleFont = trimmed;
  link.href = `${CSS2_BASE}?family=${encodeURIComponent(trimmed).replace(/%20/g, "+")}:wght@400;500;700&display=swap`;
  document.head.appendChild(link);
}
