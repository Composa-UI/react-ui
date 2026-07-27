import { clsx } from "clsx";
import { type FocusEventHandler, type MouseEventHandler, type ReactElement, type ReactNode, useId, useState, useRef } from "react";
import { Check, ChevronRight, Minus } from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { useComposaMode } from "./useComposaMode";

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
  /** Stable DOM id used by menu orchestrators for focus return. */
  id?: string;
  type?: MenuRowType;
  label?: string;
  sublabel?: string;
  shortcut?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  checked?: boolean;
  /** Checked-state semantics for mutually exclusive or independently toggled rows. */
  selectionRole?: "radio" | "checkbox";
  /** Indeterminate state for checkmark rows */
  mixed?: boolean;
  disabled?: boolean;
  /** Visible and programmatically-associated explanation for an unavailable row. */
  disabledReason?: string;
  destructive?: boolean;
  /** Marks a row as the trigger for a nested menu. */
  hasSubmenu?: boolean;
  /** Controlled disclosure state for a nested menu trigger. */
  submenuExpanded?: boolean;
  /** ID of the nested menu controlled by this row. */
  submenuControls?: string;
  /** For heading rows — capitalise text (default false) */
  uppercase?: boolean;
  onClick?: () => void;
  onFocus?: FocusEventHandler<HTMLDivElement>;
  onMouseEnter?: MouseEventHandler<HTMLDivElement>;
  children?: ReactNode;
  className?: string;
}

