// Story for Tabs — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Navigation" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Navigation/Tabs",
  parameters: {
    docs: { description: { component: "A tablist with roving focus. Pair with TabPanel for linked, accessible content regions." } },
  },
  render: () => FIXTURES.Tabs(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
