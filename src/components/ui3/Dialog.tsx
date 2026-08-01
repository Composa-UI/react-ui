import * as RadixDialog from "@radix-ui/react-dialog";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { type ReactNode } from "react";
import { useComposaMode } from "./useComposaMode";
import { ScrollArea } from "./Panel";

// ─── Modal width presets ───────────────────────────────────────────────────────
// From Figma UI3 Modal Attributes guidelines:
//   240px  compact   — color picker, simple alerts, tutorial bubbles
//   320px  dialog    — text-only dialogs, single input
//   480px  standard  — share, forms, inspector dialogs
//   70vh   tall      — branching, merging (relative to viewport height)
//   50vh   medium    — account settings (relative to viewport height)

export const MODAL_WIDTHS = {
  compact:  240,
  dialog:   320,
  standard: 480,
} as const;

export type ModalWidth = number | string;

// special/modalbackdrop token — always the same value across modes
const MODAL_BACKDROP = "rgba(0,0,0,0.4)";

const FONT = "font-[family-name:var(--composa-font-family)]";
const TITLE_CLASS = clsx(FONT, "text-[11px] font-[550] leading-[16px] tracking-[0.055px] text-c-text");

// The card surface. Shared by `Modal` (single-card, painted on the Radix
// Content) and `ModalCard` (stacked, painted per card) so the two can't drift.
// overflow-hidden clips children (header border, body bg) to the rounded-c-lg
// radius so square corners don't poke past it. Safe for in-modal
// menus/tooltips: the DS Menu/Tooltip/inspector overlays all render through a
// Radix Portal at document.body, so they're never clipped by this container.
const MODAL_SURFACE = "bg-c-bg rounded-c-lg shadow-c-500 overflow-hidden";

/** Gap between sibling cards in a `stacked` Modal (Figma 332:3 — 218 − 210). */
export const MODAL_STACK_GAP = 8;

// ─── Modal ────────────────────────────────────────────────────────────────────
// Wraps Radix Dialog for a11y: focus trap, Escape key, aria-modal, portal.
//
// backdrop=true  → full scrim (blocks background interaction, default for most modals)
// backdrop=false → no scrim  (floating inspector dialogs, e.g. color picker)

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: ModalWidth;
  backdrop?: boolean;
  /** Whether clicking the backdrop closes the modal (default true) */
  closeOnBackdrop?: boolean;
  /**
   * Float several sibling cards in one column instead of one opaque card.
   * The container goes transparent and each child must be a `ModalCard`, so
   * every card keeps its own radius + shadow with `MODAL_STACK_GAP` between
   * them (Figma 332:3 — share card, then the actions card beneath it).
   */
  stacked?: boolean;
  className?: string;
}

