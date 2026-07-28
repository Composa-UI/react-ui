import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Menu, MenuRow } from "./Menu";

describe("Menu", () => {
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
    // Fixed max-height on the container + vertical scroll for the overflow,
    // while horizontal overflow stays clipped to preserve the rounded corners.
    expect(html).toMatch(/max-height:\s*280px/);
    expect(html).toContain("overflow-y-auto");
    expect(html).toContain("overflow-x-hidden");
    expect(html).not.toMatch(/\boverflow-hidden\b/);
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
