# @composa/ui — Agent Guide

`@composa/ui` is a **Figma-fidelity component kit** (Tailwind v4 + Radix)
that provides the visual layer for the **Composa editor** (a Figma-Slides-style
tool for animated graphic overlays on video). Components are a merged set: UI3
primitives (originally seeded from a Figma-Make export, whose leftover vendored
shadcn/ui scaffolding has since been deleted) plus Composa panel compositions. This
package is the target of an ongoing **visual reskin** of the editor, and is meant
to be buildable/refinable by design-driven agents (including Figma's).

## What this package is (and isn't)

- **Is:** presentational, app-agnostic React components + design tokens. Buttons,
  inputs, dropdowns, sliders, dialogs (incl. `ColorDialog`), panels, tabs, chips,
  toolbars. Consumed by `composa-editor` via a `link:` dependency.
- **Isn't:** it holds **no product/document state**. Components take controlled
  props and emit callbacks; the editor owns the data model, undo, persistence, and
  wiring. Heuristic: *has product/document knowledge → belongs in the editor; purely
  presentational and reusable → belongs here.*

## Layout

- `src/components/ui3/*` — the components; `src/index.ts` is the public API (exports
  from source, **no build step** — consumers import TS directly).
- `src/lib/*` — pure helpers (e.g. `color.ts` HSB↔hex).
- `LICENSE` (Apache-2.0), `NOTICE`, `CONTRIBUTING.md` (incl. the CLA requirement) and
  `docs/third-party-notices.md` are the legal front door. `src/fixtures-privacy.test.ts`
  enforces the two rules that are easy to break by accident: fixture email addresses
  must use an RFC 2606 reserved domain, and exported components must not default to a
  real account.
- `src/styles/*` — Tailwind v4 entry + tokens: `composa-tokens.css` (`--color-*`
  primitives, light + `[data-composa-mode="dark"]`), `theme.css` (`@theme` maps to
  Tailwind utilities incl. the `c-*` namespace), `fonts.css`, plus
  `editor-bridge.css` — the **collision-free subset** hosts import (tokens + fonts +
  `c-*` mappings only; never the full stylesheet, which redefines `:root`
  `--background`/`--border` and would clobber a host's theme).
- `src/playground.tsx` / `npm run dev` — a Vite sandbox to see components live.

## Conventions (keep components consistent + consumable)

- **Controlled + uncontrolled discipline.** Props drive value; callbacks emit
  changes (`onXChange`). If a component keeps local visual state (e.g. a picker),
  still emit committed values so a host can bind. `InputField` is value-controlled
  only — `defaultValue` renders empty; document this kind of gotcha in the story.
- **Tokens, not hex.** Style with the `c-*` utilities / CSS vars, never hardcoded
  colors, so light/dark and future retheme work.
- **Accessibility = consumability.** Give interactive elements real `aria-label`s
  and `role`s. The editor's e2e suite locates kit surfaces by role/label; a missing
  label isn't just an a11y gap, it breaks the consumer's tests. Radix popovers/menus
  portal to `document.body` — hosts mirror `data-composa-mode` onto `<html>`, but
  keep portal content labelled.
- **Fidelity rules** for panels/rows (spacing, right-action slots, section anatomy)
  are documented consumer-side in the editor repo: `docs/composa/panel-rules.md` and
  the neutral specs in `docs/composa/specs/` (property-panel, dialogs via
  `dialog-references.md`). Match those. *(These docs currently live in the editor
  repo — reconcile placement over time.)*

## Workflow

- **Branch + review.** Contributions go on feature branches (`claude/*` or an
  agent-named branch) for the maintainer to review and merge — never straight to
  `main`. The maintainer owns visual-fidelity calls.
- **Parallel work → worktrees.** If more than one agent/session touches the kit at
  once, use separate `git worktree`s; never share one working checkout (edits
  collide and branch switches corrupt the other's tree).
- **Verify:** `npx tsc --noEmit -p tsconfig.json` must be clean. Run `npm run dev`
  and eyeball the changed component in the playground (and in both light/dark).
- **Figma-driven build:** inspect the actual Figma node/component/variable structure
  via MCP and build from it; screenshots are for final QA only. New components/
  variants should ship with a playground/story example.

## Known state / nits (2026-07-08)

- `npm ci` exits 0 with no flags. The `react-day-picker@8` / React 19 peer conflict
  that used to force `--legacy-peer-deps` is gone: the only file importing it was
  `src/components/ui/calendar.tsx`, part of the unreachable vendored island that has
  now been deleted along with 41 dependencies that served only it.
- `ColorDialog` review nits: typing a hex doesn't re-derive the 2D picker reticle;
  the gradient preview bar renders first→last stop colors ignoring positions;
  Libraries/swatches accept injected data (editor feeds document colors + variables)
  but default to demo data.
