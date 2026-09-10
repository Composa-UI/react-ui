import type { ReactElement, ReactNode } from "react";
import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";

// Mock the anchored shell so children + trigger render inline and this suite can
// drive the picker's own behavior (roster, search, select, installed-fonts
// access) without Radix/portal geometry. The anchored contract itself is covered
// by FontPickerDialog.anchored.test.tsx.
vi.mock("./InspectorDialog", () => ({
  COMPACT_INSPECTOR_DIALOG_WIDTH: 240,
  COMPOSA_INSPECTOR_SURFACE_SELECTOR: "[data-composa-inspector-surface]",
  TYPE_SETTINGS_INSPECTOR_SIDE_OFFSET: 8,
  InspectorDialog: ({ children, trigger, open }: { children: ReactNode; trigger?: ReactElement; open?: boolean }) => (
    <div data-dialog="Fonts">{trigger}{open ? children : null}</div>
  ),
}));

import { FontPickerDialog, BUNDLED_FONTS, type FontEntry } from "./FontPickerDialog";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const trigger = <button type="button" aria-label="Fonts">Aa</button>;

function fontRowNames(renderer: ReactTestRenderer): string[] {
  return renderer.root
    .findAll(node => node.type === "button" && typeof node.props["aria-pressed"] === "boolean")
    .map(row => {
      const label = row.findAll(n => typeof n.children?.[0] === "string" && n.props.style?.fontFamily);
      return label[0]?.children?.[0] as string;
    })
    .filter(Boolean);
}

function byAria(renderer: ReactTestRenderer, label: string): ReactTestInstance {
  return renderer.root.find(node => node.props["aria-label"] === label);
}

function buttonWithText(renderer: ReactTestRenderer, text: string): ReactTestInstance {
  return renderer.root.find(
    node => node.type === "button" && node.findAll(n => n.children?.[0] === text).length > 0,
  );
}

describe("FontPickerDialog — roster, search, select", () => {
  it("falls back to the bundled roster when no fonts / google / installed sources apply", () => {
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(
        <FontPickerDialog open onClose={vi.fn()} trigger={trigger} onSelect={vi.fn()} enableGoogleFonts={false} installedSupported={false} />,
      );
    });
    const names = fontRowNames(renderer);
    expect(names).toContain("Inter");
    expect(names).toContain("Georgia");
    expect(names.length).toBe(BUNDLED_FONTS.length);
    act(() => renderer.unmount());
  });

  it("filters the list by the search query", () => {
    let renderer!: ReactTestRenderer;
    act(() => { renderer = create(<FontPickerDialog open onClose={vi.fn()} trigger={trigger} onSelect={vi.fn()} enableGoogleFonts={false} />); });
    act(() => byAria(renderer, "Search fonts").props.onChange({ target: { value: "geor" } }));
    const names = fontRowNames(renderer);
    expect(names).toEqual(["Georgia"]);
    act(() => renderer.unmount());
  });

  it("shows an empty state when nothing matches", () => {
    let renderer!: ReactTestRenderer;
    act(() => { renderer = create(<FontPickerDialog open onClose={vi.fn()} trigger={trigger} onSelect={vi.fn()} enableGoogleFonts={false} />); });
    act(() => byAria(renderer, "Search fonts").props.onChange({ target: { value: "zzzznope" } }));
    expect(fontRowNames(renderer)).toEqual([]);
    expect(renderer.root.findAll(n => n.children?.[0] === "No fonts found").length).toBe(1);
    act(() => renderer.unmount());
  });

  it("fires onSelect with the chosen font name", () => {
    const onSelect = vi.fn();
    let renderer!: ReactTestRenderer;
    act(() => { renderer = create(<FontPickerDialog open onClose={vi.fn()} trigger={trigger} value="Inter" onSelect={onSelect} enableGoogleFonts={false} />); });
    const georgiaRow = renderer.root.find(
      node => node.type === "button" && typeof node.props["aria-pressed"] === "boolean"
        && node.findAll(n => n.children?.[0] === "Georgia").length > 0,
    );
    act(() => georgiaRow.props.onClick());
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith("Georgia");
    act(() => renderer.unmount());
  });
});

