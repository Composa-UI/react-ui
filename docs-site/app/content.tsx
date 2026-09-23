// Carbon-style documentation content, one page per component.
//
// Each annotated component gets its OWN page (see App.tsx routing): a page
// header (name + category chip + one-line intent), a prominent live preview of
// the REAL component, then Usage / Style / Code / Accessibility sub-tabs.
// Foundations and Token compliance are their own pages too. Everything the old
// single-scroll app showed is preserved — just reorganized.
import { useState, type ReactNode } from "react";
import {
  components,
  tokens,
  colorVal,
  slug,
  storybookHref,
  routeForComponent,
  GROUP_ORDER,
  type Annotation,
} from "./data";
import { FIXTURES, FIXTURE_NOTES } from "./fixtures";

// ── Small JSX renderers (ports of the generator's helpers) ──────────────────

function List({ items }: { items?: string[] }) {
  if (!items || !items.length) return null;
  return (
    <ul className="docs-ul">
      {items.map((i, n) => (
        <li key={n}>{i}</li>
      ))}
    </ul>
  );
}

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

// ── Page shell: a Carbon-style page header ──────────────────────────────────

function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow?: ReactNode;
  title: string;
  lede?: ReactNode;
}) {
  return (
    <header className="page-header">
      {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
      <h1 className="page-title">{title}</h1>
      {lede && <p className="page-lede">{lede}</p>}
    </header>
  );
}

// ── Home / overview ─────────────────────────────────────────────────────────

export function HomePage() {
  const groups = GROUP_ORDER.map(g => ({
    group: g,
    items: components.filter(c => c.category === g),
  })).filter(g => g.items.length > 0);

  return (
    <article className="page">
      <PageHeader
        eyebrow="Design system · v0"
        title="Composa UI"
        lede={
          <>
            A Figma-fidelity component kit — the visual layer for the Composa editor. Foundations,
            token compliance, and every component with a live, interactive preview. Code · Figma ·
            docs from one token source.
          </>
        }
      />

      <div className="home-cards">
        <a className="home-card" href="#/foundations">
          <h3>Foundations</h3>
          <p>Color, radius and spacing swatches generated from the single token source.</p>
          <span className="home-card-go">Open →</span>
        </a>
        <a className="home-card" href="#/token-compliance">
          <h3>Token compliance</h3>
          <p>Which components are fully token-bound, and the hardcoded-hex debt to burn down.</p>
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
    </article>
  );
}

// ── Foundations page ────────────────────────────────────────────────────────

export function Foundations() {
  const radii = Object.entries(tokens.radius);
  const space = Object.entries(tokens.spacer).sort(
    (a, b) => parseInt(a[1].value) - parseInt(b[1].value),
  );
  return (
    <article className="page">
      <PageHeader
        eyebrow="Overview"
        title="Foundations"
        lede={
          <>
            Generated from <code>tokens/composa.tokens.json</code>, the single source of truth. Each
            swatch shows light and dark.
          </>
        }
      />
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
    </article>
  );
}

// ── Token compliance page ───────────────────────────────────────────────────

function isTokenOnly(c: Annotation) {
  return !!(c.enforce && c.enforce.tokensOnly === true);
}

export function TokenCompliance() {
  const n = components.filter(isTokenOnly).length;
  return (
    <article className="page">
      <PageHeader
        eyebrow="Overview"
        title="Token compliance"
        lede={
          <>
            Which annotated components are fully token-bound. Enforced by the annotation contract: a
            component may claim <code>tokensOnly</code> only if its source carries no hardcoded hex,
            so this is verified, not asserted. <b>
              {n} of {components.length}
            </b>{" "}
            are verified token-only; the rest name their hardcoded values — that is the
            hardcoded-hex debt to burn down.
          </>
        }
      />
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
    </article>
  );
}

// ── Live preview canvas ─────────────────────────────────────────────────────

function Preview({ c }: { c: Annotation }) {
  const render = FIXTURES[c.component];
  const note = FIXTURE_NOTES[c.component];
  return (
    <div className="preview">
      <div className="preview-head">
        <span className="preview-dot" aria-hidden />
        Live preview
      </div>
      <div className="preview-stage">
        {render ? render() : <p className="muted">No preview fixture.</p>}
      </div>
      {note && <p className="preview-note">{note}</p>}
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

export function ComponentPage({ c }: { c: Annotation }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("usage");
  const tokensOnly = isTokenOnly(c);
  const styleNote = tokensOnly
    ? "Every visual property binds to a token — source verified hex-free."
    : "Mostly token-bound; carries some hardcoded values (see the note below).";

  return (
    <article className="page component-page">
      <PageHeader
        eyebrow={<span className="cat">{c.category}</span>}
        title={c.component}
        lede={c.intent}
      />

      <Preview c={c} />

      <div className="docs-tabs" role="tablist" aria-label={`${c.component} documentation`}>
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={"docs-tab" + (tab === t.id ? " is-active" : "")}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tab-panel" role="tabpanel">
        {tab === "usage" && (
          <div>
            <h3>When to use</h3>
            <List items={c.use_when} />
            <h3>When not to use</h3>
            <List items={c.dont_use_when} />
            <h3>Variants</h3>
            <KV obj={c.variants} />
            {c.slots && Object.keys(c.slots).length > 0 && (
              <>
                <h3>Slots</h3>
                <KV obj={c.slots} />
              </>
            )}
            {c.states && c.states.length > 0 && (
              <>
                <h3>States</h3>
                <p className="muted chips">{codeList(c.states)}</p>
              </>
            )}
          </div>
        )}

        {tab === "style" && (
          <div>
            <h3>Tokens</h3>
            <p className="muted">{styleNote}</p>
            <KV obj={c.tokens} />
          </div>
        )}

        {tab === "code" && (
          <div className="code-tab">
            <div className="code-actions">
              <a
                className="storybook-link"
                href={storybookHref(c)}
                target="_blank"
                rel="noreferrer"
              >
                View in Storybook <span aria-hidden>↗</span>
              </a>
              <span className="muted code-actions-note">
                Opens this component's live, isolated story.
              </span>
            </div>
            <pre>
              <code>
                {c.code.import}
                {"\n\n"}
                {c.code.example}
              </code>
            </pre>
          </div>
        )}

        {tab === "a11y" && <KV obj={c.a11y} />}
      </div>
    </article>
  );
}

export function NotFoundPage({ slug: s }: { slug: string }) {
  return (
    <article className="page">
      <PageHeader
        eyebrow="404"
        title="Page not found"
        lede={
          <>
            No component or page matches <code>{s}</code>.
          </>
        }
      />
      <p>
        <a href="#/">← Back to overview</a>
      </p>
    </article>
  );
}

export { slug };
