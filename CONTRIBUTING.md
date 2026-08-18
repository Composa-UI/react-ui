# Contributing to `@composa/ui`

`@composa/ui` is the Figma-fidelity component kit behind the Composa editor. It
is a product UI layer, not a general-purpose component library — see
[Scope](#scope) before proposing a new component.

## Licence and the CLA

This project is licensed under the **Apache License, Version 2.0** (`LICENSE`).

Contributions are accepted under that licence. In addition, we require a
**Contributor Licence Agreement** before a pull request can be merged: you keep
copyright in what you write, and you grant the project the rights it needs to
distribute your contribution under Apache-2.0 and to relicense the project as a
whole in future.

> **Not yet automated.** The CLA text and the bot that records signatures are
> not wired up in this repository. Until they are, a maintainer will ask you to
> sign before merging. Do not assume a pull request is mergeable because CI is
> green.

By opening a pull request you confirm that you wrote the contribution yourself,
or have the right to submit it, and that you are not introducing third-party
code without its notice (see [Third-party code](#third-party-code)).

## Getting set up

```bash
git clone https://github.com/Composa-UI/react-ui.git
cd react-ui
npm ci          # exits 0 — no flags needed
npm run dev     # component playground on the Vite dev server
```

Node 22 is what CI uses (`.github/workflows/verify.yml`).

The playground is the component gallery: every component has at least one view,
selected with the `?view=` query parameter. It is the fastest way to see what
already exists before you build something new.

## Gates

`npm run check` is what CI runs. It is three commands:

```bash
npm run typecheck   # tsc --noEmit
npm run test        # vitest run
npm run build       # vite build
```

Run it before opening a pull request. There is also a Playwright suite:

```bash
npm run test:e2e
```

**`test:e2e` is deliberately not part of `npm run check` today, and it is not
green.** Do not treat a red e2e run as proof your change broke something, and do
not treat a green `npm run check` as proof it did not. If your change touches
layout or geometry, run the relevant spec directly and say what you saw.

Unit tests live beside the component they cover, as `Component.test.tsx`;
Playwright specs live in `e2e/` as `*.e2e.ts` or `*.spec.ts`. Vitest is
configured to collect only `src/**`, so an e2e spec will never be picked up by
the unit runner.

## What a good pull request looks like

- **One concern.** Component changes and dependency changes in the same PR make
  both harder to review.
- **A test that would have failed before.** For a behavioural change, the
  reviewer should be able to revert your source change, watch the test fail, and
  restore it.
- **Evidence, not adjectives.** If you claim a gate passes, paste the command
  and its exit code. If you claim a visual matches a reference, say how you
  checked.
- **No new fixture that names a real person.** See below.

## Demo data and fixtures

Playground fixtures and test fixtures are rendered in a browser and published
with the repository. They must not contain real personal data.

- Email addresses must use an RFC 2606 reserved domain — `example.com`,
  `example.net`, `example.org`. `src/components/ui3/ShareModal.test.tsx` shows
  the pattern.
- Names in fixtures must be invented. Do not use a colleague's name, even with
  a placeholder address.
- Component defaults that stand in for a real account — a GitHub handle, a
  repository, a profile URL — must be neutral placeholders
  (`octocat` / `hello-world`), because an exported component renders its
  defaults for every consumer that does not pass props.

There is a guard for this: `src/fixtures-privacy.test.ts` fails if a tracked
source file contains an email address outside the reserved domains, or the
maintainer's GitHub handle. If it fires on your branch, change the fixture — do
not add your value to the allowlist.

## Third-party code

This repository vendors no third-party source, and that is a property worth
keeping. If you need code from another project:

1. Prefer adding it as a dependency over copying it in.
2. If it must be copied, preserve the upstream licence verbatim under
   `third_party/<project>/`, add an entry to `docs/third-party-notices.md`
   recording version, upstream URL and every modification you made, and add the
   notice to `NOTICE` if it travels into built output.

Adding a dependency is a review-worthy change on its own. Say what imports it,
and check its licence is permissive — the production tree is currently 100%
permissive (MIT/ISC/0BSD) and a copyleft dependency would be a blocking change,
not a detail.

## Scope

Components here exist to serve the Composa editor: `Timeline`, `PropertyPanel`,
`SlidesPanel`, `LayerList`, `CropToolbar`, and the dialogs around them. Requests
for general-purpose primitives that the editor does not need (a date picker, a
data table, a carousel) will be declined — not because they are bad ideas, but
because this kit is not the place for them.

## Reporting a security issue

Do not open a public issue. Contact the maintainers privately and give them time
to respond before disclosing.
