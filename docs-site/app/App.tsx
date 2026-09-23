import { useEffect, useState } from "react";
import {
  components,
  GROUP_ORDER,
  slug,
  parseRoute,
  routeForComponent,
  type Route,
} from "./data";
import {
  HomePage,
  Foundations,
  TokenCompliance,
  ComponentPage,
  NotFoundPage,
} from "./content";

type Theme = "light" | "dark";

// ── Hash routing (GitHub Pages is static, so `#/...` — no BrowserRouter) ──────
function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() =>
    parseRoute(typeof window === "undefined" ? "" : window.location.hash),
  );
  useEffect(() => {
    const onHash = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  // Scroll the content column back to the top whenever the route changes.
  useEffect(() => {
    document.querySelector("main")?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [route.kind, route.kind === "component" ? route.component.component : ""]);
  return route;
}

function isActive(route: Route, href: string) {
  const target = href.replace(/^#/, "");
  if (route.kind === "home") return target === "/" || target === "";
  if (route.kind === "foundations") return target === "/foundations";
  if (route.kind === "token-compliance") return target === "/token-compliance";
  if (route.kind === "component") return target === `/components/${slug(route.component.component)}`;
  return false;
}

function Sidebar({ route }: { route: Route }) {
  const groups = GROUP_ORDER.map(g => ({
    group: g,
    items: components.filter(c => c.category === g),
  })).filter(g => g.items.length > 0);

  const link = (href: string, label: string) => (
    <a href={href} className={isActive(route, href) ? "is-active" : undefined}>
      {label}
    </a>
  );

  return (
    <nav className="side" aria-label="Component navigation">
      <a className="side-brand" href="#/">
        <b>Composa</b> UI
      </a>
      <div className="nav-group">Overview</div>
      {link("#/", "Home")}
      {link("#/foundations", "Foundations")}
      {link("#/token-compliance", "Token compliance")}
      {groups.map(({ group, items }) => (
        <div key={group}>
          <div className="nav-group">{group}</div>
          {items.map(c => {
            const href = routeForComponent(c);
            return (
              <a
                key={c.component}
                href={href}
                className={isActive(route, href) ? "is-active" : undefined}
                aria-current={isActive(route, href) ? "page" : undefined}
              >
                {c.component}
              </a>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function Page({ route, theme }: { route: Route; theme: Theme }) {
  switch (route.kind) {
    case "home":
      return <HomePage />;
    case "foundations":
      return <Foundations />;
    case "token-compliance":
      return <TokenCompliance />;
    case "component":
      // theme drives the embedded Storybook demo's `composaMode` global.
      return <ComponentPage c={route.component} theme={theme} />;
    case "not-found":
      return <NotFoundPage slug={route.slug} />;
  }
}

export default function App() {
  const [theme, setTheme] = useState<Theme>("light");
  const route = useRoute();

  // Mirror the mode onto <html> too, so portalled overlays (menus, tooltips,
  // modals) that escape to document.body still resolve the right theme.
  useEffect(() => {
    const el = document.documentElement;
    if (theme === "dark") el.setAttribute("data-composa-mode", "dark");
    else el.removeAttribute("data-composa-mode");
  }, [theme]);

  return (
    <div className="app" data-composa-mode={theme === "dark" ? "dark" : undefined}>
      <Sidebar route={route} />
      <main>
        <div className="topbar">
          <div className="crumbs">Composa UI · Design system</div>
          <button
            type="button"
            className="theme-toggle"
            aria-pressed={theme === "dark"}
            onClick={() => setTheme(t => (t === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? "☀ Light" : "☾ Dark"}
          </button>
        </div>
        <Page route={route} theme={theme} />
      </main>
    </div>
  );
}
