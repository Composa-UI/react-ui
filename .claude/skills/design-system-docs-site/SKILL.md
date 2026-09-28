---
name: design-system-docs-site
description: >-
  Build a Carbon-fidelity, annotation-driven documentation site for a design
  system — the single "home" that documents every component from one source of
  truth and links out to each platform's implementation (Storybook, native
  docs, Figma). Use this whenever the user wants to document a component library
  or design system, build a component docs site or design-system portal/reference,
  set up per-component doc pages (Usage / Style / Code / Accessibility), annotate
  components, add a section rubric or a "docs contract", or create the layer that
  sits above a multi-platform design system — even if they don't say "Carbon" or
  "docs site" by name. Also use when a design system exists in code but has no
  browsable, trustworthy documentation yet.
---

# Design-system docs site

Build the **documentation layer that sits above a design system** — one site
that documents every component from a single machine-readable source, keeps that
documentation *honest* with a test, and links out to wherever each platform's
real implementation lives.

The insight this skill encodes: **a component's documentation is data, not a
hand-written page.** One annotation per component (a small JSON file) is the
truth; a contract test makes sure the annotation can't lie about the real code;
and a generated site renders those annotations into Carbon-style per-component
pages. Because the annotation is platform-agnostic, the same site is the home
for a React kit, a SwiftUI kit, a Figma library — the **Code tab links out** to
each one instead of trying to be any single one.

Reflect this back to the user in their terms: this is not "the React docs," it's
the canonical index every platform hangs off, with the contract keeping them all
honest.

## The three pillars

1. **Annotations — the single source of truth.** One `annotations/<Component>.json`
   per component: what it is, its variants, states, anatomy, tokens, a11y, and a
   machine-checkable `enforce` block. The site renders *only* what the annotation
   contains, so coverage and consistency are structural, not a matter of anyone
   remembering to write a page. Full field guide: `references/annotation-contract.md`.

2. **The contract — documentation that can't lie.** A single test
   (`annotation-contract.test`) enforces three layers: **schema** (every
   annotation validates), **truthfulness** (the `enforce` claims are checked
   against the real component — a declared ARIA role is render-verified, a
   `tokensOnly` claim is verified by scanning the source for hardcoded hex), and
   **rubric-completeness** (a component of a given archetype carries the sections
   its archetype requires). This is what makes the docs trustworthy: a green test
   means the site is not asserting anything the code doesn't actually do. See
   `references/annotation-contract.md`.

3. **The site — a Carbon-fidelity generated app.** A small Vite + React app reads
   the annotations and renders per-component pages with Carbon's visual language:
   a black UI-Shell masthead, Usage / Style / Code / Accessibility tabs, `↳`
   anchor links, Carbon DataTables, and a live component preview embedded from
   Storybook. Architecture and file map: `references/docs-app.md`.

## The section rubric

Every component declares an `archetype` (primitive / composite / overlay / shell
/ utility) that decides which sections its page gets — as **data-driven
conditions**, so every page is consistent by construction rather than by
per-page judgement. This rubric is the real product; treat it as the spec for
what "documented" means. It is tool-agnostic: it governs this annotation → site
pipeline, and equally a Figma/Specs redline pipeline. Full rubric:
`references/section-rubric.md`.

## Workflow — standing this up for a design system

Work in this order; each step has a verifiable end state. Adapt paths to the
target repo. The reference implementation these were distilled from is the
`Composa-UI/react-ui` repo — point at it for concrete code.

1. **Tokens: one source + a drift check.** Put every design token in one file
   (e.g. `tokens/<ds>.tokens.json`), generate the CSS custom properties from it,
   and add a `verify-parity` script that fails if the CSS, the JSON, and any
   Figma-variables export disagree. Everything visual binds to a token; the site
   documents tokens straight from this source. Typography counts — bind type to
   `--<ds>-body-*` tokens, don't hardcode `text-[11px]`.

2. **Annotation schema.** Add `annotations/annotation.schema.json` (see
   `references/annotation-contract.md` for the field-by-field schema, including
   the optional `archetype`, `guidance`, `anatomy`, `examples`). Keep
   `additionalProperties: true` so partial annotations still validate as you roll
   out.

3. **The contract test.** Add the three-layer test. Grandfather components that
   don't yet declare an `archetype` so the rubric can roll out incrementally.
   Wire it into the repo's `check` script (tokens + typecheck + test + build).

4. **The docs app.** Scaffold the Vite/React app per `references/docs-app.md`:
   the Carbon chrome, the tab structure, the token/annotation data layer, the
   Storybook (or per-platform) embed, and the Pages deploy workflow. Base path
   and Storybook URL are the two things to set per project.

5. **Annotate the components.** One annotation per component, authored from the
   component **source as ground truth** (its classes are the real spacing and
   tokens) plus any feature spec for prose. Then adversarially verify each
   against source — the cardinal rule is **never invent a number, token, or part
   that isn't in the source.** For a large library this is a perfect fan-out:
   one agent authors each component's annotation, a second agent verifies it
   against source. See "Annotating at scale" below.

6. **Deploy.** GitHub Pages from `main` via an Actions workflow that runs
   `npm run docs` and uploads the built site. Branch pushes fail at the Pages
   environment gate by design — deploy only from the default branch.

## Multi-platform: the layer above

The **Code tab is a set of links out, not a code dump.** For a React kit it
links to Storybook; for a native kit, to that platform's doc; it can carry a
Figma library link and a Code Connect mapping. The site's job is to be the one
place a designer or engineer starts, and to route them to the live
implementation for their platform. When documenting a system that ships on more
than one platform, model each platform as a resource card on the Code tab rather
than forcing one platform's docs to stand in for the system.

## Truthfulness principles (carry these into every annotation)

- **Never invent.** Spacing, sizes, token names, and anatomy parts come from the
  component source (or a Specs export) — never from a guess. If you can't verify
  something, don't claim it.
- **Declared vs verified.** `enforce.ariaRole: true` means "render-verified in
  CI" and needs a render fixture; use it only for components that render trivially
  (most primitives). Composites and dialogs — whose roles only mount when open,
  or need heavy props — keep the role **declared** (`ariaRole: false`), which the
  site shows as "Declared", not a fabricated "CI-verified".
- **Utilities stay lean.** A small atom needs only the base fields; don't pad it
  with invented anatomy or guidance.

## Annotating at scale (optional fan-out)

For a library of dozens of components, annotate in waves with a two-stage
workflow: **author** (one agent per component reads its source + spec, writes
`annotations/<C>.json`) then **verify** (a second agent adversarially checks it
against source, fixing invented values in place). Group by archetype so a wave
shares a reference annotation and a required-section shape (composites/dialogs vs
utilities). After each wave, run the contract test, patch any over-claimed
`ariaRole` down to declared, and deploy. This is how the reference implementation
took coverage from 30 → 80 components.

## Reference files

- `references/section-rubric.md` — the archetypes and which sections each
  requires; the editorial contract. Read before designing what a page shows.
- `references/annotation-contract.md` — the annotation JSON schema (field by
  field) and the three-layer contract test. Read before writing the schema or the
  test.
- `references/docs-app.md` — the Vite/React Carbon docs app: file map, chrome,
  tabs, token + annotation data layer, Storybook embed, and deploy. Read before
  scaffolding the site.
