// Story for Inspector — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Panels" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Panels/Inspector",
  parameters: {
    docs: { description: { component: "The composable right-rail shell. Renders the PanelSection children it is given, in order." } },
  },
  render: () => FIXTURES.Inspector(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
