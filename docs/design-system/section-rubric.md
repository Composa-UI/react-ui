# Component doc section rubric

The rubric that decides **which sections each component's doc page gets**, so
every page is consistent by construction rather than by per-page judgement. It
is the editorial contract behind the generated docs site: an annotation supplies
the data, and this rubric — encoded as data-driven conditions — decides which
sections render.

This is tool-agnostic. It governs the `@composa/ui` annotation → docs pipeline
here, and it is the same rubric the Figma/Specs pipeline (see the *Design System
Spec Annotation* brief) should follow when it composes annotated spec sheets:
Specs supplies deterministic values, the rubric decides sections, the author
(AI) fills them, never inventing measurements.

## Principle

**Section inclusion is a function of annotation data, not opinion.** Each
conditional section renders **iff** its backing field is present and non-empty.
So "authoring a doc" means populating the fields the component's *archetype*
calls for; the docs app and the rubric check do the rest. A component is
*rubric-complete* when it carries every field its archetype requires.

## Archetypes

Every component declares one `archetype` (in its annotation). It sets which
sections are **required** vs **optional**.

| Archetype   | What it is | Examples |
|-------------|------------|----------|
| `primitive` | A single control | Button, Checkbox, Switch, Slider, InputField, Dropdown, Dial |
| `composite` | A structured surface of several named parts | Inspector, PanelSection, LayerList, NavRail, CreationToolbar |
| `overlay`   | Floats above content; placement matters | Modal, Menu, Tooltip, Notification, InspectorDialog |
| `shell`     | A whole-app layout of landmark regions | EditorShell |
| `utility`   | A small presentational atom | Avatar, Chit, LayerTypeIcon, ChipVariable |

## Sections

`R` = required for the archetype · `C` = conditional (renders iff its field is
present) · `—` = omit.

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
| Code (Storybook) | `code` | always | R | R | R | R | R |

### Section definitions

- **Intent** — one line: what it is and what it's for. Never a feature list.
- **When to use** — 1–3 `use_when` and 1–3 `dont_use_when`, each a concrete
  scenario, not a restatement of the name. The "don't"s point at the sibling
  that fits instead ("mutually exclusive options → use RadioButton").
- **Variants** — every variant carries a purpose (the `label (purpose)`
  convention). One dimension → `Variant | Purpose`; several → grouped.
- **Anatomy** — the numbered parts, top-to-bottom / outside-in. Each part is
  `{ part, description }`; the docs render a numbered legend (Carbon's anatomy
  legend). `slots` may seed it, but `anatomy` names the *visible* parts, not
  just the host-fillable ones. This is where the Figma/Specs pipeline drops its
  numbered-callout image later.
- **States** — every state carries a "when to use" (glossary + inline note).
- **Guidance** — bounded editorial prose (≤ ~120 words), the non-obvious
  behavioural, placement, or wiring advice that the structured fields can't
  carry. NOT a place for unbounded essays; if it needs headings, it's too big.
- **Examples** — concrete usage snippets/patterns for composites, each a
  `{ title, description }` (+ optional story id). The brief's "example section."
- **Style / Token compliance / Accessibility / Code** — as today, all
  data-driven and verified by the contract.

## Voice

- Second-person imperative, present tense: "Use it when…", "Pass a contextual
  icon so…". Short sentences.
- **Never invent numbers.** Spacing, sizes, and token names come from the
  component source (the Tailwind classes are the ground truth) or, for the Figma
  pipeline, from Specs — never from the author's guess.
- Match the density of the existing annotations (Button, Notification): terse,
  concrete, no marketing.

## Rubric completeness (checked)

The annotation contract enforces:
1. **Schema** — `guidance`, `anatomy`, `examples`, `archetype` validate when present.
2. **Archetype coverage** — a component whose archetype marks a section `R`
   must carry that section's field (e.g. a `composite`/`shell` must have
   `anatomy`; every non-utility must have `guidance`). Missing → the doc is not
   rubric-complete, and the contract flags it.
3. **Truthfulness** — unchanged: `enforce.role` render-verified when `ariaRole`,
   `tokensOnly` verified by scanning source for hardcoded hex.

Fields stay optional in the JSON Schema (so partial annotations still validate);
archetype coverage is the layer that turns "valid" into "complete."
