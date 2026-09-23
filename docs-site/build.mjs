// Composa UI docs site — v0. Zero-dependency static generator.
// Source of truth: tokens/composa.tokens.json (foundations) + annotations/*.json
// (each component's annotation, contract v1 — the same files the enforcement test
// checks). Emits docs-site/dist/index.html.
//   node docs-site/build.mjs
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const tokens = JSON.parse(await readFile(new URL("tokens/composa.tokens.json", root), "utf8")).tokens;
const dataDir = new URL("annotations/", root);
const files = (await readdir(dataDir)).filter(f => f.endsWith(".json") && f !== "annotation.schema.json");
const order = ["Button", "Tabs", "Inspector", "EditorShell", "NavRail", "Dropdown", "MenuRow", "SegmentedControl", "RadioButton", "Switch", "Checkbox", "Dial", "AlignmentControl", "CreationToolbar", "CropToolbar", "LayerList", "Notification", "Slider", "ListCell", "Tooltip", "SplitButton", "Menu", "NumericInput", "Modal", "InputField", "InspectorRailSwitcher", "SidePanel", "PanelSection"];
const components = (await Promise.all(files.map(async f => JSON.parse(await readFile(new URL(f, dataDir), "utf8")))))
  .sort((a, b) => (order.indexOf(a.component) + 1 || 99) - (order.indexOf(b.component) + 1 || 99));

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

// Resolve a --color-* alias one level so swatches paint a real value.
const colorVal = (raw) => {
  const m = String(raw).match(/^var\(--color-([\w-]+)\)$/);
  return m && tokens.color[m[1]] ? tokens.color[m[1]].value : raw;
};

function swatches() {
  const cells = Object.entries(tokens.color).map(([k, e]) => {
    const light = colorVal(e.value), dark = colorVal(e.dark ?? e.value);
    return `<div class="sw">
      <div class="sw-pair"><span style="background:${esc(light)}"></span><span style="background:${esc(dark)}"></span></div>
      <code>--color-${esc(k)}</code></div>`;
  }).join("");
  const radii = Object.entries(tokens.radius).map(([k, e]) =>
    `<div class="ra"><span style="border-radius:${esc(e.value)}"></span><code>radius/${esc(k)}</code></div>`).join("");
  const space = Object.entries(tokens.spacer).sort((a, b) => parseInt(a[1].value) - parseInt(b[1].value)).map(([k, e]) =>
    `<div class="sp"><span style="width:${esc(e.value)}"></span><code>spacer/${esc(k)} · ${esc(e.value)}</code></div>`).join("");
  return `<section id="foundations"><h1>Foundations</h1>
    <p class="lede">Generated from <code>tokens/composa.tokens.json</code>, the single source of truth. Each swatch shows light and dark.</p>
    <h2>Color</h2><div class="grid-sw">${cells}</div>
    <h2>Radius</h2><div class="grid-ra">${radii}</div>
    <h2>Spacing</h2><div class="grid-sp">${space}</div></section>`;
}

function list(items) { return `<ul>${items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>`; }
function kv(obj) {
  return `<table class="kv">${Object.entries(obj).map(([k, v]) =>
    `<tr><th>${esc(k)}</th><td>${typeof v === "object" && !Array.isArray(v)
      ? Object.entries(v).map(([kk, vv]) => `<code>${esc(kk)}</code> → <code>${esc(vv)}</code>`).join("<br>")
      : Array.isArray(v) ? v.map(x => `<code>${esc(x)}</code>`).join(" ") : `<code>${esc(v)}</code>`}</td></tr>`).join("")}</table>`;
}

function componentSection(c) {
  const id = slug(c.component);
  const tab = (name, body) => `<div class="panel" data-panel="${name}">${body}</div>`;
  const slots = c.slots && Object.keys(c.slots).length ? `<h3>Slots</h3>${kv(c.slots)}` : "";
  const states = (c.states || []).length
    ? `<h3>States</h3><p class="muted">${c.states.map(s => `<code>${esc(s)}</code>`).join(" ")}</p>` : "";
  const usage = `<p class="intent">${esc(c.intent)}</p>
    <h3>When to use</h3>${list(c.use_when || [])}
    <h3>When not to use</h3>${list(c.dont_use_when || [])}
    <h3>Variants</h3>${kv(c.variants || {})}
    ${slots}${states}`;
  const style = `<h3>Tokens</h3><p class="muted">Every visual property binds to a token — no hardcoded values.</p>${kv(c.tokens || {})}`;
  const code = `<pre><code>${esc(c.code.import)}\n\n${esc(c.code.example)}</code></pre>`;
  const a11y = kv(c.a11y || {});
  return `<section id="${id}"><div class="comp-head"><h1>${esc(c.component)}</h1><span class="cat">${esc(c.category)}</span></div>
    <div class="tabs" data-comp="${id}">
      <button class="tab is-active" data-tab="usage">Usage</button>
      <button class="tab" data-tab="style">Style</button>
      <button class="tab" data-tab="code">Code</button>
      <button class="tab" data-tab="a11y">Accessibility</button>
    </div>
    <div class="panels" data-comp="${id}">
      ${tab("usage", usage)}${tab("style", style)}${tab("code", code)}${tab("a11y", a11y)}
    </div></section>`;
}

