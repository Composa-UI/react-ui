import { useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { LayoutGrid, Sparkles, Image as ImageIcon } from "lucide-react";

// ─── Navigation rail ──────────────────────────────────────────────────────────
// The editor's left rail — a few primary destinations, each an icon button with a
// LABEL BELOW (label style matches the property-panel sub-label: 9px secondary).
// The active destination uses the accent (text-c-text-brand + tinted button).
// NOTE: app-shell.md specs an icon-only 40px rail with hover tooltips + 2 items
// (Composition, Assets); this follows the newer direct instruction (3 items +
// labels: Composition · Agent · Assets).

const FONT = "font-[family-name:var(--composa-font-family)]";
const S = 20;

export interface NavItem {
  id: string;
  icon: ReactNode;
  label: string;
}

const DEFAULT_ITEMS: NavItem[] = [
  { id: "composition", icon: <LayoutGrid size={S} strokeWidth={1.5} />, label: "Composition" },
  { id: "agent",       icon: <Sparkles size={S} strokeWidth={1.5} />,   label: "Agent" },
  { id: "assets",      icon: <ImageIcon size={S} strokeWidth={1.5} />,  label: "Assets" },
];

export function NavRail({
  items = DEFAULT_ITEMS,
  defaultActive = "composition",
  active: controlled,
  onSelect,
}: {
  items?: NavItem[];
  defaultActive?: string;
  active?: string;
  onSelect?: (id: string) => void;
}) {
  const [internal, setInternal] = useState(defaultActive);
  const active = controlled ?? internal;
  const select = (id: string) => { if (controlled === undefined) setInternal(id); onSelect?.(id); };

  return (
    <nav aria-label="Navigation" className="w-[68px] shrink-0 h-full flex flex-col items-center gap-[4px] pt-[8px] bg-c-bg border-r border-c-border">
      {items.map(it => {
        const on = active === it.id;
        return (
          <div key={it.id} className="flex flex-col items-center gap-[3px]">
            {/* icon button — label sits BELOW it, outside the button */}
            <button
              onClick={() => select(it.id)}
              aria-pressed={on}
              aria-label={it.label}
              className={clsx(
                "size-[40px] rounded-c-md flex items-center justify-center transition-colors",
                on ? "bg-c-bg-selected text-c-text-brand" : "text-c-icon hover:bg-c-bg-hover",
              )}
            >
              {it.icon}
            </button>
            <span className={clsx(FONT, "text-[9px] font-[450] leading-[12px] tracking-[0.045px]", on ? "text-c-text-brand" : "text-c-text-secondary")}>
              {it.label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}