export function Modal({
  open,
  onClose,
  children,
  width = MODAL_WIDTHS.standard,
  backdrop = true,
  closeOnBackdrop = true,
  stacked = false,
  className,
}: ModalProps) {
  const mode = useComposaMode();
  return (
    <RadixDialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <RadixDialog.Portal>
        {/* Scrim — conditionally rendered; special/modalbackdrop token */}
        {backdrop && (
          <RadixDialog.Overlay
            className="fixed inset-0 z-50"
            style={{ backgroundColor: MODAL_BACKDROP }}
          />
        )}

        {/* Modal card */}
        <RadixDialog.Content
          data-composa-mode={mode}
          onInteractOutside={closeOnBackdrop ? () => onClose() : e => e.preventDefault()}
          onEscapeKeyDown={() => onClose()}
          aria-describedby={undefined}
          className={clsx(
            // Positioning
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
            // Surface — stacked defers it to each ModalCard so the gap between
            // cards shows the page through, rather than one tall card.
            !stacked && MODAL_SURFACE,
            // Layout
            "flex flex-col outline-none",
            // Height constraint — footer pins, body scrolls
            "max-h-[90vh]",
            className,
          )}
          style={stacked ? { width, gap: MODAL_STACK_GAP } : { width }}
          aria-modal
        >
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

// ─── ModalCard ────────────────────────────────────────────────────────────────
// One floating card inside a `stacked` Modal. Carries the surface that a
// single-card Modal paints on its own container, so a stacked dialog reads as
// separate floating cards rather than one card with a divider.
//
// min-h-0 lets a card holding a scrollable ModalBody shrink under the Modal's
// max-height; pass `shrink-0` for cards that must always show in full.

interface ModalCardProps {
  children: ReactNode;
  className?: string;
}

export function ModalCard({ children, className }: ModalCardProps) {
  return (
    <div data-composa-modal-card className={clsx(MODAL_SURFACE, "flex flex-col min-h-0", className)}>
      {children}
    </div>
  );
}

// ─── ModalHeader ──────────────────────────────────────────────────────────────
// Three variants that map directly to Figma's ModalHeader component:
//   "default"    — title text (left) + optional actions + X (right)
//   "tabs"       — tab list (left) + optional actions + X (right)
//   "navigation" — ← back (left) + title (centre) + next → (right) + X

export type ModalHeaderVariant = "default" | "tabs" | "navigation";

interface ModalHeaderProps {
  variant?: ModalHeaderVariant;
  title?: string;
  /** Rendered in the title slot for "tabs" variant */
  tabs?: ReactNode;
  /** Navigation controls — used when variant="navigation" */
  navigation?: {
    onBack?: () => void;
    onNext?: () => void;
    canGoBack?: boolean;
    canGoNext?: boolean;
    backLabel?: string;
    nextLabel?: string;
  };
  onClose?: () => void;
  /** Extra actions rendered between the title and the X (e.g. Copy Link) */
  actions?: ReactNode;
  className?: string;
}

export function ModalHeader({
  variant = "default",
  title,
  tabs,
  navigation,
  onClose,
  actions,
  className,
}: ModalHeaderProps) {
  return (
    <div
      className={clsx(
        "flex items-center h-[40px] shrink-0 px-[8px] gap-[4px]",
        "border-b border-c-border",
        className,
      )}
    >
      {/* Navigation — back chevron */}
      {variant === "navigation" && navigation && (
        <button
          onClick={navigation.onBack}
          disabled={!navigation.canGoBack}
          className={clsx(
            "shrink-0 flex items-center gap-[2px] h-[24px] px-[4px] rounded-c-sm",
            FONT, "text-[11px] font-[450] text-c-text-secondary",
            "hover:bg-c-bg-hover disabled:opacity-30",
          )}
        >
          <ChevronLeft size={12} strokeWidth={1.5} />
          {navigation.backLabel && <span>{navigation.backLabel}</span>}
        </button>
      )}

      {/* Always provide a DialogTitle for a11y — visually hidden when tabs are shown */}
      {variant === "tabs" && (
        <RadixDialog.Title className="sr-only">
          {title ?? "Dialog"}
        </RadixDialog.Title>
      )}

      {/* Title / Tabs slot */}
      <div className="flex-1 min-w-0 flex items-center overflow-hidden">
        {variant === "tabs" && tabs ? (
          tabs
        ) : title ? (
          <RadixDialog.Title asChild>
            <span className={clsx(TITLE_CLASS, "truncate")}>{title}</span>
          </RadixDialog.Title>
        ) : (
          <RadixDialog.Title className="sr-only">Dialog</RadixDialog.Title>
        )}
      </div>

      {/* Actions slot — e.g. Copy Link */}
      {actions && (
        <div className="shrink-0 flex items-center gap-[4px]">{actions}</div>
      )}

      {/* Navigation — next chevron */}
      {variant === "navigation" && navigation && (
        <button
          onClick={navigation.onNext}
          disabled={!navigation.canGoNext}
          className={clsx(
            "shrink-0 flex items-center gap-[2px] h-[24px] px-[4px] rounded-c-sm",
            FONT, "text-[11px] font-[450] text-c-text-secondary",
            "hover:bg-c-bg-hover disabled:opacity-30",
          )}
        >
          {navigation.nextLabel && <span>{navigation.nextLabel}</span>}
          <ChevronRight size={12} strokeWidth={1.5} />
        </button>
      )}

      {/* X close button */}
      {onClose && (
        <RadixDialog.Close asChild>
          <button
            onClick={onClose}
            className="shrink-0 flex items-center justify-center size-[24px] rounded-c-sm text-c-icon-secondary hover:bg-c-bg-hover"
            aria-label="Close"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </RadixDialog.Close>
      )}
    </div>
  );
}

// ─── ModalBody ────────────────────────────────────────────────────────────────
// Scrollable content area. flex-1 so it fills space between header and footer.
// When content overflows the modal's max-height, footer stays pinned.
//
// The scrollable path uses the DS `ScrollArea` (Panel.tsx): the native scrollbar
// is fully hidden and a thin overlay thumb sits on the surface, matching the
// editor/Home panels. A short dialog (no overflow) shows no thumb and is
// unchanged; a tall dialog scrolls with the overlay thumb. `ScrollArea`'s root is
// already `flex-1 min-h-0`, so it slots in exactly where the old scroll div sat.

interface ModalBodyProps {
  children: ReactNode;
  scrollable?: boolean;
  padding?: boolean;
  className?: string;
}

export function ModalBody({
  children,
  scrollable = true,
  padding = false,
  className,
}: ModalBodyProps) {
  if (scrollable) {
    // padding + caller className style the scroll content (viewport), preserving
    // the previous behaviour where they sat on the scrollable element itself.
    return (
      <ScrollArea className={clsx(padding && "p-[16px]", className)}>
        {children}
      </ScrollArea>
    );
  }

  return (
    <div
      className={clsx(
        "flex-1 min-h-0",
        padding && "p-[16px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ─── ModalFooter ─────────────────────────────────────────────────────────────
// Three variants matching Figma ModalFooter component:
//   "action"     — [Cancel?]  [Primary action]  (right-aligned)
//   "pagination" — [← Back]  [● ○ ○]  [Next →]  (centered step indicator)
//   "share"      — [Copy link]  [Get Embed]  [Invite]  (share-specific)
// For full control, pass children directly.

export type ModalFooterVariant = "action" | "pagination" | "share";

interface ModalFooterProps {
  children: ReactNode;
  align?: "start" | "center" | "end" | "between";
  className?: string;
}

export function ModalFooter({
  children,
  align = "end",
  className,
}: ModalFooterProps) {
  const alignClass = {
    start:   "justify-start",
    center:  "justify-center",
    end:     "justify-end",
    between: "justify-between",
  }[align];

  return (
    <div
      className={clsx(
        "flex items-center gap-[8px] h-[48px] shrink-0 px-[16px]",
        "border-t border-c-border",
        alignClass,
        className,
      )}
    >
      {children}
    </div>
  );
}

// ─── ModalSection ─────────────────────────────────────────────────────────────
// Convenience wrapper for a labelled section within a ModalBody.
// Used in share dialogs, settings panels, etc.

interface ModalSectionProps {
  children: ReactNode;
  className?: string;
}

export function ModalSection({ children, className }: ModalSectionProps) {
  return (
    <div className={clsx("flex flex-col", className)}>
      {children}
    </div>
  );
}

// ─── ModalDivider ─────────────────────────────────────────────────────────────
export function ModalDivider({ className }: { className?: string }) {
  return <div className={clsx("h-px bg-c-border shrink-0", className)} />;
}
