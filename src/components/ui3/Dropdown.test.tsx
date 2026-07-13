import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Dropdown } from "./Dropdown";

describe("Dropdown accessible naming", () => {
  it("forwards a controlled accessible name without changing visible value", () => {
    const html = renderToStaticMarkup(<Dropdown ariaLabel="Speed: 1×" value="1×" />);
    expect(html).toContain('aria-label="Speed: 1×"');
    expect(html).toContain(">1×</span>");
  });

  it("names disabled deferred controls while preserving their disabled state", () => {
    const html = renderToStaticMarkup(<Dropdown ariaLabel="Volume" value="—" disabled />);
    expect(html).toContain('aria-label="Volume"');
    expect(html).toContain('disabled=""');
  });

  it("forwards native accessible names when the controlled alias is absent", () => {
    const html = renderToStaticMarkup(<Dropdown aria-label="Native name" value="Choice" />);
    expect(html).toContain('aria-label="Native name"');
  });
});
