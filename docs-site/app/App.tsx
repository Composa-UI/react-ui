import { useEffect, useState } from "react";
import { components, GROUP_ORDER, slug } from "./data";
import { Foundations, TokenCompliance, ComponentSections } from "./content";

type Theme = "light" | "dark";

function Sidebar() {
  const groups = GROUP_ORDER.map(g => ({
    group: g,
    items: components.filter(c => c.category === g),
  })).filter(g => g.items.length > 0);

  return (
    <nav className="side" aria-label="Component navigation">
      <div className="nav-group">Overview</div>
      <a href="#foundations">Foundations</a>
      <a href="#token-compliance">Token compliance</a>
      {groups.map(({ group, items }) => (
        <div key={group}>
          <div className="nav-group">{group}</div>
          {items.map(c => (
            <a key={c.component} href={`#${slug(c.component)}`}>
              {c.component}
            </a>
          ))}
        </div>
      ))}
    </nav>
  );
}

export default function App() {
  const [theme, setTheme] = useState<Theme>("light");

  // Mirror the mode onto <html> too, so portalled overlays (menus, tooltips,
  // modals) that escape to document.body still resolve the right theme.
  useEffect(() => {
    const el = document.documentElement;
    if (theme === "dark") el.setAttribute("data-composa-mode", "dark");
    else el.removeAttribute("data-composa-mode");
  }, [theme]);

  return (
    <div className="app" data-composa-mode={theme === "dark" ? "dark" : undefined}>
      <Sidebar />
      <main>
        <div className="topbar">
          <div className="mark">
            <b>Composa</b> UI
          </div>
          <button
            type="button"
            className="theme-toggle"
            aria-pressed={theme === "dark"}
            onClick={() => setTheme(t => (t === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? "☀ Light" : "☾ Dark"}
          </button>
        </div>
        <p className="muted intro">
          Design system v0 — foundations, token compliance, and every component with a live,
          interactive preview. Code · Figma · docs from one token source.
        </p>
        <Foundations />
        <TokenCompliance />
        <ComponentSections />
        <p className="muted footer">
          Built from <code>tokens/composa.tokens.json</code> + <code>annotations/*.json</code>;
          previews render the real components from <code>src</code>.
        </p>
      </main>
    </div>
  );
}
