import { useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { LayoutGrid, Image as ImageIcon, Layers } from "lucide-react";
import { Menu, MenuRow, PopoverMenu } from "./Menu";

// ─── Navigation rail ──────────────────────────────────────────────────────────
// The editor's left rail — a few primary destinations, each an icon button with a
// LABEL BELOW (label style matches the property-panel sub-label: 9px secondary).
// The active destination uses the accent (text-c-text-brand + tinted button).
const FONT = "font-[family-name:var(--composa-font-family)]";
const S = 18;

export interface NavItem {
  id: string;
  icon: ReactNode;
  label: string;
}

const DEFAULT_ITEMS: NavItem[] = [
  { id: "composition", icon: <LayoutGrid size={S} strokeWidth={1.5} />, label: "Comp" },
  { id: "assets",      icon: <ImageIcon size={S} strokeWidth={1.5} />,  label: "Assets" },
];

export function NavRail({
  items = DEFAULT_ITEMS,
  defaultActive = "composition",
  active: controlled,
  onSelect,
  onBackToFiles,
}: {
  items?: NavItem[];
  defaultActive?: string;
  active?: string;
  onSelect?: (id: string) => void;
  /**
   * Optional handler for the "Back to Files" affordance. When provided, the
   * brand button becomes a menu trigger whose single action, "Back to Files",
   * invokes this callback (the consumer wires the actual editor → /projects
   * navigation). When omitted, the brand button stays inert as before, so
   * existing consumers are unaffected.
   */
  onBackToFiles?: () => void;
}) {
  const [internal, setInternal] = useState(defaultActive);
  const active = controlled ?? internal;
  const select = (id: string) => { if (controlled === undefined) setInternal(id); onSelect?.(id); };

  // brand/app icon slot — a plain icon button, no label below (unlike the
  // nav destinations). Standing in with lucide Layers until the real mark is
  // designed. With `onBackToFiles`, it triggers the design-system Menu below.
  const brandButton = (
    <button
      type="button"
      aria-label="Composa"
      aria-haspopup={onBackToFiles ? "menu" : undefined}
      className="size-[32px] rounded-c-md flex items-center justify-center text-c-icon hover:bg-c-bg-hover"
    >
      <Layers size={18} strokeWidth={1.5} />
    </button>
  );

  return (
    <nav aria-label="Navigation" className="w-[60px] shrink-0 h-full flex flex-col items-center bg-c-bg border-r border-c-border">
      <div className="w-full flex justify-center py-[8px]">
        {onBackToFiles ? (
          <PopoverMenu directTrigger trigger={brandButton}>
            {close => (
              <Menu>
                <MenuRow
                  label="Back to Files"
                  onClick={() => { close(); onBackToFiles(); }}
                />
              </Menu>
            )}
          </PopoverMenu>
        ) : brandButton}
      </div>
      {/* divider — inset from the rail edges, not full-width */}
      <div aria-hidden className="w-full px-[12px]">
        <div className="h-px bg-c-border" />
      </div>
      {/* nav destinations */}
      <div className="flex flex-col items-center gap-[6px] pt-[12px]">
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
                "size-[32px] rounded-c-md flex items-center justify-center transition-colors",
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
      </div>
    </nav>
  );
}
