import { clsx } from "clsx";
import { type ReactNode, useState, useRef, useEffect } from "react";
import { Check, ChevronRight, Minus } from "lucide-react";

// ─── Menu ─────────────────────────────────────────────────────────────────────
// Figma menus are always dark regardless of app mode. We apply
// data-composa-mode="dark" so all child token classes resolve to dark values —
// no hardcoded colours anywhere except where a token doesn't exist.

const FONT = "font-[family-name:var(--composa-font-family)]";
const LABEL_CLASS    = clsx(FONT, "text-[11px] leading-[16px] tracking-[0.055px] font-[450]");
const SHORTCUT_CLASS = clsx(FONT, "text-[11px] leading-[16px] tracking-[0.055px] font-[450]");
const HEADING_CLASS  = clsx(FONT, "text-[11px] leading-[16px] tracking-[0.005em] font-[550]");

// ─── MenuRow ──────────────────────────────────────────────────────────────────

export type MenuRowType =
  | "simple"     // label + optional shortcut
  | "checkmark"  // leading slot for check icon; reserved even when unchecked
  | "toggle"     // leading mini-switch indicator
  | "expand"     // trailing chevron → for submenus
  | "complex"    // two-line: label + sublabel
  | "heading"    // non-interactive section label
  | "divider"    // horizontal separator line
  | "toolbar"    // row containing inline toolbar/icon buttons
  | "footer";    // bottom action bar

interface MenuRowProps {
  type?: MenuRowType;
  label?: string;
  sublabel?: string;
  shortcut?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  checked?: boolean;
  /** Indeterminate state for checkmark rows */
  mixed?: boolean;
  disabled?: boolean;
  destructive?: boolean;
  /** For heading rows — capitalise text (default false) */
  uppercase?: boolean;
  onClick?: () => void;
  children?: ReactNode;
  className?: string;
}

