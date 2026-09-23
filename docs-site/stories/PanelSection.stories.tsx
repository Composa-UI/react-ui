// Story for PanelSection — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Panels" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Panels/PanelSection",
  parameters: {
    docs: { description: { component: "One inspector section: a 40px header (title + right-actions) over its content. The composable unit you stack inside Inspector; UI3 sections do not collapse — they appear and disappear by content presence." } },
  },
  render: () => FIXTURES.PanelSection(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
