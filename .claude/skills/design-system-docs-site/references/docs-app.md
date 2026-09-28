# The docs app

A small **Vite + React** app that reads the annotations and tokens and renders
Carbon-fidelity per-component pages. It ships as static files to GitHub Pages.
Reference implementation: `Composa-UI/react-ui` → `docs-site/`.

## File map

```
docs-site/
├── vite.docs.config.ts     # root = docs-site/app; base = "/<repo>/"; outDir = docs-site/dist
├── app/
│   ├── index.html + main.tsx
│   ├── data.ts             # loads annotations/*.json + tokens; routing; storybook href helpers
│   ├── content.tsx         # all rendering: masthead, tabs, tables, a11y cards, Style, footer
│   └── docs.css            # Carbon design tokens (--cds-*) + all chrome styles
└── assemble-storybook.mjs  # copies a built Storybook into dist/storybook (optional)
```

Build: `vite build --config docs-site/vite.docs.config.ts` → `docs-site/dist`.
Two per-project settings: `base: "/<repo>/"` and the Storybook/platform URL.

## Data layer (`data.ts`)

- Import every `annotations/*.json` (Vite glob) into an `Annotation[]`; import
  the token JSON.
- `GROUP_ORDER` — the sidebar categories, in order; each component's `category`
  is one of them. `orderedComponents` + `prevNextComponent` drive the footer.
- Hash routing (no BrowserRouter, so it works on Pages): `#/components/<slug>`,
  `#/status`, home. `routeForComponent`, `parseRoute`.
- Storybook helpers: `storybookHref(c, variant)` and
  `storybookIframeHref(c, theme, variant)` build
  `storybook/iframe.html?id=<storyId>&globals=composaMode:<theme>`. For a
  platform without Storybook, swap these for that platform's doc URLs.

## Chrome (Carbon visual language, in `content.tsx` + `docs.css`)

- **Masthead** — a tall black UI-Shell band with the big light page title; on a
  component page the tab bar docks at the bottom of that black band.
- **Tabs** — Usage / Style / Code / Accessibility (`role="tab"`), state in React.
- **PageDescription** — the intent lede on the content surface below the masthead.
- **Anchor links** — a two-column `↳` list of the page's sections (generated from
  the section list).
- **DataTables** — white header row, transparent body (rows share the Gray-10
  page canvas, hairline separators only). Used for Variants, States, Style tokens.
- Colors via `--cds-*` tokens (canvas Gray-10 `#f4f4f4`, white surface, IBM blue
  `#0f62fe`, Carbon grays), IBM Plex via Google Fonts, sharp corners. Define light
  under `:root` and a dark override; give `body` an explicit background.

## Tab contents

- **Usage** — Live demo (Storybook iframe with theme + variant selectors attached
  to the frame) → Accessibility-status cards (Carbon's 2×2, connected, no
  per-card stroke) → When to use (paired Do/Don't cards) → Variants table →
  Anatomy numbered legend → States table → Guidance prose → Examples cards. Each
  renders only if its annotation field is present (the rubric).
- **Style** — token categories (Color / Typography / Structure / Size / Feedback),
  each an Element·Property·Token table, only where the component has tokens in
  that category; plus a compact Token-compliance badge.
- **Code** — a lede + a "Documentation" grid of **resource cards that link out**
  (one per platform: React → Storybook, etc.) + the live demo. This is the
  multi-platform seam — add a card per platform, don't inline code.
- **Accessibility** — the four-category testing-status table + what the kit
  provides (the a11y annotation) + how the contract verifies it.

## Status page

A cross-component matrix: token-compliance per component (✓ token-only / ⚠
hardcoded / — not asserted) and an accessibility matrix (ARIA role · Default
state · Advanced states · Screen reader · Keyboard). It's the at-a-glance health
of the whole system, driven entirely by the same annotation facts.

## Token pipeline (shared with the kit)

The site documents tokens from the kit's single source: `tokens/<ds>.tokens.json`
→ generated `--<ds>-*` CSS custom properties (light + a `[data-<ds>-mode="dark"]`
override), checked by a `verify-parity` script that fails if CSS, JSON, and any
Figma-variables export disagree. The Style tab reads the same JSON.

## Deploy (GitHub Pages)

`.github/workflows/docs.yml`: on push to the default branch (with a `paths`
filter of `docs-site/**`, `annotations/**`, the token source), run `npm run docs`
and upload `docs-site/dist` via `actions/upload-pages-artifact` +
`actions/deploy-pages`. Deploy **only** from the default branch — branch pushes
fail at the `github-pages` environment gate by design. A component-source-only
change won't trigger it (not in the path filter); force a rebuild with
`workflow_dispatch` when you need the embedded Storybook rebuilt from latest source.

## Porting to another platform / design system

- Point `data.ts` at that repo's `annotations/` + token source.
- Set `base` and the platform doc URLs (Storybook helper → that platform's docs).
- Keep the chrome and the rubric identical — that consistency is the point.
- If the system ships on several platforms, give each a resource card on the Code
  tab; the site stays the one home above all of them.
