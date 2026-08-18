# Third-party notices

`@composa/ui` vendors **no third-party source**. Every third-party work reaches
this repository as a declared npm dependency, resolved by `package-lock.json`.
This file records what those works are, under what licence, and which of them
have notices that travel into built output.

It follows the pattern already used by the engine half
(`docs/third-party-notices.md` + verbatim licences in `third_party/`).

Everything below was read from the installed tree at the commit that introduced
this file. Reproduction commands are at the end.

---

## 1. Previously vendored code, now removed

Until this change the repository contained a copy of **shadcn/ui** — 48 files
under `src/components/ui/`, carrying the `data-slot` convention and matching the
shadcn registry name-for-name — plus one **Figma Make** export shim,
`src/components/figma/ImageWithFallback.tsx`. Neither was attributed anywhere in
source or docs.

All 49 files were unreachable from every entry point (the published barrel
`src/index.ts`, the playground entry `src/main.tsx`, and every unit test and e2e
spec), and have been deleted. **No vendored third-party source remains in this
repository**, so no attribution file is owed for it.

If any of that code is ever reintroduced, its upstream notice must be
reintroduced with it.

## 2. Runtime dependencies

The complete set. Versions, licences and integrity hashes are read from
`package-lock.json`; copyright lines are quoted verbatim from the licence file
each package ships.

| Package | Version | Licence | Ships a licence file | Copyright line, verbatim |
| --- | --- | --- | --- | --- |
| `@phosphor-icons/react` | 2.1.10 | MIT | yes | `Copyright (c) 2020 Phosphor Icons` |
| `@radix-ui/react-dialog` | 1.1.6 | MIT | **no** | — |
| `@radix-ui/react-dropdown-menu` | 2.1.6 | MIT | **no** | — |
| `@radix-ui/react-popover` | 1.1.6 | MIT | **no** | — |
| `@radix-ui/react-tooltip` | 1.1.8 | MIT | **no** | — |
| `clsx` | 2.1.1 | MIT | yes | `Copyright (c) Luke Edwards <luke.edwards05@gmail.com> (lukeed.com)` |
| `lucide-react` | 0.487.0 | ISC | yes | `Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.` |
| `react` | 19.2.7 | MIT | yes | `Copyright (c) Meta Platforms, Inc. and affiliates.` |
| `react-dom` | 19.2.7 | MIT | yes | `Copyright (c) Meta Platforms, Inc. and affiliates.` |
| `tw-animate-css` | 1.3.8 | MIT | yes | `Copyright (c) 2025 Wombosvideo` |

The four Radix packages declare `"license": "MIT"` in their `package.json` but
ship no `LICENSE` file in the published tarball. Recorded rather than resolved —
the same way the engine's notice file records `@open-pencil/core`'s missing
licence artifact. The canonical text lives in the upstream repository,
`https://github.com/radix-ui/primitives`.

Resolved integrity, for audit:

```
@phosphor-icons/react@2.1.10  sha512-vt8Tvq8GLjheAZZYa+YG/pW7HDbov8El/MANW8pOAz4eGxrwhnbfrQZq0Cp4q8zBEu8NIhHdnr+r8thnfRSNYA==
@radix-ui/react-dialog@1.1.6  sha512-/IVhJV5AceX620DUJ4uYVMymzsipdKBzo3edo+omeskCKGm9FRHM0ebIdbPnlQVJqyuHbuBltQUOG2mOTq2IYw==
@radix-ui/react-dropdown-menu@2.1.6  sha512-no3X7V5fD487wab/ZYSHXq3H37u4NVeLDKI/Ks724X/eEFSSEFYZxWgsIlr1UBeEyDaM29HM5x9p1Nv8DuTYPA==
@radix-ui/react-popover@1.1.6  sha512-NQouW0x4/GnkFJ/pRqsIS3rM/k97VzKnVb2jB7Gq7VEGPy5g7uNV1ykySFt7eWSp3i2uSGFwaJcvIRJBAHmmFg==
@radix-ui/react-tooltip@1.1.8  sha512-YAA2cu48EkJZdAMHC0dqo9kialOcRStbtiY4nJPaht7Ptrhcvpo+eDChaM6BIs8kL6a8Z5l5poiqLnXcNduOkA==
clsx@2.1.1  sha512-eYm0QWBtUrBWZWG0d386OGAw16Z995PiOVo2B7bjWSbHedGl5e0ZWaq65kOGgUSNesEIDkB9ISbTg/JK9dhCZA==
lucide-react@0.487.0  sha512-aKqhOQ+YmFnwq8dWgGjOuLc8V1R9/c/yOd+zDY4+ohsR2Jo05lSGc3WsstYPIzcTpeosN7LoCkLReUUITvaIvw==
react@19.2.7  sha512-HNe9WslTbXmFK8o8cmwgAeJFSBvt1bPdHCVKtaaV+WlAN36mpT4hcRpwbf3fY56ar2oIXzsBpOAiIRHAdY0OlQ==
react-dom@19.2.7  sha512-t0BRVXvbiE/o20Hfw669rLbMCDWtYZLvmJigy2f0MxsXF+71pxhR3xOkspmsO8h3ZlNzyibAmtCa3l4lYKk6gQ==
tw-animate-css@1.3.8  sha512-Qrk3PZ7l7wUcGYhwZloqfkWCmaXZAoqjkdbIDvzfGshwGtexa/DAs9koXxIkrpEasyevandomzCBAV1Yyop5rw==
```

