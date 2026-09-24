// Carbon-style documentation content, one page per component.
//
// Modeled on carbondesignsystem.com's component pages: each annotated component
// gets its OWN page (see App.tsx routing) with a page header (name + category
// chip + one-line intent) and Usage / Style / Code / Accessibility sub-tabs.
// Following Carbon:
//   - the LIVE DEMO lives inside the Usage tab (an embedded Storybook story,
//     Carbon's <StorybookDemo>), not as a separate canvas above the tabs;
//   - the CODE tab is a lede + a "Documentation" section of framework
//     ResourceCards that link out to Storybook (Carbon's code.mdx), then the
//     live demo and the import/example snippet. Composa ships React only, so the
//     framework grid is a single React card.
// Foundations and Token compliance are their own pages too.
import { useState, type ReactNode } from "react";
import {
  components,
  tokens,
  colorVal,
  slug,
  storybookHref,
  storybookIframeHref,
  variantsFor,
  prevNextComponent,
  routeForComponent,
  GROUP_ORDER,
  type Annotation,
  type Theme,
} from "./data";

// ── Small JSX renderers (ports of the generator's helpers) ──────────────────

function codeList(v: unknown[]): ReactNode {
  return v.map((x, i) => (
    <code key={i}>{String(x)}</code>
  ));
}