export function MenuRow({
  id,
  type = "simple",
  label = "",
  sublabel,
  shortcut,
  leading,
  trailing,
  checked = false,
  selectionRole,
  mixed = false,
  disabled = false,
  disabledReason,
  destructive = false,
  hasSubmenu = false,
  submenuExpanded,
  submenuControls,
  uppercase = false,
  onClick,
  onFocus,
  onMouseEnter,
  children,
  className,
}: MenuRowProps) {
  const [hovered, setHovered] = useState(false);
  const reasonId = useId();

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
  const itemRole = selectionRole === "radio"
    ? "menuitemradio"
    : selectionRole === "checkbox"
      ? "menuitemcheckbox"
      : "menuitem";
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

  // A checkmark row reserves a fixed LEFT check slot (kept even when unchecked
  // so labels align across the menu) and may ALSO carry a leading icon in a
  // separate slot AFTER the check → [check] [icon] [label] … [shortcut].
  const isCheckmark = type === "checkmark";
  const hasCheckSlot = isCheckmark;
  // The secondary leading-icon slot: checkmark rows show it only when a
  // `leading` icon is supplied; other rows keep their existing behaviour.
  const hasLeadingSlot = type === "toggle" || (!isCheckmark && !!leading) || (isCheckmark && !!leading);

  // Checkmark + leading icon track the row's TEXT color (labelColor) rather than
  // an independent accent/hardcoded color, so they read as one consistent color
  // with the label at every state (rest/hover/disabled/destructive).
  const checkContent = (() => {
    if (checked) return <Check size={12} strokeWidth={2.5} />;
    if (mixed)   return <Minus size={12} strokeWidth={2.5} />;
    return null;
  })();

  const leadingContent = (() => {
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
      id={id}
      role={itemRole}
      // Preserve existing label+shortcut accessible names. Only override the
      // computed name when visible explanatory copy would otherwise be folded
      // into a disabled row's name; the reason remains in aria-describedby.
      aria-label={disabledReason ? label : undefined}
      // Disabled menu items stay in the roving set so keyboard users can reach
      // their visible explanation instead of silently skipping the topology.
      tabIndex={0}
      aria-disabled={disabled}
      aria-checked={selectionRole ? checked : undefined}
      aria-describedby={disabledReason ? reasonId : undefined}
      aria-haspopup={hasSubmenu ? "menu" : undefined}
      aria-expanded={hasSubmenu ? Boolean(submenuExpanded) : undefined}
      aria-controls={hasSubmenu ? submenuControls : undefined}
      onClick={disabled ? undefined : onClick}
      onFocus={onFocus}
      onMouseEnter={event => {
        if (interactive) setHovered(true);
        onMouseEnter?.(event);
      }}
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
      {/* Reserved LEFT check slot — always present on checkmark rows so labels
          align whether or not a row is checked. The check is accent-coloured. */}
      {hasCheckSlot && (
        <span className={clsx("shrink-0 flex items-center justify-center size-[24px]", labelColor)}>
          <span className="flex items-center justify-center size-[16px]">
            {checkContent}
          </span>
        </span>
      )}

      {/* Leading 24px slot (icon / toggle) — sits AFTER the reserved check.
          `labelColor` here lets any `currentColor`-based icon (e.g. a lucide
          glyph) inherit the same color as the label text. */}
      {hasLeadingSlot && (
        <span className={clsx("shrink-0 flex items-center justify-center size-[24px]", type !== "toggle" && labelColor)}>
          <span className="flex items-center justify-center size-[16px]">
            {leadingContent}
          </span>
        </span>
      )}

      {/* Text */}
      <span className={clsx(
        "flex-1 min-w-0 flex flex-col justify-center py-[4px]",
        !(hasCheckSlot || hasLeadingSlot) && "pl-[4px]",
        !(trailing || shortcut || type === "expand" || hasSubmenu) && "pr-[8px]",
      )}>
        <span className={clsx(LABEL_CLASS, labelColor, "truncate")}>{label}</span>
        {(disabledReason || (sublabel && type === "complex")) && (
          <span
            id={disabledReason ? reasonId : undefined}
            className={clsx(FONT, "text-[9px] leading-[14px] font-[450]", mutedColor, "max-w-[260px] whitespace-normal")}
          >
            {disabledReason ?? sublabel}
          </span>
        )}
      </span>

      {/* Trailing: right-aligned shortcut, chevron, or custom */}
      {(shortcut || type === "expand" || hasSubmenu || trailing) && (
        <span className={clsx(
          "shrink-0 flex items-center justify-end pr-[8px] gap-[4px]",
          type === "expand" || hasSubmenu ? "size-[24px] pr-0" : "pl-[8px]",
          mutedColor,
        )}>
          {trailing && trailing}
          {shortcut && !trailing && (
            <span className={clsx(SHORTCUT_CLASS, "text-right")}>{shortcut}</span>
          )}
          {(type === "expand" || hasSubmenu) && !trailing && (
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
// Anchors a Menu to a trigger through a collision-aware portal. `children` is a
// render fn receiving a `close` callback so item handlers can dismiss.
export function PopoverMenu({
  trigger,
  children,
  align = "left",
  className,
  directTrigger = false,
}: {
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  className?: string;
  /** Put Radix trigger semantics directly on a ref/prop-forwarding trigger element. */
  directTrigger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const mode = useComposaMode();

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <div className={clsx("relative", className)}>
        {directTrigger ? (
          <PopoverPrimitive.Trigger asChild>{trigger as ReactElement}</PopoverPrimitive.Trigger>
        ) : (
          <PopoverPrimitive.Trigger asChild>
            <div ref={triggerRef} tabIndex={-1}>{trigger}</div>
          </PopoverPrimitive.Trigger>
        )}
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            data-composa-mode={mode}
            side="bottom"
            align={align === "right" ? "end" : "start"}
            sideOffset={4}
            collisionPadding={8}
            avoidCollisions
            sticky="partial"
            onCloseAutoFocus={event => {
              if (directTrigger) return;
              event.preventDefault();
              triggerRef.current?.querySelector<HTMLElement>("button,[href],[tabindex]:not([tabindex='-1'])")?.focus();
            }}
            className="z-50 outline-none"
          >
            {children(() => setOpen(false))}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </div>
    </PopoverPrimitive.Root>
  );
}