### Licence census of the full production tree

Read from the `license` field of every installed `package.json` reachable with
`npm ls --omit=dev --all`:

| Licence | Packages |
| --- | --- |
| MIT | 50 |
| ISC | 1 |
| 0BSD | 1 |

**52 production packages, 100% permissive. Zero GPL, LGPL, AGPL or MPL.**
Nothing in the dependency chain narrows the Apache-2.0 grant in `LICENSE`.

## 3. Notices that travel into built output

Two dependencies contribute **artwork**, not just code, so their notices are
preserved verbatim in this repository and reproduced in `NOTICE`:

| Work | Licence | Preserved at |
| --- | --- | --- |
| Lucide — icon geometry rendered by `lucide-react` | ISC (portions MIT, held by Cole Bemis as part of Feather) | `third_party/lucide/LICENSE` |
| Phosphor Icons — icon geometry rendered by `@phosphor-icons/react` | MIT | `third_party/phosphor-icons/LICENSE` |

Both files were copied byte-for-byte from the installed packages at the versions
pinned above.

## 4. Icons proposed upstream — first-party, not third-party

`src/icons/proposed-lucide.tsx` defines 26 icons with `createLucideIcon` from
`lucide-react`. These are **first-party geometry** authored here and proposed to
Lucide upstream; each carries a typed metadata record naming the pull request
that will retire it, e.g.

```
layoutHorizontal: { pr: 4541, sourceUrl: "https://github.com/lucide-icons/lucide/pull/4541", replacementImport: "LayoutHorizontal" },
```

No third-party copyright attaches to them. They are listed here only so a reader
does not mistake them for copied Lucide artwork. `createLucideIcon` itself is
covered by the Lucide ISC notice in §3.

## 5. Fonts

**No webfont binary is redistributed.** `git ls-files` matching
`\.(woff2?|ttf|otf|eot)$` returns zero.

- `src/styles/fonts.css` is a single `@import url(...)` against the Google Fonts
  CSS API. Linking to a CDN is not redistribution, so no font licence obligation
  attaches to this repository.
- `src/components/ui3/googleFontsCatalog.ts` bundles the Google Fonts **family
  name catalogue** — `[family, generic fallback]` tuples snapshotted from
  `https://fonts.google.com/metadata/fonts`, as its own header states. This is
  factual metadata about which families exist, not font outlines and not font
  software. Individual webfonts still load on demand from
  `fonts.googleapis.com`, each under its own upstream licence (Inter, the only
  family loaded by default, is SIL OFL 1.1).

---

## Reproduction

```bash
npm ci                                    # exit 0

# Versions, licences and integrity, straight from the lockfile
node -e 'const l=require("./package-lock.json");
  for (const d of Object.keys(require("./package.json").dependencies)) {
    const e = l.packages["node_modules/"+d];
    console.log(d, e.version, e.license, e.integrity);
  }'

# Copyright lines, quoted from what each package actually ships
for p in $(node -p 'Object.keys(require("./package.json").dependencies).join(" ")'); do
  f=$(ls node_modules/$p | grep -iE '^licen[sc]e' | head -1)
  echo "$p -> ${f:-NONE}"; [ -n "$f" ] && grep -m1 -i copyright "node_modules/$p/$f"
done

# Production licence census
npm ls --omit=dev --all --parseable | sed 's|.*/node_modules/||' | sort -u | while read p; do
  [ -f "node_modules/$p/package.json" ] && node -p "require('./node_modules/$p/package.json').license"
done | sort | uniq -c

# Fonts
git ls-files | grep -icE '\.(woff2?|ttf|otf|eot)$'    # 0
```
