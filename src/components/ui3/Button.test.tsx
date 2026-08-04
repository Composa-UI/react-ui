import { type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";
import { Tooltip } from "./Tooltip";

describe("Button form ownership", () => {
  it("defaults to a non-submitting button", () => {
    expect(renderToStaticMarkup(<Button label="Cancel" />)).toContain('type="button"');
  });

  it("allows an explicit submit button", () => {
    expect(renderToStaticMarkup(<Button label="Rename" type="submit" />)).toContain('type="submit"');
  });
});

describe("Button accessible labels", () => {
  it("uses one explicit label for an icon-only accessible name and canonical tooltip", () => {
    const element = Button({
      ariaLabel: "Preview",
      iconLead: "center",
      icon: <svg data-testid="preview-icon" />,
    }) as ReactElement<{ label: string; children: ReactElement<{ "aria-label"?: string }> }>;

    expect(element.type).toBe(Tooltip);
    expect(element.props.label).toBe("Preview");
    expect(element.props.children.type).toBe("button");
    expect(element.props.children.props["aria-label"]).toBe("Preview");
    expect(renderToStaticMarkup(element)).not.toContain(">Button<");
  });

  it("keeps visible-label buttons and their existing anatomy when an accessible override is supplied", () => {
    const html = renderToStaticMarkup(<Button label="Open" ariaLabel="Open preview" variant="Secondary" />);
    expect(html).toContain('aria-label="Open preview"');
    expect(html).toContain("<span>Open</span>");
  });

  it("preserves the legacy default label when no explicit accessible label is supplied", () => {
    expect(renderToStaticMarkup(<Button />)).toContain("<span>Button</span>");
  });
});
