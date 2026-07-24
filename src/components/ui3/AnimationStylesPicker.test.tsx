import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnimationStylesPicker } from "./AnimationStylesPicker";

const GROUPS = [
  {
    label: "Basic",
    options: [
      { value: "fade-in", label: "Fade In" },
      { value: "move-in", label: "Move In" },
    ],
  },
];

describe("AnimationStylesPicker", () => {
  it("renders the title, group header, and every option label", () => {
    const html = renderToStaticMarkup(
      <AnimationStylesPicker title="Build in styles" groups={GROUPS} value="fade-in" onSelect={() => undefined} />,
    );
    expect(html).toContain("Build in styles");
    expect(html).toContain("Basic");
    expect(html).toContain("Fade In");
    expect(html).toContain("Move In");
  });

  it("marks exactly the selected option as pressed", () => {
    const html = renderToStaticMarkup(
      <AnimationStylesPicker groups={GROUPS} value="move-in" onSelect={() => undefined} />,
    );
    expect((html.match(/aria-pressed="true"/g) ?? []).length).toBe(1);
    expect((html.match(/aria-pressed="false"/g) ?? []).length).toBe(1);
  });

  it("renders a searchable field and a close affordance when closable", () => {
    const html = renderToStaticMarkup(
      <AnimationStylesPicker groups={GROUPS} onSelect={() => undefined} onClose={() => undefined} />,
    );
    expect(html).toContain('aria-label="Search animation styles"');
    expect(html).toContain('aria-label="Close"');
  });
});
