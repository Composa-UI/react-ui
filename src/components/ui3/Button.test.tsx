import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

describe("Button form ownership", () => {
  it("defaults to a non-submitting button", () => {
    expect(renderToStaticMarkup(<Button label="Cancel" />)).toContain('type="button"');
  });

  it("allows an explicit submit button", () => {
    expect(renderToStaticMarkup(<Button label="Rename" type="submit" />)).toContain('type="submit"');
  });
});
