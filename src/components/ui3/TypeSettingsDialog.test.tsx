import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("./InspectorDialog", () => ({
  COMPACT_INSPECTOR_DIALOG_WIDTH: 240,
  InspectorDialog: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) => (
    <div data-dialog={String(props.ariaLabel)} data-width={String(props.width)} data-elevation={String(props.elevation)}>
      {children}
    </div>
  ),
}));

import { TypeSettingsDialog } from "./TypeSettingsDialog";

describe("TypeSettingsDialog", () => {
  it("uses the shared draggable inspector shell and exposes only controlled metrics", () => {
    const html = renderToStaticMarkup(
      <TypeSettingsDialog
        open
        onClose={() => undefined}
        trigger={<button>Type</button>}
        value={{ lineHeight: 16, letterSpacing: 2 }}
        onChange={() => undefined}
      />,
    );
    expect(html).toContain('data-dialog="Type settings"');
    expect(html).toContain('data-width="240"');
    expect(html).toContain('data-elevation="400"');
    expect(html).toContain('aria-label="Type settings line height"');
    expect(html).toContain('aria-label="Type settings letter spacing"');
  });
});
