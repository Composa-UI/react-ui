import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MENU_MIN_WIDTH, Menu, MenuRow, menuNavigationIndex } from "./Menu";

describe("Menu width floor (Composa#627)", () => {
  it("hugs its content from a Figma-tight floor, and never caps the width", () => {
    const html = renderToStaticMarkup(
      <Menu>
        <MenuRow label="One" onClick={() => undefined} />
      </Menu>,
    );
    // The floor is small enough that short menus stop opening wider than Figma's.
    expect(MENU_MIN_WIDTH).toBe(120);
    expect(html).toMatch(new RegExp(`min-width:\\s*${MENU_MIN_WIDTH}px`));
    // `inline-flex` is what makes the menu hug: the floor only ever pads a menu
    // narrower than it, so a row can never be clipped or wrapped by the floor.
    expect(html).toContain("inline-flex");
    expect(html).not.toMatch(/max-width/i);
  });

  it("still honours an explicit floor for menus that swap content in place", () => {
    const html = renderToStaticMarkup(
      <Menu minWidth={190}>
        <MenuRow label="HD 16:9 (1920 × 1080)" onClick={() => undefined} />
      </Menu>,
    );
    expect(html).toMatch(/min-width:\s*190px/);
  });

  // Guard the owner complaint itself: every DS menu must take the shared floor, so
  // nobody silently re-inflates one back past Figma's width. The project-canvas menu
  // is the single allowed exception (it swaps presets ↔ the Custom W/H/fps editor
  // while open and would otherwise jump) and states so through a named constant.
  it("has no ad-hoc per-menu width floors left in the design system", () => {
    // Vite's raw glob — this repo has no @types/node, so the source sweep goes
    // through the bundler rather than fs.
    const sources = (import.meta as unknown as {
      glob: (pattern: string, options: unknown) => Record<string, string>;
    }).glob("./*.tsx", { query: "?raw", import: "default", eager: true });

    const offenders = Object.entries(sources)
      .filter(([file]) => !file.includes(".test."))
      .flatMap(([file, source]) => [...source.matchAll(/<Menu\s+minWidth=\{([^}]+)\}/g)]
        .map(match => `${file}: minWidth={${match[1]}}`))
      .filter(entry => !entry.includes("PROJECT_CANVAS_MENU_MIN_WIDTH"));

    expect(offenders).toEqual([]);
  });
});

describe("Menu", () => {
  it("wraps Arrow navigation and supports Home/End", () => {
    expect(menuNavigationIndex(0, 6, "ArrowDown")).toBe(1);
    expect(menuNavigationIndex(5, 6, "ArrowDown")).toBe(0);
    expect(menuNavigationIndex(0, 6, "ArrowUp")).toBe(5);
    expect(menuNavigationIndex(3, 6, "Home")).toBe(0);
    expect(menuNavigationIndex(3, 6, "End")).toBe(5);
  });
  it("grows unbounded (no scroll) when no maxHeight is given", () => {
    const html = renderToStaticMarkup(
      <Menu>
        <MenuRow label="One" onClick={() => undefined} />
      </Menu>,
    );
    expect(html).toContain("overflow-hidden");
    expect(html).not.toContain("overflow-y-auto");
    expect(html).not.toMatch(/max-height/i);
  });

  it("caps its height and scrolls the overflow when maxHeight is set", () => {
    const html = renderToStaticMarkup(
      <Menu maxHeight={280}>
        <MenuRow label="One" onClick={() => undefined} />
      </Menu>,
    );
    // Fixed max-height on the container (clipped for crisp rounded corners); the
    // overflow scrolls inside our ScrollArea overlay-thumb viewport with the native
    // scrollbar hidden — owner rule: every scrolling surface uses the overlay thumb,
    // never a native scrollbar.
    expect(html).toMatch(/max-height:\s*280px/);
    expect(html).toContain("overflow-hidden");
    expect(html).toContain("data-composa-scroll-viewport");
    expect(html).toContain("overflow-y-auto");
    expect(html).toContain("scrollbar-width:none");
  });
});

describe("MenuRow", () => {
  it("exposes checked state only through checked-capable menu roles", () => {
    const selected = renderToStaticMarkup(
      <MenuRow type="checkmark" selectionRole="radio" label="Included" checked onClick={() => undefined} />,
    );
    const unselected = renderToStaticMarkup(
      <MenuRow type="checkmark" selectionRole="radio" label="Excluded" onClick={() => undefined} />,
    );

    expect(selected).toContain('role="menuitemradio"');
    expect(selected).toContain('aria-checked="true"');
    expect(unselected).toContain('role="menuitemradio"');
    expect(unselected).toContain('aria-checked="false"');
  });

  it("keeps disabled explanations keyboard-reachable and exposes submenu ownership", () => {
    const disabled = renderToStaticMarkup(
      <MenuRow label="Exports" disabled disabledReason="Project export is not available yet." />,
    );
    const submenu = renderToStaticMarkup(
      <MenuRow label="Color profile" hasSubmenu submenuExpanded submenuControls="color-profile-menu" onClick={() => undefined} />,
    );

    expect(disabled).toContain('role="menuitem"');
    expect(disabled).toContain('tabindex="0"');
    expect(disabled).toContain('aria-disabled="true"');
    expect(disabled).toContain("Project export is not available yet.");
    expect(disabled).toMatch(/aria-describedby="[^"]+"/);
    expect(submenu).toContain('aria-haspopup="menu"');
    expect(submenu).toContain('aria-expanded="true"');
    expect(submenu).toContain('aria-controls="color-profile-menu"');
  });
});
