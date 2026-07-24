import { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import { Search, X, ChevronDown, Check } from "lucide-react";
import { ScrollArea } from "./Panel";

// ─── Animation Styles picker ────────────────────────────────────────────────────
// The searchable, categorized style picker that opens from an object-animation
// row's Style control (Build In / Action / Build Out). Matches Samuel's
// "Animation styles" dialog (Reusable Typography Dialogs → AnimationStylesDialog):
// 216px card, title + close, search, a category filter, and a grouped list —
// rebuilt on our design-system tokens (his Figma-Make export used raw shadcn +
// inline styles). Designed to live inside a `PopoverMenu` (anchored to the Style
// trigger), so it provides its own surface (card + border + shadow).
//
// Data-driven: it renders whatever `groups` it is given, so the same component
// serves all three phases. It currently shows the styles the engine supports;
// per-style icons and the expanded Action roster (Move/Opacity/Rotate/Scale …)
// activate once the effect engine supports them — see Composa #303 / #300 / #306.

const FONT = "font-[family-name:var(--composa-font-family)]";

export interface AnimationStyleOption {
  value: string;
  label: string;
}

export interface AnimationStyleGroup {
  label: string;
  options: AnimationStyleOption[];
}

// ── Category filter — lightweight inline dropdown (mirrors the Figma design's
// CategoryDropdown). Kept as a plain popover (not a nested Radix menu) so it
// never fights the outer PopoverMenu this picker lives in.
function CategoryFilter({ value, categories, onChange }: { value: string; categories: string[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handle = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Filter by category"
        onClick={() => setOpen(value => !value)}
        className={clsx(FONT, "h-[24px] w-[96px] flex items-center pl-[9px] pr-[1px] rounded-c-sm border border-c-border bg-c-bg hover:bg-c-bg-hover")}
      >
        <span className="flex-1 min-w-0 text-left text-[11px] font-[500] leading-[16px] tracking-[0.055px] text-c-text truncate">{value}</span>
        <ChevronDown size={16} strokeWidth={1.5} className="shrink-0 text-c-icon-secondary" />
      </button>
      {open && (
        <div className="absolute left-0 top-[26px] z-20 min-w-full flex flex-col py-[2px] rounded-c-sm border border-c-border bg-c-bg shadow-c-500">
          {categories.map(category => (
            <button
              key={category}
              type="button"
              onClick={() => { onChange(category); setOpen(false); }}
              className={clsx(FONT, "h-[24px] flex items-center pl-[9px] pr-[12px] text-left text-[11px] font-[500] tracking-[0.055px] hover:bg-c-bg-hover",
                category === value ? "text-c-text" : "text-c-text-secondary")}
            >
              {category}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AnimationStylesPicker({
  title = "Animation styles",
  groups,
  value,
  onSelect,
  onClose,
}: {
  title?: string;
  groups: AnimationStyleGroup[];
  value?: string;
  onSelect: (value: string) => void;
  onClose?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(() => ["All", ...groups.map(group => group.label)], [groups]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups
      .filter(group => category === "All" || group.label === category)
      .map(group => ({ ...group, options: group.options.filter(option => option.label.toLowerCase().includes(q)) }))
      .filter(group => group.options.length > 0);
  }, [groups, query, category]);

  return (
    <div className={clsx(FONT, "w-[216px] flex flex-col bg-c-bg rounded-c-lg shadow-c-500 border border-c-border overflow-hidden select-none")}>
      {/* Header — title + close */}
      <div className="flex items-center h-[40px] shrink-0 pl-[16px] pr-[8px] gap-[4px] border-b border-c-border">
        <span className="flex-1 min-w-0 text-[11px] font-[600] leading-[16px] tracking-[0.055px] text-c-text truncate">{title}</span>
        {onClose && (
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="shrink-0 flex items-center justify-center size-[24px] rounded-c-sm text-c-icon-secondary hover:bg-c-bg-hover"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center h-[40px] shrink-0 pl-[12px] pr-[8px] gap-[8px] border-b border-c-border">
        <Search size={16} strokeWidth={1.5} className="shrink-0 text-c-icon-secondary" />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search"
          aria-label="Search animation styles"
          className={clsx(FONT, "flex-1 min-w-0 bg-transparent outline-none text-[11px] leading-[16px] tracking-[0.055px] text-c-text placeholder:text-c-text-secondary")}
        />
      </div>

      {/* Category filter (only meaningful with >1 category) */}
      {groups.length > 1 && (
        <div className="flex items-center h-[48px] shrink-0 pl-[16px] pr-[8px]">
          <CategoryFilter value={category} categories={categories} onChange={setCategory} />
        </div>
      )}

      {/* Grouped list */}
      <ScrollArea className="max-h-[300px]">
        <div className="py-[8px]">
          {filtered.length === 0 ? (
            <div className={clsx(FONT, "flex items-center justify-center h-[48px] text-[11px] font-[500] tracking-[0.055px] text-c-text-secondary")}>No results</div>
          ) : (
            filtered.map(group => (
              <div key={group.label} className="flex flex-col">
                <div className="h-[32px] flex items-center px-[16px] text-[11px] font-[600] leading-[16px] tracking-[0.055px] text-c-text">{group.label}</div>
                {group.options.map(option => {
                  const selected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onSelect(option.value)}
                      className="h-[32px] flex items-center gap-[8px] pl-[8px] pr-[16px] text-left hover:bg-c-bg-hover"
                    >
                      <span className="w-[16px] shrink-0 flex items-center justify-center text-c-icon-secondary">
                        {selected && <Check size={14} strokeWidth={1.5} />}
                      </span>
                      <span className="flex-1 min-w-0 truncate text-[11px] font-[500] leading-[16px] tracking-[0.055px] text-c-text">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
