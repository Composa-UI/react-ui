// ─── Typography foundation ──────────────────────────────────────────────────
// Canonical body text styles, bound to the --composa-body-* tokens defined in
// composa-tokens.css (which resolve to the Figma type scale: 11/16, 9/14, 13/22
// at weights 450/550 with the matching letter-spacing).
//
// Use these instead of hardcoding `text-[11px] leading-[16px] font-[450] …` so
// typography stays token-bound and reskins from the single source, the same way
// colors bind to --color-* tokens. They are plain Tailwind arbitrary-property
// strings, so they work both in this package's build and in a host's own
// Tailwind build (the host's @source scan picks the literals up from this file).
//
// Each style sets font-family, size, line-height, weight, and letter-spacing so
// it is fully self-contained — apply one constant, add nothing else.

const FAMILY = "font-[family-name:var(--composa-font-family)]";

export const typography = {
  /** 13px / 22px · weight 450 — large body / section copy. */
  bodyLarge: `${FAMILY} [font-size:var(--composa-body-large-size)] [line-height:var(--composa-body-large-line)] [font-weight:var(--composa-body-large-weight)] [letter-spacing:var(--composa-body-large-letter-spacing)]`,
  /** 11px / 16px · weight 450 — the default control/label style. */
  bodyMedium: `${FAMILY} [font-size:var(--composa-body-medium-size)] [line-height:var(--composa-body-medium-line)] [font-weight:var(--composa-body-medium-weight)] [letter-spacing:var(--composa-body-medium-letter-spacing)]`,
  /** 11px / 16px · weight 550 — emphasized label / CTA. */
  bodyMediumStrong: `${FAMILY} [font-size:var(--composa-body-medium-size)] [line-height:var(--composa-body-medium-line)] [font-weight:var(--composa-body-medium-strong-weight)] [letter-spacing:var(--composa-body-medium-letter-spacing)]`,
  /** 9px / 14px · weight 450 — small / caption text. */
  bodySmall: `${FAMILY} [font-size:var(--composa-body-small-size)] [line-height:var(--composa-body-small-line)] [font-weight:var(--composa-body-small-weight)] [letter-spacing:var(--composa-body-small-letter-spacing)]`,
} as const;

export type TypeStyle = keyof typeof typography;
