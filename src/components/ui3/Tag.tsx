import { clsx } from "clsx";

const FONT = "font-[family-name:var(--composa-font-family)]";

// ─── Tag ──────────────────────────────────────────────────────────────────────
// A short status word on a tinted surface: "Beta", "Public beta", "New".
//
// WHY THIS EXISTS. `@composa/ui` had three things shaped like a tag and none of
// them was one:
//
//   • `Chit`         — a colour swatch (fill / opacity / gradient / image).
//   • `ChipVariable` — an inspector *variable* chip: `max-w-[80px]` with
//                      ellipsis, an optional detach button, fixed light
//                      inspector colours. It means "a variable is bound here".
//   • `BetaBadge`    — the right shape, but a private helper inside
//                      `AgentPanel.tsx`, unexported and hard-coded to "Beta".
//
// So every consumer that wanted a tag had to hand-roll one, and the Composa app
// did exactly that for the homepage's "Public beta" label. `AgentPanel` now
// renders this component instead of its private copy, so there is one tag in the
// system rather than one per surface.
//
// SIZES. `sm` is the editor's own badge — 16px tall, 9px text — the size that
// fits beside an 11px panel heading. `md` is for surfaces with room, such as the
// marketing site's hero, where a 9px word beside an 86px title would vanish. The
// sizes are deliberately not a continuum: two named places a tag belongs.
//
// TONE. `brand` is the tinted-surface + brand-text pair the editor already used
// for "Beta". `neutral` is for a label that states a fact rather than flagging a
// state. Both read from `c-` tokens rather than hex, so a reskin moves them.
//
// NOT A CONTROL. A tag is text. It takes no click handler and no focus: if a
// short word needs to *do* something, it is a `Button`, and giving this one an
// `onClick` would be the fake affordance in miniature.

export type TagSize = "sm" | "md";
export type TagTone = "brand" | "neutral";

export interface TagProps {
  /** The word. Sentence case — the house rule is no all-caps unless asked. */
  children: React.ReactNode;
  /** `sm` (editor chrome, 16px) or `md` (roomier surfaces, 24px). Default `sm`. */
  size?: TagSize;
  /** `brand` tinted (default) or `neutral`. */
  tone?: TagTone;
  className?: string;
}

const SIZES: Record<TagSize, string> = {
  sm: "h-[16px] px-[5px] text-[9px] leading-[14px] rounded-c-sm",
  md: "h-[24px] px-[10px] text-[13px] leading-[18px] rounded-c-md",
};

const TONES: Record<TagTone, string> = {
  brand: "bg-c-bg-selected text-c-text-brand",
  neutral: "bg-c-bg-secondary text-c-text-secondary",
};

export function Tag({ children, size = "sm", tone = "brand", className }: TagProps) {
  return (
    <span
      className={clsx(
        FONT,
        "inline-flex items-center font-[550] whitespace-nowrap",
        SIZES[size],
        TONES[tone],
        className,
      )}
      data-composa-tag={tone}
      data-composa-tag-size={size}
    >
      {children}
    </span>
  );
}
