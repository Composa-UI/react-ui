import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { clsx } from "clsx";
import { Check, MonitorSmartphone, Search, X } from "lucide-react";
import { Button } from "./Button";
import { ScrollArea } from "./Panel";
import {
  COMPACT_INSPECTOR_DIALOG_WIDTH,
  COMPOSA_INSPECTOR_SURFACE_SELECTOR,
  InspectorDialog,
  TYPE_SETTINGS_INSPECTOR_SIDE_OFFSET,
} from "./InspectorDialog";
import { ensureGoogleFontLoaded, googleFontEntries } from "./googleFonts";

const FONT = "font-[family-name:var(--composa-font-family)]";

/** Rows rendered at once. The full merged roster (Google Fonts + local +
 * bundled) is ~2k entries; the list caps the DOM and nudges the user to search
 * to reach the rest. Search filters across the entire roster, not just this slice. */
const MAX_VISIBLE_ROWS = 60;

/* ─── Value contract ─────────────────────────────────────────────────────── */

export interface FontEntry {
  /** Display name and selection key. */
  name: string;
  /** CSS font-family stack used to render this row's own preview. */
  stack: string;
  /** Provenance — drives lazy webfont loading (only "google" needs a stylesheet). */
  source?: "bundled" | "google" | "local";
}

/**
 * Bundled/web-safe roster the picker falls back to when the host provides none.
 * Every entry previews truthfully in-face without a web-font fetch (system
 * families) and applies as a valid CSS `font-family` on the canvas, so a driven
 * selection is honest end-to-end. The first three mirror the app's own brand
 * roster; the rest are web-safe families present on virtually every device.
 */
export const BUNDLED_FONTS: ReadonlyArray<FontEntry> = [
  { name: "Inter", stack: "'Inter', system-ui, sans-serif", source: "bundled" },
  { name: "Whyte", stack: "'Whyte', 'Inter', system-ui, sans-serif", source: "bundled" },
  { name: "Roboto Mono", stack: "'Roboto Mono', ui-monospace, monospace", source: "bundled" },
  { name: "Arial", stack: "Arial, Helvetica, sans-serif", source: "bundled" },
  { name: "Helvetica", stack: "Helvetica, Arial, sans-serif", source: "bundled" },
  { name: "Verdana", stack: "Verdana, Geneva, sans-serif", source: "bundled" },
  { name: "Tahoma", stack: "Tahoma, Geneva, sans-serif", source: "bundled" },
  { name: "Trebuchet MS", stack: "'Trebuchet MS', Tahoma, sans-serif", source: "bundled" },
  { name: "Georgia", stack: "Georgia, 'Times New Roman', serif", source: "bundled" },
  { name: "Times New Roman", stack: "'Times New Roman', Times, serif", source: "bundled" },
  { name: "Garamond", stack: "Garamond, 'Times New Roman', serif", source: "bundled" },
  { name: "Palatino", stack: "'Palatino Linotype', 'Book Antiqua', Palatino, serif", source: "bundled" },
  { name: "Courier New", stack: "'Courier New', Courier, monospace", source: "bundled" },
];

/** Shape of a `FontData` record from the Local Font Access API. */
interface LocalFontData {
  family: string;
  fullName?: string;
  postscriptName?: string;
  style?: string;
}

/** True when the running browser exposes the Local Font Access API. */
export function installedFontsSupported(): boolean {
  return typeof window !== "undefined"
    && typeof (window as unknown as { queryLocalFonts?: unknown }).queryLocalFonts === "function";
}

/**
 * Default installed-fonts loader: calls `window.queryLocalFonts()` behind a
 * feature check and folds the (per-face) result down to one entry per family.
 * Returns an empty roster for an unsupported browser so the caller degrades to
 * the bundled list. A thrown permission error propagates so the dialog can show
 * an honest "denied" state.
 */