export function MenuRow({
  type = "simple",
  label = "",
  sublabel,
  shortcut,
  leading,
  trailing,
  checked = false,
  mixed = false,
  disabled = false,
  destructive = false,
  uppercase = false,
  onClick,
  children,
  className,
}: MenuRowProps) {
  const [hovered, setHovered] = useState(false);

  // ── Divider ──────────────────────────────────────────────────────────────
  if (type === "divider") {
    return <div className="h-px my-[8px] bg-c-border-menu" />;
  }

  // ── Heading ──────────────────────────────────────────────────────────────
  if (type === "heading") {
    return (
      <div className="flex items-center h-[24px] px-[8px]">
        <span className={clsx(
          HEADING_CLASS,
          "text-c-text-secondary",
          uppercase && "uppercase tracking-[0.08em] text-[9px]",
        )}>
          {label}
        </span>
      </div>
    );
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  if (type === "footer") {
    return (
      <div className="flex items-center gap-[4px] px-[8px] min-h-[32px] border-t border-c-border-menu">
        {children}
      </div>
    );
  }

  // ── Toolbar row ───────────────────────────────────────────────────────────
  if (type === "toolbar") {
    return (
      <div className="flex items-center gap-[2px] px-[8px] min-h-[32px]">
        {children}
      </div>
    );
  }

  // ── Interactive rows ──────────────────────────────────────────────────────
  const interactive = !disabled && !!onClick;
  const active = hovered && interactive;

  // In dark mode context:
  //   rest   → text-c-text = white, shortcut → text-c-text-secondary = rgba(255,255,255,0.7)
  //   hover  → bg-c-bg-brand (blue), all text → text-white
  //   disabled → text-c-text-tertiary = rgba(255,255,255,0.4)
  //   destructive → text-c-text-danger
  const labelColor = active
    ? "text-white"
    : destructive
      ? "text-c-text-danger"
      : disabled
        ? "text-c-text-tertiary"
        : "text-c-text";

  const mutedColor = active ? "text-white" : "text-c-text-secondary";

  const hasLeadingSlot = type === "checkmark" || type === "toggle" || !!leading;

  const leadingContent = (() => {
    if (type === "checkmark") {
      if (checked) return <Check size={12} strokeWidth={2.5} className={active ? "text-white" : "text-c-text"} />;
      if (mixed)   return <Minus size={12} strokeWidth={2.5} className={mutedColor} />;
      return null;
    }
    if (type === "toggle") {
      return (
        <span
          className="flex items-center rounded-full transition-colors"
          style={{
            width: 20, height: 12,
            backgroundColor: checked
              ? (active ? "rgba(255,255,255,0.9)" : "var(--color-bg-brand)")
              : "rgba(255,255,255,0.2)",
            padding: "1px",
          }}
        >
          <span
            className="rounded-full bg-white block transition-transform"
            style={{
              width: 10, height: 10,
              transform: checked ? "translateX(8px)" : "translateX(0)",
            }}
          />
        </span>
      );
    }
    return leading ?? null;
  })();

  return (
    <div
      role="menuitem"
      tabIndex={interactive ? 0 : undefined}
      aria-disabled={disabled}
      aria-checked={type === "checkmark" || type === "toggle" ? checked : undefined}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => interactive && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={interactive ? e => (e.key === "Enter" || e.key === " ") && onClick?.() : undefined}
      className={clsx(
        "relative flex items-center gap-[4px] min-h-[24px] mx-[4px] rounded-c-md select-none",
        active ? "bg-c-bg-brand" : "bg-transparent",
        interactive && "cursor-pointer",
        disabled && "cursor-not-allowed",
        "outline-none",
        className,
      )}
    >
      {/* Leading 24px slot */}
      {hasLeadingSlot && (
        <span className="shrink-0 flex items-center justify-center size-[24px]">
          <span className="flex items-center justify-center size-[16px]">
            {leadingContent}
          </span>
        </span>
      )}

      {/* Text */}
      <span className={clsx(
        "flex-1 min-w-0 flex flex-col justify-center py-[4px]",
        !hasLeadingSlot && "pl-[4px]",
        !(trailing || shortcut || type === "expand") && "pr-[8px]",
      )}>
        <span className={clsx(LABEL_CLASS, labelColor, "truncate")}>{label}</span>
        {sublabel && type === "complex" && (
          <span className={clsx(FONT, "text-[9px] leading-[14px] font-[450]", mutedColor, "truncate")}>
            {sublabel}
          </span>
        )}
      </span>

      {/* Trailing: right-aligned shortcut, chevron, or custom */}
      {(shortcut || type === "expand" || trailing) && (
        <span className={clsx(
          "shrink-0 flex items-center justify-end pr-[8px] gap-[4px]",
          type === "expand" ? "size-[24px] pr-0" : "pl-[8px]",
          mutedColor,
        )}>
          {trailing && trailing}
          {shortcut && !trailing && (
            <span className={clsx(SHORTCUT_CLASS, "text-right")}>{shortcut}</span>
          )}
          {type === "expand" && !trailing && (
            <ChevronRight size={12} strokeWidth={2} />
          )}
        </span>
      )}
    </div>
  );
}

// ─── Menu container ────────────────────────────────────────────────────────────

interface MenuProps {
  children: ReactNode;
  minWidth?: number;
  className?: string;
}

export function Menu({ children, minWidth = 160, className }: MenuProps) {
  return (
    // data-composa-mode="dark" forces all token classes to resolve to dark
    // values. Menu bg is always #1f1f1f (--color-bg-menu) in both modes —
    // we pin it via inline style to be explicit and immune to cascade issues.
    <div
      data-composa-mode="dark"
      role="menu"
      className={clsx(
        "inline-flex flex-col py-[8px] rounded-c-lg overflow-hidden",
        "shadow-c-400 ring-1 ring-inset ring-c-border-translucent",
        className,
      )}
      style={{
        minWidth,
        backgroundColor: "var(--color-bg-menu)",
      }}
    >
      {children}
    </div>
  );
}

// ─── MenuMultiSelect ──────────────────────────────────────────────────────────

interface MultiSelectItem {
  value: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
}

interface MenuMultiSelectProps {
  items: MultiSelectItem[];
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

export function MenuMultiSelect({ items, value, onChange, className }: MenuMultiSelectProps) {
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);

  return (
    <Menu className={className}>
      {items.map(item => (
        <MenuRow
          key={item.value}
          type="checkmark"
          label={item.label}
          shortcut={item.shortcut}
          checked={value.includes(item.value)}
          disabled={item.disabled}
          onClick={() => toggle(item.value)}
        />
      ))}
    </Menu>
  );
}

// ─── PopoverMenu ──────────────────────────────────────────────────────────────
// Anchors a Menu to a trigger with local open/close + click-away. The global
// "one overlay at a time / z-stacking" policy stays the app shell's job; this
// only owns the trigger→menu composition. `children` is a render fn receiving a
// `close` callback so item handlers can dismiss.
export function PopoverMenu({
  trigger,
  children,
  align = "left",
  className,
}: {
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={clsx("relative", className)}>
      <div onClick={() => setOpen(o => !o)}>{trigger}</div>
      {open && (
        <div className={clsx("absolute z-50 top-full mt-[4px]", align === "right" ? "right-0" : "left-0")}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
