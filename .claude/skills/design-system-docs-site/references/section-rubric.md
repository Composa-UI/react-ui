# Component doc section rubric

The rubric that decides **which sections each component's doc page gets**, so
every page is consistent by construction rather than by per-page judgement. An
annotation supplies the data; this rubric — encoded as data-driven conditions —
decides which sections render. It is the editorial contract behind the generated
site.

Tool-agnostic: it governs the annotation → site pipeline, and equally a
Figma/Specs redline pipeline (Specs supplies deterministic values, the rubric
decides sections, the author fills them, never inventing measurements).

## Principle

**Section inclusion is a function of annotation data, not opinion.** Each
conditional section renders **iff** its backing field is present and non-empty.
"Authoring a doc" therefore means populating the fields the component's
*archetype* calls for; the site and the contract do the rest. A component is
*rubric-complete* when it carries every field its archetype requires.

## Archetypes

Every component declares one `archetype`. It sets which sections are **required**
vs **optional**.

| Archetype   | What it is | Examples |
|-------------|------------|----------|
| `primitive` | A single control | Button, Checkbox, Switch, Slider, Input, Dropdown |
| `composite` | A structured surface of several named parts | Inspector, Panel, List, NavRail, Toolbar |
| `overlay`   | Floats above content; placement matters | Modal, Menu, Tooltip, Toast, Dialog |
| `shell`     | A whole-app layout of landmark regions | EditorShell / AppShell |
| `utility`   | A small presentational atom | Avatar, Chip, Tag, Badge, an icon |

## Sections

`R` = required · `C` = conditional (renders iff its field is present) · `—` = omit.

| Section | Backing field | Condition to render | primitive | composite | overlay | shell | utility |
|---|---|---|---|---|---|---|---|
| Intent (lede) | `intent` | always | R | R | R | R | R |
| Live demo | — (story) | component renders | R | R | R | R | R |
| When to use (do/don't) | `use_when` / `dont_use_when` | either non-empty | R | R | R | R | C |
| **Variants** | `variants` | ≥1 dimension | C | C | C | — | C |
| **Anatomy** | `anatomy` (or `slots`) | ≥2 named parts | C | **R** | C | **R** | — |
| **States** | `states` | ≥2 states | R | C | C | — | C |
| **Guidance** | `guidance` | present | C | R | R | R | — |
| **Examples** | `examples` | present | C | C | C | C | — |
| Accessibility status | `a11y` + `enforce` | always | R | R | R | R | R |
| Style (Color/Type/Structure/Size/Feedback) | `tokens` | category non-empty | C | C | C | C | C |
| Token compliance | `enforce.tokensOnly` | always | R | R | R | R | R |
| Code (links out) | `code` | always | R | R | R | R | R |

### Section definitions

- **Intent** — one line: what it is and what it's for. Never a feature list.
- **When to use** — 1–3 `use_when` and 1–3 `dont_use_when`, each a concrete
  scenario, not a restatement of the name. The "don't"s point at the sibling that
  fits instead ("mutually exclusive options → use RadioButton"). Render as Carbon
  paired cards (green/red accent bar + filled ✓/✗ badge + caption).
- **Variants** — every variant carries a purpose (`label (purpose)`). One
  dimension → `Variant | Purpose`; several → grouped by dimension.
- **Anatomy** — the numbered parts, top-to-bottom / outside-in, as
  `{ part, description }`. Rendered as a numbered legend (Carbon's anatomy). This
  is where a Figma/Specs numbered-callout image drops in later.
- **States** — every state carries a "when to use" (a shared glossary of standard
  states + the state's own inline note).
- **Guidance** — bounded editorial prose (≤ ~120 words): the non-obvious
  behavioural / placement / wiring advice the structured fields can't carry. Not
  a place for essays; if it needs headings, it's too big.
- **Examples** — concrete usage patterns for composites, each `{ title, description }`.
- **Style / Token compliance / Accessibility / Code** — all data-driven and
  verified by the contract.

## Voice

- Second-person imperative, present tense: "Use it when…", "Pass a contextual
  icon so…". Short sentences.
- **Never invent numbers.** Spacing, sizes, and token names come from the
  component source (the utility classes are ground truth) or, for a Figma
  pipeline, from Specs — never from a guess.
- Terse, concrete, no marketing. Match the density of the existing annotations.

## Rubric completeness (checked by the contract)

1. **Schema** — `guidance`, `anatomy`, `examples`, `archetype` validate when present.
2. **Archetype coverage** — a component whose archetype marks a section `R` must
   carry that section's field (composite/shell → `anatomy` + `guidance`; overlay
   → `guidance`; every non-utility → `use_when`/`dont_use_when`). Missing → not
   rubric-complete, and the contract flags it. Components without an `archetype`
   are grandfathered so the rubric rolls out incrementally.
3. **Truthfulness** — `enforce.role` render-verified when `ariaRole: true`;
   `tokensOnly` verified by scanning source for hardcoded hex.

Fields stay optional in the JSON Schema (partial annotations still validate);
archetype coverage is the layer that turns "valid" into "complete".
