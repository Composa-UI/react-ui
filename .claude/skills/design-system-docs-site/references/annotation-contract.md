# Annotations + the contract

One `annotations/<Component>.json` per component is the single source of truth
the site renders. A single test makes those annotations trustworthy. This file
is the schema field-by-field and the three-layer contract.

## The annotation JSON schema

`annotations/annotation.schema.json` (JSON Schema draft-07). Keep
`additionalProperties: true` so partial annotations validate while you roll out.

```jsonc
{
  "component": "Button",              // required — exported component name
  "category": "Actions",             // required — sidebar group (free string, one of your groups)
  "archetype": "primitive",          // primitive | composite | overlay | shell | utility — sets required sections
  "intent": "One line: what it is.", // required
  "guidance": "≤120 words of prose.",// bounded editorial prose (the Guidance section)
  "use_when":   ["A concrete scenario."],
  "dont_use_when": ["The sibling that fits instead."],
  "variants": {                        // { dimension: ["value (purpose)", ...] }
    "style": ["Primary (the one main action)", "Secondary", "Ghost"]
  },
  "slots": {},                         // { slotName: "what a host fills" } — {} for none
  "anatomy": [                         // ordered visible parts (numbered legend)
    { "part": "Label", "description": "The button text." }
  ],
  "examples": [                        // concrete patterns (mainly composites)
    { "title": "In a form", "description": "…", "story": "optional-story-id" }
  ],
  "states": ["default", "hover", "pressed", "disabled", "focus-visible"],
  "tokens": {                          // real token bindings; note carries exceptions
    "Label": { "font": "type/body-medium" },
    "Primary": { "bg": "bg/brand", "text": "text/on-brand" },
    "shape": { "radius": "radius/medium" },
    "note": "Any hardcoded value that isn't a token yet."
  },
  "a11y": {                            // role first, then wiring/keyboard/labels/etc.
    "role": "button (native <button>)",
    "keyboard": ["Enter", "Space"]
  },
  "enforce": {                         // machine-checkable claims (verified by the test)
    "role": "button",                 // required — the ARIA role or native element
    "ariaRole": true,                  // true = render-verified in CI (needs a fixture); false = declared
    "tokensOnly": true                 // true = source has NO hardcoded hex (verified by scan)
  },
  "code": {                            // links out — NOT a code dump
    "import": "import { Button } from '@your-ds/ui'",
    "example": "<Button style=\"Primary\">Save</Button>"
  }
}
```

Required top-level fields: `component`, `category`, `intent`, `slots`, `states`,
`tokens`, `a11y`, `enforce` (with `role`), `code`. Everything else is optional
and rendered only when present.

### The Style categories

The Style tab classifies each token by its reference into Carbon's categories —
**Color** (`bg/`, `text/`, `border/`, `icon/`), **Typography** (`type/`, `font/`),
**Structure** (`radius/`, `elevation/`, `shadow`), **Size**, **Feedback**
(interactive-state props: `hover`, `pressed`, `focus`, `on`/`off`). Only
categories a component actually has render. Bind typography to tokens
(`type/body-*`) rather than hardcoding sizes, or Typography stays empty.

## The three-layer contract test

One test file (`src/annotation-contract.test.*`), zero extra deps. It is what
lets the site claim things and be believed.

### 1. Schema — every annotation validates

Read every `annotations/*.json` and validate against the schema (a small inline
validator is enough — check required fields and top-level types). A new component
is "documented" only when a valid annotation exists.

### 2. Truthfulness — the `enforce` claims are checked against the real component

- **`ariaRole: true`** → render the component (react-test-renderer or similar)
  and assert the rendered tree carries `role="<enforce.role>"`. If a component
  claims a verified role but has no render fixture, the test fails — so only
  claim `ariaRole: true` for components you can render trivially (most
  primitives). Composites/overlays keep the role **declared** (`ariaRole: false`)
  — the role is still in `a11y.role`, the site shows "Declared", and nothing is
  fabricated.
- **`tokensOnly: true`** → read the component source (comments stripped) and fail
  if it contains a hardcoded hex color (`/#[0-9a-fA-F]{3,8}\b/`). Shared-file
  components resolve via a small `SOURCE_FILE` map.

### 3. Rubric-completeness — an archetyped component carries its required sections

For each annotation that declares an `archetype`, assert it has the sections that
archetype requires (composite/shell → non-empty `anatomy` + `guidance`; overlay →
`guidance`; every non-utility → `use_when`/`dont_use_when`). Components **without**
an `archetype` are grandfathered — valid but not yet rubric-complete — so the
rubric rolls out incrementally without breaking the build.

### Why this shape

The contract is the whole reason the docs are trustworthy: a green test means the
site is not asserting a role the component doesn't render or a "token-only" badge
the source contradicts. It also makes coverage mechanical — "annotate a
component" has an objective done state, which is what makes a large fan-out
(author → verify per component) safe.

## The Accessibility "testing status" (Carbon's four cards)

The site's a11y section mirrors Carbon's four categories — **Default state,
Advanced states, Screen reader, Keyboard navigation** — but reports what the
contract verifies and the annotation documents, with honest wording
(CI-verified / Documented / Not documented) rather than Carbon's "Tested". Derive
them from the annotation: Default state = `enforce.ariaRole` (render-verified);
Advanced states = states beyond default; Screen reader = a11y fields describing
what AT conveys; Keyboard = a11y documents keyboard interaction.
