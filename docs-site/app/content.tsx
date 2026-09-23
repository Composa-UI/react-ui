// Renders the same documentation content the old static generator produced —
// Foundations swatches, the token-compliance table, and per-component
// Usage / Style / Code / Accessibility tabs — now as React, with a live,
// interactive preview of the real component beside each component's docs.
import { useState, type ReactNode } from "react";
import { components, tokens, colorVal, slug, type Annotation } from "./data";
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

// ── Overview: Foundations ───────────────────────────────────────────────────

export function Foundations() {
  const radii = Object.entries(tokens.radius);
  const space = Object.entries(tokens.spacer).sort(
    (a, b) => parseInt(a[1].value) - parseInt(b[1].value),
  );
  return (
    <section id="foundations" className="docs-section">
      <h1>Foundations</h1>
      <p className="docs-lede">
        Generated from <code>tokens/composa.tokens.json</code>, the single source of truth. Each
        swatch shows light and dark.
      </p>
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
    </section>
  );
}

// ── Overview: Token compliance ──────────────────────────────────────────────

function isTokenOnly(c: Annotation) {
  return !!(c.enforce && c.enforce.tokensOnly === true);
}

export function TokenCompliance() {
  const n = components.filter(isTokenOnly).length;
  return (
    <section id="token-compliance" className="docs-section">
      <h1>Token compliance</h1>
      <p className="docs-lede">
        Which annotated components are fully token-bound. Enforced by the annotation contract: a
        component may claim <code>tokensOnly</code> only if its source carries no hardcoded hex, so
        this is verified, not asserted. <b>{n} of {components.length}</b> are verified token-only;
        the rest name their hardcoded values — that is the hardcoded-hex debt to burn down.
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
                  <a href={`#${slug(c.component)}`}>{c.component}</a>
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
    </section>
  );
}

// ── Live preview pane ───────────────────────────────────────────────────────

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
        {render ? (
          render()
        ) : (
          <p className="muted">No preview fixture.</p>
        )}
      </div>
      {note && <p className="preview-note">{note}</p>}
    </div>
  );
}

// ── Per-component section ───────────────────────────────────────────────────

const TABS = [
  { id: "usage", label: "Usage" },
  { id: "style", label: "Style" },
  { id: "code", label: "Code" },
  { id: "a11y", label: "Accessibility" },
] as const;

function ComponentSection({ c }: { c: Annotation }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("usage");
  const tokensOnly = isTokenOnly(c);
  const styleNote = tokensOnly
    ? "Every visual property binds to a token — source verified hex-free."
    : "Mostly token-bound; carries some hardcoded values (see the note below).";

  return (
    <section id={slug(c.component)} className="docs-section">
      <div className="comp-head">
        <h1>{c.component}</h1>
        <span className="cat">{c.category}</span>
      </div>

      <div className="comp-grid">
        <div className="comp-docs">
          <div className="docs-tabs" role="tablist" aria-label={`${c.component} documentation`}>
            {TABS.map(t => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                className={"docs-tab" + (tab === t.id ? " is-active" : "")}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "usage" && (
            <div>
              <p className="intent">{c.intent}</p>
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
            <pre>
              <code>
                {c.code.import}
                {"\n\n"}
                {c.code.example}
              </code>
            </pre>
          )}

          {tab === "a11y" && <KV obj={c.a11y} />}
        </div>

        <Preview c={c} />
      </div>
    </section>
  );
}

export function ComponentSections() {
  return (
    <>
      {components.map(c => (
        <ComponentSection key={c.component} c={c} />
      ))}
    </>
  );
}
