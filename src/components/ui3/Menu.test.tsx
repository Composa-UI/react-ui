import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MenuRow } from "./Menu";

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
});