export async function defaultQueryInstalledFonts(): Promise<FontEntry[]> {
  const query = (window as unknown as { queryLocalFonts?: () => Promise<LocalFontData[]> }).queryLocalFonts;
  if (typeof query !== "function") return [];
  const data = await query();
  const seen = new Set<string>();
  const entries: FontEntry[] = [];
  for (const face of data) {
    const name = face.family?.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    entries.push({ name, stack: `'${name}', sans-serif`, source: "local" });
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

export interface FontPickerDialogProps {
  open: boolean;
  onClose: () => void;
  /** The Font control that anchors and re-receives focus on dismissal. */
  trigger: ReactElement;
  /**
   * Capability-truthful bundled/web font roster (host-provided). Each row
   * previews in its own face. Defaults to {@link BUNDLED_FONTS} so the dialog is
   * self-sufficient when the host has no roster of its own.
   */
  fonts?: ReadonlyArray<FontEntry>;
  /**
   * The full Google Fonts suite, merged into the searchable list after the
   * bundled roster. Defaults to the bundled Google catalog ({@link googleFontEntries}).
   */
  googleFonts?: ReadonlyArray<FontEntry>;
  /** Whether to include the Google Fonts suite at all. Default true. */
  enableGoogleFonts?: boolean;
  /**
   * Loader that ensures a font's webfont stylesheet is present so it renders in
   * its own face (preview + canvas). Defaults to {@link ensureGoogleFontLoaded}
   * (Google css2). Only invoked for entries with `source === "google"`.
   */
  loadFont?: (name: string) => void;
  /** Currently applied font name (rendered with a selected check + highlight). */
  value?: string;
  /** Fires with the chosen font name. The owner applies it and closes. */
  onSelect: (name: string) => void;
  /**
   * Whether to offer the installed/local-fonts affordance at all. Default true.
   * When the browser lacks the Local Font Access API the affordance degrades to
   * an honest unavailable note regardless of this flag.
   */
  enableInstalledFonts?: boolean;
  /**
   * Override for the installed-fonts loader. Defaults to
   * {@link defaultQueryInstalledFonts} (real `queryLocalFonts`). Tests/hosts can
   * inject a resolver to exercise the granted/denied paths deterministically.
   */
  queryInstalledFonts?: () => Promise<FontEntry[]>;
  /**
   * Override for the feature check. Defaults to {@link installedFontsSupported}.
   * Lets tests/stories force the unsupported (graceful-fallback) branch.
   */
  installedSupported?: boolean;
}

type AccessState = "idle" | "loading" | "granted" | "denied";

/* ─── Installed-fonts access explainer ───────────────────────────────────── */

/**
 * Explainer step mirroring the owner's shared "Need to use the desktop app or
 * installed fonts?" dialog (Figma Editor-Study `306-4`). Reflows the reference's
 * side-by-side icon/body into the compact 240px anchored surface. Continue
 * requests the browser's local-font permission via the injected loader.
 */
function installedFontsAccessScreen({
  onBack,
  onContinue,
  loading,
}: {
  onBack: () => void;
  onContinue: () => void;
  loading: boolean;
}): ReactElement[] {
  return [
      /* Header — title + close (first child, doubles as the drag handle) */
      <div key="header" className="flex min-h-[40px] shrink-0 items-start gap-[4px] border-b border-c-border pl-[16px] pr-[8px] pt-[12px]">
        <span className={clsx(FONT, "min-w-0 flex-1 text-[11px] font-[550] leading-[16px] text-c-text")}>
          Need to use the desktop app or installed fonts?
        </span>
        <button
          type="button"
          aria-label="Dismiss installed fonts"
          onClick={onBack}
          className="flex size-[24px] shrink-0 items-center justify-center rounded-c-md text-c-icon-secondary hover:bg-c-bg-hover"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      /* Body — icon + explanation */,
      <div key="body" className="flex items-start gap-[12px] px-[16px] py-[16px]">
        <span className="flex size-[40px] shrink-0 items-center justify-center rounded-c-md bg-c-bg-secondary text-c-icon-secondary">
          <MonitorSmartphone size={20} strokeWidth={1.5} />
        </span>
        <p className={clsx(FONT, "min-w-0 flex-1 text-[11px] font-[450] leading-[16px] tracking-[0.055px] text-c-text-secondary")}>
          Composa can list the fonts installed on your device. Continue to let your browser share your installed font
          list. Your fonts never leave your device.
        </p>
      </div>

      /* Footer — Learn more + Continue */,
      <div key="footer" className="flex h-[40px] shrink-0 items-center gap-[8px] border-t border-c-border pl-[16px] pr-[8px]">
        <a
          href="https://developer.mozilla.org/en-US/docs/Web/API/Window/queryLocalFonts"
          target="_blank"
          rel="noreferrer noopener"
          className={clsx(FONT, "text-[11px] font-[450] leading-[16px] text-c-text-brand hover:underline")}
        >
          Learn more
        </a>
        <span className="flex-1" />
        <Button
          variant="Primary"
          label={loading ? "Requesting…" : "Continue"}
          disabled={loading}
          onClick={onContinue}
        />
      </div>,
  ];
}

/* ─── Dialog ─────────────────────────────────────────────────────────────── */

/**
 * Anchored, non-modal font picker. Hosted on the shared `InspectorDialog` /
 * `AnchoredInspectorOverlay` contract (240px, elevation-400, portalled +
 * collision-safe) the Type/Stroke/Animation-styles dialogs use.
 *
 * Each row previews in its own typeface — the meaningful, in-surface preview.
 * The side axis anchors to the inspector surface's LEFT edge
 * (`anchorSurfaceSelector`) so it clears the inspector at ANY panel width
 * (#499/#73).
 *
 * The optional installed-fonts step swaps the surface to an explainer (mirroring
 * the owner's Figma `306-4` dialog) whose Continue requests local-font access
 * via `queryLocalFonts()`. It degrades gracefully — unsupported browsers show an
 * honest note, denied permission keeps the bundled list — and never throws.
 */
export function FontPickerDialog({
  open,
  onClose,
  trigger,
  fonts = BUNDLED_FONTS,
  googleFonts,
  enableGoogleFonts = true,
  loadFont = ensureGoogleFontLoaded,
  value,
  onSelect,
  enableInstalledFonts = true,
  queryInstalledFonts = defaultQueryInstalledFonts,
  installedSupported,
}: FontPickerDialogProps) {
  const [query, setQuery] = useState("");
  const [screen, setScreen] = useState<"list" | "access">("list");
  const [installed, setInstalled] = useState<ReadonlyArray<FontEntry>>([]);
  const [accessState, setAccessState] = useState<AccessState>("idle");

  const supported = installedSupported ?? installedFontsSupported();
  const googleRoster = useMemo(
    () => (enableGoogleFonts ? (googleFonts ?? googleFontEntries()) : []),
    [enableGoogleFonts, googleFonts],
  );

  // Reopen clean: drop the transient search + screen each time the dialog closes
  // so neither a stale query nor a half-open explainer survives to the next open.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setScreen("list");
    }
  }, [open]);

  // The searchable roster = bundled (brand + web-safe) + any granted
  // installed/local fonts + the full Google Fonts suite, earlier sources winning
  // on name collisions. Installed fonts sit near the top (not buried under ~2k
  // Google families); search filters across the ENTIRE roster.
  const filtered = useMemo(() => {
    const seen = new Set<string>();
    const merged: FontEntry[] = [];
    for (const font of [...fonts, ...installed, ...googleRoster]) {
      if (seen.has(font.name)) continue;
      seen.add(font.name);
      merged.push(font);
    }
    const q = query.trim().toLowerCase();
    return q ? merged.filter(font => font.name.toLowerCase().includes(q)) : merged;
  }, [fonts, googleRoster, installed, query]);

  // Only a capped slice renders (the roster is ~2k entries); search reaches the rest.
  const visible = filtered.slice(0, MAX_VISIBLE_ROWS);
  const hiddenCount = filtered.length - visible.length;

  // Lazily load webfont stylesheets for the Google entries currently on screen so
  // their previews render in-face. Deduped by the loader; never throws.
  useEffect(() => {
    if (!open || screen !== "list") return;
    for (const font of visible) if (font.source === "google") loadFont(font.name);
    // visible is derived from filtered; key the effect on its identity + query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, screen, query, filtered, loadFont]);

  const requestInstalledFonts = useCallback(async () => {
    setAccessState("loading");
    try {
      const next = await queryInstalledFonts();
      setInstalled(next);
      setAccessState(next.length > 0 ? "granted" : "denied");
    } catch {
      // Permission denied or the API threw — keep the bundled list, stay honest.
      setInstalled([]);
      setAccessState("denied");
    } finally {
      setScreen("list");
    }
  }, [queryInstalledFonts]);

  return (
    <InspectorDialog
      open={open}
      onClose={onClose}
      trigger={trigger}
      ariaLabel="Fonts"
      width={COMPACT_INSPECTOR_DIALOG_WIDTH}
      sideOffset={TYPE_SETTINGS_INSPECTOR_SIDE_OFFSET}
      anchorSurfaceSelector={COMPOSA_INSPECTOR_SURFACE_SELECTOR}
      elevation={400}
    >
      {screen === "access" ? installedFontsAccessScreen({
        onBack: () => setScreen("list"),
        onContinue: requestInstalledFonts,
        loading: accessState === "loading",
      }) : [
          /* Header — title + close. First child so it doubles as the drag handle. */
          <div key="header" className="flex h-[40px] shrink-0 items-center gap-[4px] border-b border-c-border pl-[16px] pr-[8px]">
            <span className={clsx(FONT, "min-w-0 flex-1 truncate text-[11px] font-[550] leading-[16px] text-c-text")}>Fonts</span>
            <button
              type="button"
              aria-label="Close fonts"
              onClick={onClose}
              className="flex size-[24px] shrink-0 items-center justify-center rounded-c-md text-c-icon-secondary hover:bg-c-bg-hover"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>

          /* Search */,
          <div key="search" className="flex h-[40px] shrink-0 items-center gap-[8px] border-b border-c-border pl-[12px] pr-[8px]">
            <Search size={16} strokeWidth={1.5} className="shrink-0 text-c-icon-secondary" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search fonts"
              aria-label="Search fonts"
              className={clsx(
                FONT,
                "min-w-0 flex-1 bg-transparent text-[11px] leading-[16px] tracking-[0.055px] text-c-text outline-none placeholder:text-c-text-secondary",
              )}
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="flex size-[20px] shrink-0 items-center justify-center rounded-c-sm text-c-icon-secondary hover:bg-c-bg-hover"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            )}
          </div>

          /* Font list */,
          <ScrollArea key="list" className="max-h-[316px]">
            <div className="py-[8px]">
              {visible.length === 0 ? (
                <div className={clsx(FONT, "flex h-[48px] items-center justify-center text-[11px] font-[500] tracking-[0.055px] text-c-text-secondary")}>
                  No fonts found
                </div>
              ) : (
                visible.map(font => {
                  const selected = font.name === value;
                  return (
                    <button
                      key={font.name}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => { if (font.source === "google") loadFont(font.name); onSelect(font.name); }}
                      className={clsx(
                        "flex h-[32px] w-full items-center gap-[8px] pl-[8px] pr-[16px] text-left hover:bg-c-bg-hover",
                        selected && "bg-c-bg-secondary",
                      )}
                    >
                      <span className="flex w-[16px] shrink-0 items-center justify-center text-c-icon-secondary">
                        {selected && <Check size={14} strokeWidth={1.5} />}
                      </span>
                      <span
                        style={{ fontFamily: font.stack }}
                        className="min-w-0 flex-1 truncate text-[13px] leading-[20px] text-c-text"
                      >
                        {font.name}
                      </span>
                    </button>
                  );
                })
              )}
              {hiddenCount > 0 && (
                <div className={clsx(FONT, "px-[16px] pt-[6px] pb-[2px] text-[10px] font-[450] leading-[14px] text-c-text-secondary")}>
                  {`Showing ${visible.length} of ${filtered.length} — search to narrow`}
                </div>
              )}
            </div>
          </ScrollArea>,

          /* Installed-fonts affordance — honest across every capability state */
          enableInstalledFonts ? (
            <div key="installed" className="flex min-h-[36px] shrink-0 items-center border-t border-c-border pl-[8px] pr-[12px] py-[4px]">
              {!supported ? (
                <span className={clsx(FONT, "px-[8px] text-[10px] font-[450] leading-[14px] text-c-text-secondary")}>
                  Installed fonts need a supported browser
                </span>
              ) : accessState === "granted" ? (
                <span className={clsx(FONT, "px-[8px] text-[10px] font-[450] leading-[14px] text-c-text-secondary")}>
                  {`${installed.length} installed ${installed.length === 1 ? "font" : "fonts"} added`}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setScreen("access")}
                  className={clsx(
                    FONT,
                    "flex h-[28px] w-full items-center gap-[8px] rounded-c-md px-[8px] text-left text-[11px] font-[450] leading-[16px] text-c-text hover:bg-c-bg-hover",
                  )}
                >
                  <MonitorSmartphone size={16} strokeWidth={1.5} className="shrink-0 text-c-icon-secondary" />
                  <span className="min-w-0 flex-1 truncate">
                    {accessState === "denied" ? "Couldn't access installed fonts — try again" : "Use installed fonts"}
                  </span>
                </button>
              )}
            </div>
          ) : null,
      ]}
    </InspectorDialog>
  );
}

export default FontPickerDialog;
