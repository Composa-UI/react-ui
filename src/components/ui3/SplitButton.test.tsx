import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SplitButton } from "./SplitButton";

describe("SplitButton semantics", () => {
  it("can keep the chevron on the connected secondary surface at rest", () => {
    const html = renderToStaticMarkup(<SplitButton icon={<span>icon</span>} actionLabel="Aspect" menuLabel="Aspect options" menuBackground="secondary" />);
    expect(html).toMatch(/aria-label="Aspect options"[^>]*bg-c-bg-secondary/);
  });

  it("puts controlled action and menu names on the existing button anatomy", () => {
    const html = renderToStaticMarkup(<SplitButton icon={<span>icon</span>} actionLabel="Pause preview" menuLabel="Preview options" />);

    expect(html).toContain('aria-label="Pause preview"');
    expect(html).toContain('aria-label="Preview options"');
    expect(html.match(/type="button"/g)).toHaveLength(2);
  });

  it("advertises menu disclosure on the chevron when a menuOpen state is supplied", () => {
    const closed = renderToStaticMarkup(<SplitButton icon={<span>icon</span>} actionLabel="Present" menuLabel="Present and preview options" menuOpen={false} />);
    expect(closed).toMatch(/aria-label="Present and preview options"[^>]*aria-haspopup="menu"/);
    expect(closed).toMatch(/aria-label="Present and preview options"[^>]*aria-expanded="false"/);

    const open = renderToStaticMarkup(<SplitButton icon={<span>icon</span>} actionLabel="Present" menuLabel="Present and preview options" menuOpen />);
    expect(open).toMatch(/aria-label="Present and preview options"[^>]*aria-expanded="true"/);
  });

  it("carries a brand-selected primary and can disable only the primary segment", () => {
    const selected = renderToStaticMarkup(<SplitButton icon={<span>icon</span>} actionLabel="Pause presentation" menuLabel="menu" selected />);
    expect(selected).toMatch(/aria-label="Pause presentation"[^>]*aria-pressed="true"/);
    expect(selected).toContain("bg-c-bg-brand");

    const disabled = renderToStaticMarkup(<SplitButton icon={<span>icon</span>} actionLabel="Present" menuLabel="menu" disabled menuOpen={false} />);
    // Primary is natively disabled; the chevron stays operable (no disabled attr).
    expect(disabled).toMatch(/<button[^>]*aria-label="Present"[^>]*disabled=""/);
    const chevron = disabled.match(/<button[^>]*aria-label="menu"[^>]*>/)?.[0];
    expect(chevron).toBeTruthy();
    expect(chevron).not.toContain("disabled");
  });

  it("keeps the two interactive segments flush without painting a divider column", () => {
    const html = renderToStaticMarkup(<SplitButton icon={<span>icon</span>} actionLabel="Present" menuLabel="Present and preview options" />);

    expect(html).not.toContain("gap-px");
    expect(html).toMatch(/^<div class="[^"]*bg-c-bg-secondary[^"]*">/);
    expect(html.match(/type="button"/g)).toHaveLength(2);
  });

  it("preserves the wrapper surface beneath an opacity-disabled primary segment", () => {
    const html = renderToStaticMarkup(<SplitButton icon={<span>icon</span>} actionLabel="Present" menuLabel="menu" disabled />);

    expect(html).toMatch(/^<div class="[^"]*bg-c-bg-secondary[^"]*">/);
    expect(html).toMatch(/aria-label="Present"[^>]*opacity-40/);
  });
});