const nav = [`<a href="#foundations">Foundations</a>`, ...components.map(c => `<a href="#${slug(c.component)}">${esc(c.component)}</a>`)].join("");

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Composa UI — Design System</title>
<style>
  :root{--brand:#795ee4;--ink:#1a1a1a;--muted:#6b6b70;--line:#e6e6e8;--bg:#fff;--code:#f6f6f7;--sans:Inter,-apple-system,"Segoe UI",Roboto,sans-serif;--mono:"SFMono-Regular",ui-monospace,Menlo,monospace}
  *{box-sizing:border-box}body{margin:0;font-family:var(--sans);color:var(--ink);background:var(--bg);-webkit-font-smoothing:antialiased}
  .app{display:flex;min-height:100vh}
  .side{width:230px;flex:0 0 230px;border-right:1px solid var(--line);padding:28px 20px;position:sticky;top:0;height:100vh;overflow:auto}
  .side .mark{font-weight:600;font-size:14px;margin-bottom:20px}.side .mark b{color:var(--brand)}
  .side a{display:block;color:var(--muted);text-decoration:none;font-size:13.5px;padding:6px 8px;border-radius:6px}
  .side a:hover{background:var(--code);color:var(--ink)}
  main{flex:1;min-width:0;padding:44px 56px;max-width:860px}
  section{padding-bottom:56px;border-bottom:1px solid var(--line);margin-bottom:56px}
  h1{font-size:30px;font-weight:600;margin:0}h2{font-size:16px;margin:32px 0 12px}h3{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:22px 0 8px}
  .lede,.intent{color:var(--muted);font-size:15px;line-height:1.6}.intent{color:var(--ink)}
  .comp-head{display:flex;align-items:baseline;gap:12px}.cat{font-size:12px;color:var(--muted);border:1px solid var(--line);border-radius:20px;padding:2px 10px}
  ul{margin:0;padding-left:18px}li{font-size:14px;line-height:1.7}
  code{font-family:var(--mono);font-size:12.5px;background:var(--code);padding:1px 5px;border-radius:4px}
  pre{background:#0f1012;color:#e8e8ea;padding:16px 18px;border-radius:10px;overflow:auto}pre code{background:none;color:inherit;font-size:12.5px;line-height:1.6}
  table.kv{border-collapse:collapse;width:100%;font-size:13.5px}table.kv th{text-align:left;color:var(--muted);font-weight:500;padding:7px 12px 7px 0;vertical-align:top;white-space:nowrap;width:1%}table.kv td{padding:7px 0;border-bottom:1px solid var(--line)}
  .tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin:20px 0 20px}
  .tab{background:none;border:none;border-bottom:2px solid transparent;color:var(--muted);font:inherit;font-size:13.5px;padding:8px 12px;cursor:pointer;margin-bottom:-1px}
  .tab.is-active{color:var(--brand);border-bottom-color:var(--brand);font-weight:550}
  .panel{display:none}.panel.is-active{display:block}
  .grid-sw{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}
  .sw-pair{display:flex;height:40px;border-radius:6px;overflow:hidden;border:1px solid var(--line)}.sw-pair span{flex:1}.sw code{display:block;margin-top:6px;font-size:11px;background:none}
  .grid-ra{display:flex;gap:18px;flex-wrap:wrap}.ra span{display:block;width:60px;height:60px;background:#efeefd;border:1.5px solid var(--brand)}.ra code{display:block;margin-top:6px;font-size:11px;background:none}
  .grid-sp{display:flex;flex-direction:column;gap:8px}.sp{display:flex;align-items:center;gap:12px}.sp span{display:block;height:14px;background:var(--brand);border-radius:2px}.sp code{background:none;font-size:11px}
  .muted{color:var(--muted);font-size:13px}
</style></head><body>
<div class="app">
  <nav class="side"><div class="mark"><b>Composa</b> UI</div>${nav}</nav>
  <main>
    <p class="muted" style="margin-top:0">Design system v0 — foundations + components, generated from source. Code · Figma · docs from one token source.</p>
    ${swatches()}
    ${components.map(componentSection).join("")}
    <p class="muted">Generated by <code>docs-site/build.mjs</code> from <code>tokens/composa.tokens.json</code> + <code>annotations/*.json</code>.</p>
  </main>
</div>
<script>
  document.querySelectorAll('.tabs').forEach(bar=>{
    const comp=bar.dataset.comp;
    bar.addEventListener('click',e=>{
      const t=e.target.closest('.tab'); if(!t)return;
      bar.querySelectorAll('.tab').forEach(x=>x.classList.toggle('is-active',x===t));
      document.querySelectorAll('.panels[data-comp="'+comp+'"] .panel').forEach(p=>p.classList.toggle('is-active',p.dataset.panel===t.dataset.tab));
    });
  });
  document.querySelectorAll('.panels').forEach(p=>p.querySelector('.panel').classList.add('is-active'));
</script>
</body></html>`;

await mkdir(new URL("docs-site/dist/", root), { recursive: true });
await writeFile(new URL("docs-site/dist/index.html", root), html);
console.log(`wrote docs-site/dist/index.html — ${components.length} components, ${Object.keys(tokens.color).length} colors`);
