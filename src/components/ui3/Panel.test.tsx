import { renderToStaticMarkup } from "react-dom/server";
import { act, create } from "react-test-renderer";
import { afterEach, describe, expect, it } from "vitest";
import { IconButtonRow, PanelEntry, PanelSection, ScrollArea, type IconBtn } from "./Panel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const originalResizeObserver = globalThis.ResizeObserver;

afterEach(() => {
  globalThis.ResizeObserver = originalResizeObserver;
});

describe("IconButtonRow tooltips", () => {
  const btns: IconBtn[] = [
    { icon: <span>L</span>, label: "Align left", tooltip: "Align left", onClick: () => undefined },
    { icon: <span>C</span>, label: "Align center", onClick: () => undefined },
  ];

  it("keeps the accessible name on every icon-only button, tooltip or not", () => {
    // The tooltip is additive + SSR-safe (Tooltip renders its child straight through
    // when document is absent), so the accessible name is unaffected either way and a
    // tooltipped button renders without throwing. Hover behavior is browser-only.
    const html = renderToStaticMarkup(<IconButtonRow buttons={btns} />);
    expect(html).toContain('aria-label="Align left"');   // tooltip: "Align left"
    expect(html).toContain('aria-label="Align center"'); // no tooltip
    expect(html).toContain("<span>L</span>");
    expect(html).toContain("<span>C</span>");
  });

  // Owner feedback row #48: the selected ground was right, the glyph was not.
  // Asserted per-button so "the toggled-on one is brand, the rest are not" is what
  // fails — a blanket `toContain` would pass on a row that painted every glyph.
  it("paints a toggled-ON button's glyph brand, and only that one", () => {
    const html = renderToStaticMarkup(
      <IconButtonRow buttons={btns.map((b, i) => ({ ...b, active: i === 0 }))} />,
    );
    const buttons = html.match(/<button[^>]*>/g) ?? [];
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toContain("bg-c-bg-selected");
    expect(buttons[0]).toContain("text-c-text-brand");
    expect(buttons[1]).not.toContain("text-c-text-brand");
    expect(buttons[1]).toContain("text-c-icon");
  });

  // The blast-radius guard for the row above. The owner's row is about the timeline
  // TRACK HEADER, whose buttons are independent toggles (`active`). The same
  // primitive also renders the inspector's align / rotate / text-align controls,
  // which are a single-select group (`value`) — a segmented CHOICE, not a toggle
  // that is on. Those keep the selected ground and the neutral glyph, so fixing the
  // timeline does not silently restyle the inspector.
  it("leaves a single-select (`value`) row's glyphs neutral, ground only", () => {
    const html = renderToStaticMarkup(
      <IconButtonRow
        buttons={btns.map((b, i) => ({ ...b, value: `v${i}` }))}
        value="v0"
        onChange={() => undefined}
      />,
    );
    const buttons = html.match(/<button[^>]*>/g) ?? [];
    expect(buttons).toHaveLength(2);
    // The current choice still reads as chosen...
    expect(buttons[0]).toContain("bg-c-bg-selected");
    // ...but no glyph in the group turns brand.
    expect(html).not.toContain("text-c-text-brand");
    expect(buttons[0]).toContain("text-c-icon");
    expect(buttons[1]).toContain("text-c-icon");
  });
});

describe("PanelSection landmarks", () => {
  it("opts into a region named by the existing visible title", () => {
    const html = renderToStaticMarkup(<PanelSection title="Timeline" landmark><span>Content</span></PanelSection>);
    const labelledBy = html.match(/role="region" aria-labelledby="([^"]+)"/)?.[1];
    expect(labelledBy).toBeTruthy();
    expect(html).toContain(`id="${labelledBy}"`);
    expect(html).toContain(">Timeline</span>");
  });

  it("stays non-landmark by default and supports a clickable label source", () => {
    expect(renderToStaticMarkup(<PanelSection title="Layout" />)).not.toContain('role="region"');
    const html = renderToStaticMarkup(<PanelSection title="Selection colors" landmark onHeaderClick={() => undefined} />);
    const labelledBy = html.match(/role="region" aria-labelledby="([^"]+)"/)?.[1];
    expect(labelledBy).toBeTruthy();
    expect(html).toContain(`<button id="${labelledBy}"`);
  });
});

describe("PanelEntry stack anatomy", () => {
  it("keeps content first and the visibility action immediately beside remove", () => {
    const html = renderToStaticMarkup(<PanelEntry visible hideLabel="Hide effect" removeLabel="Remove effect"><span>Drop shadow</span></PanelEntry>);
    const content = html.indexOf("Drop shadow");
    const eye = html.indexOf('aria-label="Hide effect"');
    const remove = html.indexOf('aria-label="Remove effect"');
    expect(content).toBeGreaterThan(-1);
    expect(content).toBeLessThan(eye);
    expect(eye).toBeLessThan(remove);
  });
});

describe("ScrollArea dynamic content measurement", () => {
  it("observes the shared content wrapper and recalculates the thumb as Timeline rows change", () => {
    const viewport = { scrollTop: 0, scrollHeight: 100, clientHeight: 100 };
    const content = {};
    const observed: unknown[] = [];
    let resize: ResizeObserverCallback = () => undefined;
    globalThis.ResizeObserver = class ResizeObserverMock {
      constructor(callback: ResizeObserverCallback) { resize = callback; }
      observe(target: Element) { observed.push(target); }
      unobserve() {}
      disconnect() {}
    } as typeof ResizeObserver;

    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<ScrollArea><div>Timeline rows</div></ScrollArea>, {
        createNodeMock: element => {
          if (element.props["data-composa-scroll-viewport"]) return viewport;
          if (element.props["data-composa-scroll-content"]) return content;
          return null;
        },
      });
    });

    expect(observed).toEqual([viewport, content]);
    expect(renderer!.root.findAll(node => node.props["data-composa-scroll-thumb"])).toHaveLength(0);

    viewport.scrollHeight = 400;
    act(() => resize([], {} as ResizeObserver));
    let thumb = renderer!.root.find(node => node.props["data-composa-scroll-thumb"]);
    expect(thumb.props.style.height).toBe(25);

    viewport.scrollHeight = 800;
    act(() => resize([], {} as ResizeObserver));
    thumb = renderer!.root.find(node => node.props["data-composa-scroll-thumb"]);
    expect(thumb.props.style.height).toBe(24);
    act(() => renderer!.unmount());
  });
});