// key/value table. Values may be a nested object (rendered as key -> value
// pairs), an array (rendered as code chips), or a scalar.
function KV({ obj }: { obj?: Record<string, unknown> }) {
  if (!obj || !Object.keys(obj).length) return null;
  return (
    <table className="docs-kv">
      <tbody>
        {Object.entries(obj).map(([k, v]) => (
          <tr key={k}>
            <th>{k}</th>
            <td>
              {v && typeof v === "object" && !Array.isArray(v) ? (
                Object.entries(v as Record<string, unknown>).map(([kk, vv], i) => (
                  <span key={kk}>
                    {i > 0 && <br />}
                    <code>{kk}</code> {"→ "}
                    <code>{String(vv)}</code>
                  </span>
                ))
              ) : Array.isArray(v) ? (
                <span className="chips">{codeList(v)}</span>
              ) : (
                <code>{String(v)}</code>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Page shell: Carbon's black masthead ─────────────────────────────────────
// Carbon component pages open with a tall black band carrying the big, light
// page title; on component pages the tab bar sits at the bottom of that same
// black band. The page description (lede) and everything else render below it on
// the content surface — never inside the black band.

function Masthead({
  eyebrow,
  title,
  tabs,
}: {
  eyebrow?: ReactNode;
  title: string;
  tabs?: ReactNode;
}) {
  return (
    <header className="masthead">
      <div className="masthead-body">
        {eyebrow && <div className="masthead-eyebrow">{eyebrow}</div>}
        <h1 className="masthead-title">{title}</h1>
      </div>
      {tabs}
    </header>
  );
}

// Carbon's <PageDescription>: the lede paragraph at the top of the content, on
// the content surface (below the masthead).
function PageDescription({ children }: { children: ReactNode }) {
  return <p className="page-description">{children}</p>;
}

// ── Home / overview ─────────────────────────────────────────────────────────

export function HomePage() {
  const groups = GROUP_ORDER.map(g => ({
    group: g,
    items: components.filter(c => c.category === g),
  })).filter(g => g.items.length > 0);

  return (
    <>
      <Masthead eyebrow="Design system · v0" title="Composa UI" />
      <div className="page">
        <PageDescription>
          A Figma-fidelity component kit — the visual layer for the Composa editor. Foundations,
          token compliance, and every component with a live, interactive preview. Code · Figma ·
          docs from one token source.
        </PageDescription>

        <div className="home-cards">
        <a className="home-card" href="#/foundations">
          <h3>Foundations</h3>
          <p>Color, radius and spacing swatches generated from the single token source.</p>
          <span className="home-card-go">Open →</span>
        </a>
        <a className="home-card" href="#/status">
          <h3>Status</h3>
          <p>Per-component token compliance and accessibility, verified by the annotation contract.</p>
          <span className="home-card-go">Open →</span>
        </a>
      </div>

      <h2 className="home-h2">Components</h2>
      <p className="muted">
        {components.length} components across {groups.length} groups. Each is its own page with
        Usage, Style, Code and Accessibility docs beside a live preview.
      </p>
      <div className="home-groups">
        {groups.map(({ group, items }) => (
          <section key={group} className="home-group">
            <h3>{group}</h3>
            <ul>
              {items.map(c => (
                <li key={c.component}>
                  <a href={routeForComponent(c)}>{c.component}</a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

        <p className="muted footer">
          Built from <code>tokens/composa.tokens.json</code> + <code>annotations/*.json</code>;
          previews render the real components from <code>src</code>.
        </p>
      </div>
    </>
  );
}

// ── Foundations page ────────────────────────────────────────────────────────

export function Foundations() {
  const radii = Object.entries(tokens.radius);
  const space = Object.entries(tokens.spacer).sort(
    (a, b) => parseInt(a[1].value) - parseInt(b[1].value),
  );
  return (
    <>
      <Masthead eyebrow="Overview" title="Foundations" />
      <div className="page">
        <PageDescription>
          Generated from <code>tokens/composa.tokens.json</code>, the single source of truth. Each
          swatch shows light and dark.
        </PageDescription>
        <h2>Color</h2>
      <div className="grid-sw">
        {Object.entries(tokens.color).map(([k, e]) => (
          <div className="sw" key={k}>
            <div className="sw-pair">
              <span style={{ background: colorVal(e.value) }} />
              <span style={{ background: colorVal(e.dark ?? e.value) }} />
            </div>
            <code>--color-{k}</code>
          </div>
        ))}
      </div>
      <h2>Radius</h2>
      <div className="grid-ra">
        {radii.map(([k, e]) => (
          <div className="ra" key={k}>
            <span style={{ borderRadius: e.value }} />
            <code>radius/{k}</code>
          </div>
        ))}
      </div>
        <h2>Spacing</h2>
        <div className="grid-sp">
          {space.map(([k, e]) => (
            <div className="sp" key={k}>
              <span style={{ width: e.value }} />
              <code>
                spacer/{k} · {e.value}
              </code>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Status page: token compliance + accessibility (Carbon's status matrix) ──

function isTokenOnly(c: Annotation) {
  return !!(c.enforce && c.enforce.tokensOnly === true);
}

// A compact status tick (Carbon's A11yStatusTag): green ✓ when true, muted – otherwise.
function Tick({ on }: { on: boolean }) {
  return (
    <span className={"status-tick " + (on ? "on" : "off")} aria-hidden>
      {on ? "✓" : "–"}
    </span>
  );
}

// Accessibility facts a component's annotation + the contract expose.
function a11yFacts(c: Annotation) {
  const a = (c.a11y ?? {}) as Record<string, unknown>;
  const enforce = (c.enforce ?? {}) as { role?: string; ariaRole?: boolean };
  const roleRaw = enforce.role || (typeof a.role === "string" ? a.role : "");
  const role = String(roleRaw).replace(/\s*\(.*$/, "").trim() || "—";
  return {
    role,
    roleVerified: enforce.ariaRole === true,
    keyboard: "keyboard" in a,
    labels: "label" in a || "labels" in a || "labelless" in a,
  };
}

// Carbon's A11yStatusTag: a status pill. on = enforced/tested (green),
// mid = documented/declared (blue), off = not documented (muted).
function A11yTag({ tone, label }: { tone: "on" | "mid" | "off"; label: string }) {
  return <span className={"a11y-tag " + tone}>{label}</span>;
}

// Per-component accessibility status cards (Carbon's <A11yStatus layout="cards">).
// One card per AX aspect Composa's contract can speak to, each with a status tag.
function A11yStatusCards({ c }: { c: Annotation }) {
  const f = a11yFacts(c);
  const cards: { title: string; value: ReactNode; tone: "on" | "mid" | "off"; tag: string }[] = [
    {
      title: "ARIA role",
      value: f.role === "—" ? "—" : <code>{f.role}</code>,
      tone: f.roleVerified ? "on" : "mid",
      tag: f.roleVerified ? "Verified in CI" : "Declared",
    },
    {
      title: "Keyboard navigation",
      value: f.keyboard ? "Interaction documented" : "Not documented",
      tone: f.keyboard ? "on" : "off",
      tag: f.keyboard ? "Documented" : "Not documented",
    },
    {
      title: "Labels & names",
      value: f.labels ? "Naming documented" : "Not documented",
      tone: f.labels ? "on" : "off",
      tag: f.labels ? "Documented" : "Not documented",
    },
  ];
  return (
    <div className="a11y-cards">
      {cards.map(cd => (
        <div className="a11y-card" key={cd.title}>
          <div className="a11y-card-title">{cd.title}</div>
          <div className="a11y-card-value">{cd.value}</div>
          <A11yTag tone={cd.tone} label={cd.tag} />
        </div>
      ))}
    </div>
  );
}

export function StatusPage() {
  const tokenOK = components.filter(isTokenOnly).length;
  const roleVerified = components.filter(c => a11yFacts(c).roleVerified).length;

  const sections: Sec[] = [
    {
      id: "token-compliance",
      label: "Token compliance",
      body: (
        <>
          <p className="doc-lede">
            Which components are fully token-bound. Enforced by the annotation contract: a component
            may claim <code>tokensOnly</code> only if its source carries no hardcoded hex, so this is
            verified, not asserted. <b>
              {tokenOK} of {components.length}
            </b>{" "}
            are verified token-only; the rest name their hardcoded values — the hardcoded-hex debt to
            burn down.
          </p>
          <table className="docs-kv docs-tc">
            <tbody>
              <tr>
                <th>Component</th>
                <th>Status</th>
                <th>Note</th>
              </tr>
              {components.map(c => {
                const ok = isTokenOnly(c);
                const note = (c.tokens && c.tokens.note) || "";
                return (
                  <tr key={c.component}>
                    <td>
                      <a href={routeForComponent(c)}>{c.component}</a>
                    </td>
                    <td>
                      {ok ? (
                        <span className="tc-ok">✓ token-only</span>
                      ) : note ? (
                        <span className="tc-warn">⚠ hardcoded values</span>
                      ) : (
                        <span className="tc-na">— not asserted</span>
                      )}
                    </td>
                    <td className="muted">{note || (ok ? "Source verified hex-free." : "")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      ),
    },
    {
      id: "accessibility",
      label: "Accessibility",
      body: (
        <>
          <p className="doc-lede">
            What each component's annotation documents, and what the contract verifies. <b>Role
            verified</b> means the contract renders the component and fails CI if the declared ARIA
            role is absent — <b>
              {roleVerified} of {components.length}
            </b>{" "}
            are render-verified today.
          </p>
          <table className="docs-kv docs-tc status-a11y">
            <tbody>
              <tr>
                <th>Component</th>
                <th>ARIA role</th>
                <th>Role verified</th>
                <th>Keyboard</th>
                <th>Labels</th>
              </tr>
              {components.map(c => {
                const f = a11yFacts(c);
                return (
                  <tr key={c.component}>
                    <td>
                      <a href={routeForComponent(c)}>{c.component}</a>
                    </td>
                    <td>
                      {f.role === "—" ? <span className="muted">—</span> : <code>{f.role}</code>}
                    </td>
                    <td>
                      <Tick on={f.roleVerified} />
                    </td>
                    <td>
                      <Tick on={f.keyboard} />
                    </td>
                    <td>
                      <Tick on={f.labels} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="muted" style={{ marginTop: 12 }}>
            Role verified is enforced in CI; Keyboard and Labels reflect whether the component's a11y
            annotation documents that behavior. Carbon publishes a similar per-component
            accessibility-status matrix — this is Composa's equivalent, alongside token compliance.
          </p>
        </>
      ),
    },
  ];

  return (
    <>
      <Masthead eyebrow="Overview" title="Status" />
      <div className="page">
        <PageDescription>
          How each component measures up — token compliance and accessibility, both driven by the
          enforced annotation contract.
        </PageDescription>
        <TabBody sections={sections} />
      </div>
    </>
  );
}

// ── Live demo (Carbon <StorybookDemo>) ──────────────────────────────────────
// The isolated Storybook story, embedded as an iframe. The page's light/dark
// toggle is wired into the story's `composaMode` global (via storybookIframeHref)
// so the embedded demo tracks the surrounding page's theme, and a caption links
// out to the full story for controls / variants / API docs.

function StorybookDemo({ c, theme }: { c: Annotation; theme: Theme }) {
  const variants = variantsFor(c);
  const [variant, setVariant] = useState(variants[0]);
  const [demoTheme, setDemoTheme] = useState<Theme>(theme);
  const current = variants.includes(variant) ? variant : variants[0];
  return (
    <div className="sb-demo">
      {/* Theme + Variant selectors, attached to the top of the demo frame
          (Carbon's StorybookDemo). */}
      <div className="sb-demo-frameset">
        <div className="sb-demo-toolbar">
          <label className="sb-demo-fluid">
            <span className="sb-demo-fluid-label">Theme selector</span>
            <div className="sb-demo-fluid-field">
              <select value={demoTheme} onChange={e => setDemoTheme(e.target.value as Theme)}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </label>
          {variants.length > 1 && (
            <label className="sb-demo-fluid">
              <span className="sb-demo-fluid-label">Variant selector</span>
              <div className="sb-demo-fluid-field">
                <select value={current} onChange={e => setVariant(e.target.value)}>
                  {variants.map(v => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          )}
        </div>
        <div className="sb-demo-stage">
          <iframe
            key={`${demoTheme}-${current}`}
            title={`${c.component} live demo`}
            className="sb-demo-frame"
            src={storybookIframeHref(c, demoTheme, current)}
            loading="lazy"
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
          />
        </div>
      </div>
      <p className="sb-demo-caption">
        This live demo is the isolated Storybook story — the real component rendered from the
        design-system tokens. View the{" "}
        <a href={storybookHref(c, current)} target="_blank" rel="noreferrer">
          full demo
        </a>{" "}
        on Storybook for additional information such as its controls and API docs.
      </p>
    </div>
  );
}

// ── Multi-column token table (Carbon Style page) ────────────────────────────
// Flattens the annotation's `tokens` into Element · Property · Token rows, the
// element spanning its property rows, so Style reads like Carbon's color tables.
function TokenTable({ tokens }: { tokens?: Record<string, unknown> }) {
  if (!tokens || !Object.keys(tokens).length) return null;
  const note = typeof tokens.note === "string" ? (tokens.note as string) : undefined;
  type Row = { element: string; span: number; property: string; token: string };
  const rows: Row[] = [];
  for (const [element, val] of Object.entries(tokens)) {
    if (element === "note") continue;
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const entries = Object.entries(val as Record<string, unknown>);
      entries.forEach(([property, token], i) =>
        rows.push({ element, span: i === 0 ? entries.length : 0, property, token: String(token) }),
      );
    } else {
      rows.push({ element, span: 1, property: "", token: String(val) });
    }
  }
  if (!rows.length) return null;
  // token-ish values (a slash/dot path, no spaces) render as code chips.
  const isToken = (t: string) => /[/.]/.test(t) && !/\s/.test(t);
  return (
    <>
      <table className="docs-kv docs-tc token-table">
        <tbody>
          <tr>
            <th>Element</th>
            <th>Property</th>
            <th>Token</th>
          </tr>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.span > 0 && (
                <td className="token-el" rowSpan={r.span}>
                  {r.element}
                </td>
              )}
              <td className="token-prop">{r.property || "—"}</td>
              <td className="token-val">{isToken(r.token) ? <code>{r.token}</code> : r.token}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {note && (
        <p className="muted" style={{ marginTop: 12 }}>
          {note}
        </p>
      )}
    </>
  );
}

// ── Page footer: prev/next pagination + site footer (Carbon) ────────────────
const REPO_URL = "https://github.com/Composa-UI/react-ui";
const BUILT_ON = new Date().toISOString().slice(0, 10);

function ComponentFooter({ c }: { c: Annotation }) {
  const { prev, next } = prevNextComponent(c);
  return (
    <footer className="doc-footer">
      <nav className="doc-prevnext" aria-label="Component pagination">
        {prev ? (
          <a className="doc-prevnext-link" href={routeForComponent(prev)}>
            <span className="doc-prevnext-dir">Previous</span>
            <span className="doc-prevnext-name">{prev.component}</span>
          </a>
        ) : (
          <span className="doc-prevnext-link is-empty" aria-hidden />
        )}
        {next ? (
          <a className="doc-prevnext-link is-next" href={routeForComponent(next)}>
            <span className="doc-prevnext-dir">Next</span>
            <span className="doc-prevnext-name">{next.component}</span>
          </a>
        ) : (
          <span className="doc-prevnext-link is-empty" aria-hidden />
        )}
      </nav>
      <div className="doc-siteftr">
        <div className="doc-siteftr-links">
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={`${import.meta.env.BASE_URL}storybook/`} target="_blank" rel="noreferrer">
            Storybook
          </a>
        </div>
        <div className="doc-siteftr-meta">
          <div>
            <b>Composa</b> UI · Design system v0
          </div>
          <div>Last updated {BUILT_ON}</div>
          <div>Built from one token source · © {new Date().getFullYear()} Composa</div>
        </div>
      </div>
    </footer>
  );
}

// React brand mark for the Code tab's framework ResourceCard.
function ReactLogo() {
  return (
    <svg className="fw-logo" viewBox="-11.5 -10.23 23 20.46" width="42" height="38" aria-hidden>
      <circle r="2.05" fill="currentColor" />
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  );
}

// Carbon's "Launch" glyph (open in new window), for a ResourceCard's corner.
function LaunchIcon() {
  return (
    <svg className="launch-icon" width="20" height="20" viewBox="0 0 32 32" fill="currentColor" aria-hidden>
      <path d="M26 28H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10v2H6v20h20V16h2v10a2 2 0 0 1-2 2Z" />
      <path d="M20 2v2h6.586L18 12.586 19.414 14 28 5.414V12h2V2Z" />
    </svg>
  );
}

// A Carbon-style resource tile: a big clickable card with the framework name,
// its logo, and a Launch corner. Links out to the framework's Storybook.
function ResourceCard({
  subTitle,
  href,
  children,
}: {
  subTitle: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <a className="resource-card" href={href} target="_blank" rel="noreferrer">
      <span className="resource-card-title">{subTitle}</span>
      <span className="resource-card-foot">
        <span className="resource-card-logo">{children}</span>
        <LaunchIcon />
      </span>
    </a>
  );
}

// ── Carbon page chrome: AnchorLinks, Section, Do/Don't ──────────────────────
// Carbon's component pages carry the same anatomy on every tab: an "on this
// page" AnchorLinks box, `##` sections in a fixed rhythm, and Do/Don't cards.
// These render that same chrome from Composa's annotation data.

type Sec = { id: string; label: string; body: ReactNode };

// Carbon's <AnchorLinks>: an "on this page" box. The site routes on the URL
// hash (#/components/...), so these scroll to the section element instead of
// setting a fragment (which would clobber the route).
function AnchorLinks({ items }: { items: Sec[] }) {
  if (items.length < 2) return null;
  return (
    <nav className="anchor-links" aria-label="On this page">
      {items.map(it => (
        <button
          key={it.id}
          type="button"
          className="anchor-link"
          onClick={() =>
            document.getElementById(it.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        >
          <span aria-hidden className="anchor-caret">↳</span>
          {it.label}
        </button>
      ))}
    </nav>
  );
}

// A tab body rendered Carbon-style: the AnchorLinks box, then each `##` section
// with a stable id the links scroll to. Empty sections are dropped upstream.
function TabBody({ sections }: { sections: Sec[] }) {
  return (
    <div>
      <AnchorLinks items={sections} />
      {sections.map(s => (
        <section key={s.id} id={s.id} className="doc-section">
          <h2 className="section-h">{s.label}</h2>
          {s.body}
        </section>
      ))}
    </div>
  );
}

// Carbon's <DoDont>: green-barred "do" / red-barred "don't" cards. Composa's
// use_when → do, dont_use_when → don't.
function DoDont({ dos, donts }: { dos?: string[]; donts?: string[] }) {
  const hasDo = dos && dos.length > 0;
  const hasDont = donts && donts.length > 0;
  if (!hasDo && !hasDont) return null;
  return (
    <div className="dodont-grid">
      <div className="dodont-col">
        <div className="dodont-head do">Do</div>
        {(dos ?? []).map((t, i) => (
          <div className="dodont do" key={i}>
            <span className="dodont-mark" aria-hidden>✓</span>
            <p>{t}</p>
          </div>
        ))}
        {!hasDo && <p className="muted dodont-empty">No specific guidance.</p>}
      </div>
      <div className="dodont-col">
        <div className="dodont-head dont">Don’t</div>
        {(donts ?? []).map((t, i) => (
          <div className="dodont dont" key={i}>
            <span className="dodont-mark" aria-hidden>✕</span>
            <p>{t}</p>
          </div>
        ))}
        {!hasDont && <p className="muted dodont-empty">No specific guidance.</p>}
      </div>
    </div>
  );
}

// ── Per-component page ───────────────────────────────────────────────────────

const TABS = [
  { id: "usage", label: "Usage" },
  { id: "style", label: "Style" },
  { id: "code", label: "Code" },
  { id: "a11y", label: "Accessibility" },
] as const;

export function ComponentPage({ c, theme }: { c: Annotation; theme: Theme }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("usage");
  const tokensOnly = isTokenOnly(c);
  const enforce = (c.enforce ?? {}) as { role?: string; ariaRole?: boolean; tokensOnly?: boolean };
  const hasSlots = !!(c.slots && Object.keys(c.slots).length > 0);
  const hasVariants = !!(c.variants && Object.keys(c.variants).length > 0);
  const hasStates = !!(c.states && c.states.length > 0);
  const hasGuidance = !!((c.use_when && c.use_when.length) || (c.dont_use_when && c.dont_use_when.length));

  // Carbon's Usage page: Live demo → guidance (Do/Don't) → Variants → Anatomy
  // (slots) → States. The intent shows as the PageDescription lede above the
  // anchor links, so there's no separate Overview section. Only the sections the
  // annotation supports render.
  const usageSections: Sec[] = [
    {
      id: "live-demo",
      label: "Live demo",
      body: <StorybookDemo c={c} theme={theme} />,
    },
    ...(hasGuidance
      ? [{
          id: "guidance",
          label: "When to use",
          body: <DoDont dos={c.use_when} donts={c.dont_use_when} />,
        } as Sec]
      : []),
    ...(hasVariants
      ? [{ id: "variants", label: "Variants", body: <KV obj={c.variants} /> } as Sec]
      : []),
    ...(hasSlots
      ? [{ id: "anatomy", label: "Anatomy", body: <KV obj={c.slots} /> } as Sec]
      : []),
    ...(hasStates
      ? [{
          id: "states",
          label: "States",
          body: <p className="muted chips">{codeList(c.states!)}</p>,
        } as Sec]
      : []),
  ];

  // Carbon's Style page: Color/Typography/Structure — Composa is fully
  // token-bound, so its Style is Design tokens + the verified compliance status.
  const styleSections: Sec[] = [
    {
      id: "tokens",
      label: "Design tokens",
      body: (
        <>
          <p className="doc-lede">
            {tokensOnly
              ? "Every visual property binds to a design token — the source is verified hex-free by the annotation contract."
              : "Mostly token-bound; this component still carries some hardcoded values, listed below as the hardcoded-hex debt to burn down."}
          </p>
          <TokenTable tokens={c.tokens} />
        </>
      ),
    },
    {
      id: "compliance",
      label: "Token compliance",
      body: (
        <p className="muted">
          {tokensOnly ? (
            <>
              <span className="tc-ok">✓ token-only</span> — no hardcoded hex in source.{" "}
            </>
          ) : (
            <>
              <span className="tc-warn">⚠ hardcoded values</span> present.{" "}
            </>
          )}
          See the <a href="#/status">Status page</a> for every component's compliance.
        </p>
      ),
    },
  ];

  // Carbon's Accessibility page: What Carbon provides → Design recommendations →
  // Development considerations + A11yStatus. Composa's honest analog: what the
  // kit provides (a11y annotation), how the annotation contract verifies it, and
  // the kit-wide development considerations.
  const a11ySections: Sec[] = [
    {
      id: "status",
      label: "Accessibility status",
      body: <A11yStatusCards c={c} />,
    },
    {
      id: "provides",
      label: "What the kit provides",
      body: <KV obj={c.a11y} />,
    },
    {
      id: "verified",
      label: "How it’s verified",
      body: (
        <ul className="docs-ul">
          {enforce.ariaRole && enforce.role && (
            <li>
              The <code>role=&quot;{enforce.role}&quot;</code> is render-verified: the annotation
              contract test fails if the component does not actually render it.
            </li>
          )}
          {enforce.tokensOnly && (
            <li>
              The <code>tokensOnly</code> claim is checked against source — a declared token-only
              component may carry no hardcoded hex.
            </li>
          )}
          <li>
            The annotation itself is schema-validated and coverage-gated: the component is “done”
            only once it carries a valid annotation.
          </li>
        </ul>
      ),
    },
    {
      id: "dev",
      label: "Development considerations",
      body: (
        <ul className="docs-ul">
          <li>
            Interactive elements carry real <code>aria-label</code>s / <code>role</code>s — the
            editor’s e2e suite locates kit surfaces by role and label, so a missing label is a
            consumer break, not just an a11y gap.
          </li>
          <li>
            Radix popovers, menus, and dialogs portal to <code>document.body</code>; hosts mirror{" "}
            <code>data-composa-mode</code> onto <code>&lt;html&gt;</code> so portalled overlays
            resolve the right theme. Keep portalled content labelled.
          </li>
          <li>
            Controlled + uncontrolled discipline: value comes from props, changes emit via{" "}
            <code>onXChange</code>, and the host owns document state.
          </li>
        </ul>
      ),
    },
  ];

  return (
    <>
      <Masthead
        eyebrow={<span className="cat">{c.category}</span>}
        title={c.component}
        tabs={
          <div
            className="masthead-tabs"
            role="tablist"
            aria-label={`${c.component} documentation`}
          >
            {TABS.map(t => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={"masthead-tab" + (tab === t.id ? " is-active" : "")}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="page">
        <div className="tab-panel" role="tabpanel">
          {tab === "usage" && (
            <>
              <PageDescription>{c.intent}</PageDescription>
              <TabBody sections={usageSections} />
            </>
          )}

          {tab === "style" && (
            <>
              <PageDescription>
                How {c.component} is styled — every value below is a design token from the single
                source, so it reskins and flips light/dark with the system.
              </PageDescription>
              <TabBody sections={styleSections} />
            </>
          )}

          {tab === "code" && (
            <div className="code-tab">
              {/* Carbon's code.mdx: a lede, then a "Documentation" grid of
                  framework cards that path the reader to Storybook, then the live
                  demo. Composa ships React only, so one card. */}
              <PageDescription>
                Preview the {c.component} component with the React live demo. For detailed code usage
                documentation, see the Storybook.
              </PageDescription>

              <h2 className="section-h" id="documentation">
                Documentation
              </h2>
              <div className="resource-card-group">
                <ResourceCard subTitle="React" href={storybookHref(c)}>
                  <ReactLogo />
                </ResourceCard>
              </div>

              <h2 className="section-h" id="code-live-demo">
                Live demo
              </h2>
              <StorybookDemo c={c} theme={theme} />

              <h2 className="section-h" id="install">
                Install &amp; import
              </h2>
              <pre>
                <code>
                  {c.code.import}
                  {"\n\n"}
                  {c.code.example}
                </code>
              </pre>
            </div>
          )}

          {tab === "a11y" && (
            <>
              <PageDescription>
                Accessibility is built in. Here’s what the kit provides for {c.component}, and how
                the annotation contract verifies it.
              </PageDescription>
              <TabBody sections={a11ySections} />
            </>
          )}
        </div>
      </div>
      <ComponentFooter c={c} />
    </>
  );
}

export function NotFoundPage({ slug: s }: { slug: string }) {
  return (
    <>
      <Masthead eyebrow="404" title="Page not found" />
      <div className="page">
        <PageDescription>
          No component or page matches <code>{s}</code>.
        </PageDescription>
        <p>
          <a href="#/">← Back to overview</a>
        </p>
      </div>
    </>
  );
}

export { slug };