describe("FontPickerDialog — Google Fonts suite", () => {
  it("merges the full Google Fonts suite into the searchable list and caps the visible rows", () => {
    const loadFont = vi.fn();
    let renderer!: ReactTestRenderer;
    act(() => { renderer = create(<FontPickerDialog open onClose={vi.fn()} trigger={trigger} onSelect={vi.fn()} loadFont={loadFont} installedSupported={false} />); });
    // Bundled brand fonts lead; the list is capped and nudges searching for the rest.
    const names = fontRowNames(renderer);
    expect(names[0]).toBe("Inter");
    expect(names.length).toBe(60);
    expect(renderer.root.findAll(n => typeof n.children?.[0] === "string" && n.children[0].startsWith("Showing 60 of ")).length).toBe(1);
    // The on-screen Google rows get their webfont stylesheet requested.
    expect(loadFont).toHaveBeenCalled();
    act(() => renderer.unmount());
  });

  it("finds a Google family by search and loads its webfont on select", () => {
    const loadFont = vi.fn();
    const onSelect = vi.fn();
    let renderer!: ReactTestRenderer;
    act(() => { renderer = create(<FontPickerDialog open onClose={vi.fn()} trigger={trigger} onSelect={onSelect} loadFont={loadFont} installedSupported={false} />); });
    act(() => byAria(renderer, "Search fonts").props.onChange({ target: { value: "Lobster" } }));
    const names = fontRowNames(renderer);
    expect(names).toContain("Lobster");
    const lobster = renderer.root.find(
      node => node.type === "button" && typeof node.props["aria-pressed"] === "boolean"
        && node.findAll(n => n.children?.[0] === "Lobster").length > 0,
    );
    act(() => lobster.props.onClick());
    expect(loadFont).toHaveBeenCalledWith("Lobster");
    expect(onSelect).toHaveBeenCalledWith("Lobster");
    act(() => renderer.unmount());
  });

  it("omits the Google suite when disabled (graceful — bundled only)", () => {
    let renderer!: ReactTestRenderer;
    act(() => { renderer = create(<FontPickerDialog open onClose={vi.fn()} trigger={trigger} onSelect={vi.fn()} enableGoogleFonts={false} installedSupported={false} />); });
    const names = fontRowNames(renderer);
    expect(names.length).toBe(BUNDLED_FONTS.length);
    expect(names).not.toContain("Lobster");
    act(() => renderer.unmount());
  });
});

describe("FontPickerDialog — installed-fonts access", () => {
  it("shows an honest unavailable note (no request affordance) when the API is unsupported", () => {
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(
        <FontPickerDialog open onClose={vi.fn()} trigger={trigger} onSelect={vi.fn()} installedSupported={false} />,
      );
    });
    expect(renderer.root.findAll(n => n.children?.[0] === "Installed fonts need a supported browser").length).toBe(1);
    expect(renderer.root.findAll(n => n.children?.[0] === "Use installed fonts").length).toBe(0);
    act(() => renderer.unmount());
  });

  it("hides the affordance entirely when enableInstalledFonts is false", () => {
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(
        <FontPickerDialog open onClose={vi.fn()} trigger={trigger} onSelect={vi.fn()} enableInstalledFonts={false} installedSupported />,
      );
    });
    expect(renderer.root.findAll(n => n.children?.[0] === "Use installed fonts").length).toBe(0);
    expect(renderer.root.findAll(n => n.children?.[0] === "Installed fonts need a supported browser").length).toBe(0);
    act(() => renderer.unmount());
  });

  it("opens the 306-4 access explainer and, on Continue, merges granted installed fonts", async () => {
    const installed: FontEntry[] = [{ name: "Departure Mono", stack: "'Departure Mono', monospace" }];
    const queryInstalledFonts = vi.fn().mockResolvedValue(installed);
    const onAvailableFontsChange = vi.fn();
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(
        <FontPickerDialog open onClose={vi.fn()} trigger={trigger} onSelect={vi.fn()} installedSupported queryInstalledFonts={queryInstalledFonts} onAvailableFontsChange={onAvailableFontsChange} />,
      );
    });

    // Open the explainer — mirrors the owner's shared Figma 306-4 dialog.
    act(() => buttonWithText(renderer, "Use installed fonts").props.onClick());
    expect(renderer.root.findAll(n => n.children?.[0] === "Need to use installed fonts?").length).toBe(1);

    // Continue → request local fonts → back to the list with the granted font merged.
    await act(async () => { buttonWithText(renderer, "Continue").props.onClick(); });
    expect(queryInstalledFonts).toHaveBeenCalledOnce();
    expect(onAvailableFontsChange).toHaveBeenCalledWith(installed);
    expect(fontRowNames(renderer)).toContain("Departure Mono");
    expect(renderer.root.findAll(n => n.children?.[0] === "1 installed font added").length).toBe(1);
    act(() => renderer.unmount());
  });

  it("degrades gracefully when local-font access is denied — keeps the bundled list, offers retry", async () => {
    const queryInstalledFonts = vi.fn().mockRejectedValue(new DOMException("denied", "NotAllowedError"));
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(
        <FontPickerDialog open onClose={vi.fn()} trigger={trigger} onSelect={vi.fn()} installedSupported queryInstalledFonts={queryInstalledFonts} />,
      );
    });
    act(() => buttonWithText(renderer, "Use installed fonts").props.onClick());
    await act(async () => { buttonWithText(renderer, "Continue").props.onClick(); });
    // Never throws; bundled roster intact; honest retry affordance shown.
    expect(fontRowNames(renderer)).toContain("Inter");
    expect(renderer.root.findAll(n => n.children?.[0] === "Couldn't access installed fonts — try again").length).toBe(1);
    act(() => renderer.unmount());
  });
});
